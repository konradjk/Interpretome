$(function() {
window.ExploreView = Backbone.View.extend({
  el: $('#explore'),
  has_loaded: false,
  hidden: false,

  events: {
    'click #clear-snps': 'click_clear_snps',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #lookup-exercise': 'lookup_exercise',
    'click #submit-exercise': 'click_submit_exercise',
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
    
    var exercise = $('#toolbar-exercise option:selected').val();
    window.App.exercise = exercise;
    if (window.App.exercise == null || window.App.exercise == 'null') return;
    
    if (window.App.check_all() == false) return;
    
    $.getScript("/media/js/view/lectures/" + exercise + ".js", this.got_exercise_js);
  },
  
  got_exercise_js: function(response) {
    window.Generic = new GenericView();
    window.Generic.render();
    if (window.Generic.start() != false){
      $.get('/lookup/exercise/', {
        'exercise': window.App.exercise,
        'population': window.App.user.population
      }, this.got_exercise_data);
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
  
  toggle_unknown_genotypes: function() {
    this.el.find('.results-table:visible td:nth-child(2):contains("??")').parent().toggle();
    if (this.el.find('.results-table:visible tr:hidden').length != 0)
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Show unknown genotypes');
    else 
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Hide unknown genotypes');
  }
  
  });
});
