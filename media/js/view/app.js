$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),
  
  events: {
    'change #genome-file': 'change_genome',
    'click #clear-genome': 'clear_genome',
    'change #toolbar-population': 'change_population_from_toolbar',
    'change #check-population': 'change_population_from_check'
  },

  initialize: function() {
    _.bindAll(this, 
      'change_genome', 'clear_genome', 
	    'change_population', 'change_population_from_toolbar',
	    'change_population_from_check'
	  );
  },
  
  render: function() {
    this.el.find('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
  },
  
  change_genome: function(event) {
    //var load_progress = document.querySelector('#percent');
    //load_progress.style.width = '0%';
    //load_progress.textContent = '0%';
    
    //var parse_progress = document.querySelector('#percent_parsed');
    //parse_progress.style.width = '0%';
    //parse_progress.textContent = '0%';
    
    this.el.find('#loading-genome').dialog({modal: true, resizable: false});
    this.el.find('.progress-bar').progressbar({value: 0});
    this.el.find('.progress-bar > div').css('background', get_secondary_color());
    
    var reader = new FileReader();
    
    // I think this would refer to reader. Not actually sure, though.
    var self = this;
    reader.onprogress = function(event) {
      if (event.lengthComputable) {
        var percent = Math.round((event.loaded / event.total) * 100);
        if (percent < 100) {
          //load_progress.style.width = percentLoaded + '%';
          //load_progress.textContent = percentLoaded + '%';
          self.el.find('#loading-bar').progressbar('option', 'value', percent);
        }
      }
    };
    
    reader.onloadend = function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      $('#genome label, #genome input').hide();
      $('#global-settings #genome button').button({
        icons: {primary: 'ui-icon-circle-close'}
      }).show();
      window.App.user.parse_genome(event.target.result.split('\n'));
      
      // Should this be here?
      $('#please-load-genome').dialog('close');
    };
    reader.readAsText(event.target.files[0]);
  },
  
  clear_genome: function(event) {
    $('#confirm-clear-genome').dialog({
      modal: true, resizable: false, buttons: {
        'Cancel': function() {
          $(this).dialog('close');
        },
        'Clear': function() {
          $(this).dialog('close');
          window.location = '';
        }
      }
    });
  },
  
  change_population_from_toolbar: function(event) {
    var population = this.el.find('#toolbar-population option:selected').val();
    this.change_population(population);
  },
  
  change_population_from_check: function(event) {
    var population = this.el.find('#check-population option:selected').val();
    this.change_population(population);
  },
  
  change_population: function(population) {
    this.user.population = population;
    this.el.find('#please-select-population').dialog('close');
    this.el.find('#toolbar-population option[id="dummy"]').remove();
    this.el.find('#check-population option[id="dummy"]').remove();
    this.el.find(
      '#toolbar-population option[value="' + population + '"]'
    ).attr('selected', true);
    this.el.find(
      '#check-population option[value="' + population + '"]'
    ).attr('selected', true);
  },
  
  check_genome: function() {
    if (_.isEmpty(this.user.snps)) {
      this.el.find('#please-load-genome').dialog({
        modal: true, resizable: false, width: 400, buttons: {
          'Cancel': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    return true;
  },
  
  check_population: function() {
    if (this.user.population == null) {
      this.el.find('#please-select-population').dialog({
        modal: true, resizable: false, buttons: {
          'Okay': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    return true;
  },
  
  check_all: function() {
    if (this.check_genome() == false) return false;
    return this.check_population();
  }
  
});
});