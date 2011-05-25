$(function() {
window.ExploreView = Backbone.View.extend({
  el: $('#explore'),
  has_loaded: false,
  hidden: false,
  custom: false,

  events: {
    'change #exercise-file': 'load_exercise_file',
    'change #toolbar-exercise': 'change_exercise',
    'click #clear-snps': 'click_clear_snps',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #lookup-exercise': 'lookup_exercise',
    'click #submit-exercise': 'click_submit_exercise',
    'click #toggle-default': 'click_toggle_default',    
    'click #toggle-custom': 'click_toggle_custom',    
    'click #toggle-unknown-genotypes': 'toggle_unknown_genotypes'    
  },

  initialize: function() {
    _.bindAll(this,  
      'click_clear_snps', 
      'click_submit', 'click_confirm_submit', 
      'loaded',
      
      'lookup_exercise', 'got_exercise_js',
      'got_exercise_data',
      'click_submit_exercise',
      
      'toggle_unknown_genotypes'
    );
  },
  
  render: function() {
    $.get('/media/template/explore.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#explore');
	  this.el.append(response);
    
	  // Widget initialization.
	  this.el.find('button').button();
	  this.el.find('#exercises label').css('width', '50%');
	  this.el.find('#table-options').hide();
	  this.el.find('.submit').hide();
	  this.el.find('#custom-exercise').hide();
	  this.el.find('#toggle-default').hide();
	  this.el.find('#toggle-custom').show();
	  this.el.find('#default-exercises').show();
    
    $('#too-many-snps').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Okay!': function() {$(this).dialog('close');}
      }
    });
	  
	  this.has_loaded = true;
  },
  
  // Submission-related logic.
  click_submit: function(event) {
    var self = this;
    $('#confirm-submit-exercise').dialog({
      modal: true, resizable: false, buttons: {
        'Confirm' : function() {
          self.click_confirm_submit();
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  },

  load_exercise_file: function(event) {
    window.App.load_file(event.target.files[0], function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      window.App.custom_exercise.parse_exercise_snps(event.target.result.split('\n'));
    });
    this.custom = true;
    $('#toolbar-exercise option').get(0).selected = 'selected'
  },

  change_exercise: function(event) {
    this.custom = false;
  },

  click_confirm_submit: function(event) {
	  var ks = _.map(
	    $('#lookup-snps-table td.key'), 
	    function(v) {return $(v).text();}
	  );
	  var vs = _.map(
	    $('#lookup-snps-table td.value'), 
	    function(v) {return $(v).text();}
	  );
	  submission = window.App.user.serialize();
	  $.each(ks, function(i, v) {
	    submission[v] = vs[i];
	  });
          
    $.get('/submit/submit_snps/', submission, check_submission);
  },
  
  // Clear general lookup table or exercise-specific one.
  click_clear_snps: function(event) {
    var table = this.el.find('.results-table:visible');
    $(table).find('tr').slice(1).remove();
    $(table).hide();
	  this.el.find('#table-options').hide();
	  $('#help-exercise-help').empty();
    $('#exercise-content').empty();
    
  },
  lookup_exercise: function() {
    $('#help-exercise-help').empty();
    $('#exercise-content').empty();
    
    if (this.custom) {
      var exercise = 'custom';
    }
    else {
      var exercise = $('#toolbar-exercise option:selected').val();
    }
    window.App.exercise = exercise;
    if (window.App.exercise == null || window.App.exercise == 'null') return;
    
    if (window.App.check_all() == false) return;
    
    $.getScript("/media/js/view/lectures/" + exercise + ".js", this.got_exercise_js);
  },
  
  got_exercise_js: function(response) {
    window.Generic = new GenericView();
    window.Generic.render();
    if (window.Generic.start() != false){
      if (this.custom) {
	window.App.user.lookup_snps(
	  window.Generic.display, App.custom_exercise, _.keys(App.custom_exercise.snps), null);
      }
      else {
	$.get('/lookup/exercise/', {
	  'exercise': window.App.exercise,
	  'population': window.App.user.population
	}, this.got_exercise_data);
      }
    }
  },
  
  got_exercise_data: function(response) {
    window.App.user.lookup_snps(
      window.Generic.display, response, _.keys(response['snps']), response
    );
  },
  
  click_submit_exercise: function() {
    var self = this;
    $('#confirm-submit-exercise').dialog({
      modal: true, resizable: false, buttons: {
        'Okay': function() {
          var ks = _.map(
            $('.results-table :visible td.key'), 
            function(v) {return $(v).text();}
          );
          var vs = _.map(
            $('.results-table :visible td.value'), 
            function(v) {return $(v).text();}
          );
          
          var submission = {'exercise': window.App.exercise};
          
          submission = $.extend(submission, window.App.user.serialize());
          $.each(ks, function(i, v) {
            submission[v] = vs[i];
          });
          
          $.get('/submit/', submission, check_submission);
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  },
 
  click_toggle_custom: function() {
    $('#custom-exercise').show();
    $('#default-exercises').hide();
    $('#toggle-default').show();
    $('#toggle-custom').hide();
    console.log('hello');
  },
     
  click_toggle_default: function() {
    $('#custom-exercise').hide();
    $('#default-exercises').show();
    $('#toggle-default').hide();
    $('#toggle-custom').show();
    $('#toolbar-exercise option').get(0).selected = 'selected';
  },
  
  toggle_unknown_genotypes: function() {
    this.el.find('.results-table:visible td:nth-child(2):contains("??")').parent().toggle();
    if (this.el.find('.results-table:visible tr:hidden').length != 0)
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Show unknown genotypes');
    else 
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Hide unknown genotypes');
  }
  
  });
});
