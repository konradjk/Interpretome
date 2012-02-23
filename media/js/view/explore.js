$(function() {
window.ExploreView = Backbone.View.extend({
  el: $('#explore'),
  has_loaded: false,
  hidden: false,

  events: {
    'change #exercise-file': 'load_exercise_file',
    'click #clear-snps': 'click_clear_snps',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #fb-submit-exercise': 'click_fb_submit',
    'click #lookup-exercise': 'lookup_exercise',
    'click #lookup-custom': 'lookup_custom',
    'click #submit-exercise': 'click_submit_exercise',
    'click #toggle-unknown-genotypes': 'toggle_unknown_genotypes',   
    'click #annotation-file-help': 'click_annotation_file_help'    
  },

  initialize: function() {
    _.bindAll(this,  
      'click_clear_snps', 
      'click_submit', 'click_confirm_submit', 
      'loaded',
      
      'lookup_exercise', 'got_exercise_js',
      'got_custom_js', 'check_custom_length',
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
	  $(this.el).append(response);
    
	  // Widget initialization.
	  $('button').button();
	  $('#table-options').hide();
	  $('.submit').hide();
	  
	  $('#exercises').accordion();
	  //$('#exercises label').css('width', '50%');
	  //$('#default-exercises').show();
    
    $('#too-many-snps').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Okay!': function() {$(this).dialog('close');}
      }
    });

	  $('#annotation-file-help-dialog').dialog({
      modal: true, autoOpen: false, width: 1000, buttons: {
        'Okay!': function() {$(this).dialog('close');}
      }
    });
  
	  this.has_loaded = true;
  },
  
  click_annotation_file_help: function(event) {
    $('#annotation-file-help-dialog').dialog('open');
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
    var reader = new FileReader();
    var self = this;
    
    reader.onloadend = function(event) {
      window.App.custom_exercise.parse_exercise_snps(
        event.target.result.split('\n')
      )
    };
    reader.readAsText(event.target.files[0]);
  },
  
  lookup_custom: function() {
    $('#help-exercise-help').empty();
    $('#exercise-content').empty();
    if (window.App.check_all() == false) return;
    if (this.check_custom_length() == false) return;
    $.getScript('/media/js/view/lectures/custom.js', this.got_custom_js);
  },
  
  check_custom_length: function() {
    if (_.size(window.App.custom_exercise.snps) > 1000) {
      $('#too-many-snps').dialog('open');
      return false;
    }
    return true;
  },
  
  got_custom_js: function() {
    window.Generic = new GenericView();
    window.Generic.render();
  },

  click_fb_submit: function(event) {
    fb_text = window.Generic.fb_text;
    if( fb_text == undefined || fb_text == null) {
      fb_text = 'I just completed the ' + window.Generic.name + ' exercise on Interpretome!';
    }
    console.log(fb_text);
    FB.ui(
    {
      method: 'feed',
      name: 'Interpretome',
      caption: 'Explore your genome',
      description: 'Interpretome is a personal and secure genome interpretation index. Harness the power of your genotype!',
      message: fb_text,
      link: 'http://www.interpretome.com/'
    },
    function(response) {
      if (response && response.post_id) {
      } else {
      }
    }
  );
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
	  submission = get_user().serialize();
	  $.each(ks, function(i, v) {
	    submission[v] = vs[i];
	  });
          
    $.get('/submit/submit_snps/', submission, check_submission);
  },
  
  // Clear general lookup table or exercise-specific one.
  click_clear_snps: function(event) {
    var table = $('.results-table:visible');
    $(table).find('tr').slice(1).remove();
    $(table).hide();
	  $('#table-options').hide();
	  $('#help-exercise-help').empty();
    $('#exercise-content').empty();
    
  },
  lookup_exercise: function() {
    $('#help-exercise-help').empty();
    $('#exercise-content').empty();
    
    window.App.exercise = $('#toolbar-exercise option:selected').val();
    
    if (window.App.exercise == null || window.App.exercise == 'null') return;
    
    if (window.App.check_all() == false) return;
    
    $.getScript("/media/js/view/lectures/" + window.App.exercise + ".js", this.got_exercise_js);
  },
  
  got_exercise_js: function(response) {
    window.Generic = new GenericView();
    window.Generic.render();
    if (window.Generic.start() != false){
      $.get('/lookup/exercise/', {
        'exercise': window.App.exercise,
        'population': get_user().population
      }, this.got_exercise_data);
    }
  },
  
  got_exercise_data: function(response) {
    get_user().lookup_snps(
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
          
          submission = $.extend(submission, get_user().serialize());
          $.each(ks, function(i, v) {
            submission[v] = vs[i];
          });
          
          // This was a workaround for one exercise.
          // submission['submit'] = $('.submission').text();
          
          $.get('/submit/', submission, check_submission);
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  },
 
  toggle_unknown_genotypes: function() {
    $('.results-table:visible td:nth-child(2):contains("??")').parent().toggle();
    if ($('.results-table:visible tr:hidden').length != 0)
      $('#toggle-unknown-genotypes').button('option', 'label', 'Show unknown genotypes');
    else 
      $('#toggle-unknown-genotypes').button('option', 'label', 'Hide unknown genotypes');
  }
  
  });
});
