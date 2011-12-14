$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),
  
  events: {
    'click #open-confirm-dialog': 'open_confirm_dialog',
    'click #open-load-genome-dialog': 'open_load_genome_dialog',
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
      'click_settings', 'set_remember_cookie',
      'open_confirm_dialog'
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
    'family': 'ancestry'
  },
  
  render: function() {
    $('#advanced').hide();
    $('#clear-genome').button({ 
      icons: {primary: 'ui-icon-circle-close'} 
    }).show();
    $('#advanced-settings').button().show();
    
    var self = this;
    if (self.get_remember_cookie()) {
      $('#terms-remembered').attr('checked', 'checked');
    } else {
      $('#terms-remembered').removeAttr('checked')
    }
    
    this.el.find('.module_selection').buttonset();
    this.el.find('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
    var loc = window.location.hash.replace('#','');
    
    var route = this.reverse_routes[loc];
    
    $(".module_selection label[for='module_" + route + "']").click();
    this.change_module(route);
  },
  
  open_confirm_dialog: function() {
    var self = this;
    if (self.get_remember_cookie()) {
      $('#load-genome-dialog').dialog('open');
    } else {
      $('#confirm-dialog').dialog('open');
    }
  },
  
  open_load_genome_dialog: function() {
    this.set_remember_cookie($('#terms-remembered').attr('checked'));
    $('#confirm-dialog').dialog('close');
    $('#load-genome-dialog').dialog('open');
  },
  
  click_settings: function() {
    $('#settings').dialog('open');
  },
  
  select_module: function() {
    var module = $('.module_selection label[aria-pressed="true"]').
      attr('for').
      replace('module_', '');
    
    this.change_module(module);
    $('.' + module).css('top', '2px').
      css('font-size', '0.9em').
      attr('line-height', '1.1em');
  },
  
  change_module: function(module) {
    var speed = 'fast';
    
    $.each($('.module_selection label'), function(i, v) {
      $('.' + $(v).attr('for').replace('module_', '')).hide(speed);
    });
    
    // You can also use _.include([...], value);
    if (module == 'start' || module == 'lookup' || module == 'explore' || module == undefined) {
      $('#module-arrow').hide(speed);
      if (module != undefined) {
        window.location.hash = '#' + module;
      }
    } else {
      $('.' + module).show(speed);
      $('#module-arrow').show(speed);
    }
  },
  
  set_remember_cookie: function(value) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + 30);
    document.cookie = "remembered=" + value + "; expires="+exdate.toUTCString();
  },
  
  get_remember_cookie: function() {
    var cookies = document.cookie.split(";");
    for (i=0; i < cookies.length; i++) {
      x = cookies[i].substr(0, cookies[i].indexOf("="));
      y = cookies[i].substr(cookies[i].indexOf("=")+1);
      x = x.replace(/^\s+|\s+$/g,"");
      if (x == 'remembered' && y == 'true') {
        return true;
      }
    }
    return false;
  },
  
  change_genome: function(event) {
    $('#loading-genome').dialog('open');
    this.el.find('.progress-bar').progressbar({value: 0});
    this.el.find('.progress-bar > div').css('background', get_secondary_color());
    
    var reader = new FileReader();
    reader.onprogress = function(event) {
      if (event.lengthComputable) {
        var percent = Math.round((event.loaded / event.total) * 100);
        if (percent < 100) {
          self.el.find('#loading-bar').progressbar('option', 'value', percent);
        }
      }
    };
    
    filename = event.target.files[0].fileName.split('.')
    extension = filename[filename.length-1]

    reader.onloadend = function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      $('#genome label, #genome input').hide();
      $('#open-confirm-dialog').hide();
      $('#advanced').show();
      window.App.user.parse_genome(event.target.result, extension);
      // Should this be here?
      $('#please-load-genome').dialog('close');
      $('#load-genome-dialog').dialog('close');
    }
    
    if (extension == 'txt') {
      reader.readAsText(event.target.files[0]);
    } else {
      reader.readAsBinaryString(event.target.files[0]);
    }
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
    return this.check_any_genome('user');
  },
  
  check_population: function() {
    if (this.user.population == null) {
      this.el.find('#please-select-population').dialog({
        modal: true, resizable: false, buttons: {
          'Cancel': function() {$(this).dialog('close');}
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
