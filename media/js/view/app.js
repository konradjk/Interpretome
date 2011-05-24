$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),
  
  events: {
    'change #genome-file': 'change_genome',
    'click #clear-genome': 'clear_genome',
    'change #toolbar-population': 'change_population_from_toolbar',
    'change #check-population': 'change_population_from_check',
    'change .module_selection': 'select_module',
    'click #advanced-settings': 'click_settings'
  },

  initialize: function() {
    _.bindAll(this, 
      'change_genome', 'clear_genome',
      'check_genome', 'check_any_genome',
	    'change_population', 'change_population_from_toolbar',
	    'change_population_from_check',
      'select_module', 'change_module',
      'click_settings'
	  );
  },
  
  reverse_routes: {
    'start' : 'start',
    
    'lookup' : 'lookup',
    
    'explore': 'explore',
    
    'diabetes': 'clinical',
    'disease': 'clinical',
    'warfarin': 'clinical',
    'pharmacogenomics': 'clinical',
    
    'similarity': 'ancestry',
    'pca': 'ancestry',
    'painting': 'ancestry',
    'family': 'ancestry',
    
    'terms': 'terms'
  },
  
  render: function() {
    $('#advanced').hide();
    $('#clear-genome').button({ icons: {primary: 'ui-icon-circle-close'} }).show();
    $('#advanced-settings').button().show();
    $('#full-genome-tooltip').css('display: none');
    $('#full-genome-bar').mouseover(function(){
			$('#full-genome-tooltip').css({display:"none"}).fadeIn(50);
		}).mousemove(function(kmouse){
			$('#full-genome-tooltip').css({left:kmouse.pageX+15, top:kmouse.pageY+15});
		}).mouseout(function(){
			$('#full-genome-tooltip').fadeOut(50);
		});

    this.el.find('.module_selection').buttonset();
    this.el.find('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
    loc = window.location.hash.replace('#','');
    
    route = this.reverse_routes[loc];
    
    $(".module_selection label[for='module_" + route + "']").click();
    this.change_module(route);
  },
  
  click_settings: function() {
    $('#settings').dialog('open');
  },
  
  select_module: function() {
    var module = $('.module_selection label[aria-pressed="true"]').attr('for').replace('module_', '');
    this.change_module(module);
    $('.' + module).css('top', '2px').css('font-size', '0.9em').attr('line-height', '1.1em');
  },
  
  change_module: function(module) {
    var speed = 'fast';
    
    $.each($('.module_selection label'), function(i, v) {
      $('.' + $(v).attr('for').replace('module_', '')).hide(speed);
    });
    
    if (module == 'start' || module == 'lookup' || module == 'explore' || module == 'terms' || module == undefined) {
      $('#module-arrow').hide(speed);
      if (module != undefined) {
        window.location.hash = '#' + module;
      }
    } else {
      $('.' + module).show(speed);
      $('#module-arrow').show(speed);
    }
  },
  
  change_genome: function(event) {
    $('#loading-genome').dialog('open');
    this.el.find('.progress-bar').progressbar({value: 0});
    this.el.find('.progress-bar > div').css('background', get_secondary_color());
    
    var reader = new FileReader();
    
    var self = this;
    reader.onprogress = function(event) {
      if (event.lengthComputable) {
        var percent = Math.round((event.loaded / event.total) * 100);
        if (percent < 100) {
          self.el.find('#loading-bar').progressbar('option', 'value', percent);
        }
      }
    };
    
    reader.onloadend = function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      $('#genome label, #genome input').hide();
      $('#advanced').show();
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
  
  check_any_genome: function(name) {
    if (_.isEmpty(this[name].snps)) {
      this.el.find('#please-load-genome').dialog({
        modal: true, resizable: false, width: 400, buttons: {
          'Cancel': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    return true;
  },
  
  check_genome: function() {
    this.check_any_genome('user');
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