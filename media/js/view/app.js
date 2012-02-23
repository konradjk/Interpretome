$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),
  
  events: {
    'click #add-genome': 'add_genome',
    'click #open-confirm-dialog': 'open_confirm_dialog',
    'click #open-load-genome-dialog': 'open_load_genome_dialog',
    'change #genome-analysis': 'change_genome_to_analyze',
    'change #genome-file': 'change_genome',
    'click #clear-genome': 'clear_genome',
    'change #toolbar-population': 'change_population_from_toolbar',
    'change #check-population': 'change_population_from_check',
    'change .module_selection': 'select_module',
    'click #advanced-settings': 'click_settings'
  },

  initialize: function() {
    _.bindAll(this, 
      'change_genome', 'clear_genome', 'add_genome_file',
      'check_genome', 'check_any_genome',
	    'change_population', 'change_population_from_toolbar',
	    'change_population_from_check', 'update_genome_lists',
      'select_module', 'change_module',
      'click_settings', 'set_remember_cookie',
      'open_confirm_dialog', 'change_genome_to_analyze',
      'dragenter', 'dragover', 'drop_genome'
	  );
  },
  
  genome_lists: [],
  
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
    });
    $('#advanced-settings').button();
    $('#add-genome').button();
    
    if (this.get_remember_cookie()) {
      $('#terms-remembered').attr('checked', 'checked');
    } else {
      $('#terms-remembered').removeAttr('checked')
    }
    
    $('.module_selection').buttonset();
    $('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
    
    var loc = window.location.hash.replace('#','');
    var route = this.reverse_routes[loc];
    $(".module_selection label[for='module_" + route + "']").click();
    this.change_module(route);
    
    dropbox = document.getElementById("dropbox");
    dropbox.addEventListener("dragenter", this.dragenter, false);
    dropbox.addEventListener("dragover", this.dragover, false);
    dropbox.addEventListener("drop", this.drop_genome, false);
  },
  
    
  dragenter: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },
    
  dragover: function(e) {
    e.stopPropagation();
    e.preventDefault();
  },
  drop_genome: function(e) {
    $('#loading-genome').dialog('open');
    e.stopPropagation();
    e.preventDefault();
    var self = this;
    var dt = e.dataTransfer;
    $.each(dt.files, function(i, file) {
      self.add_genome_file(file);
    });
  },
  
  open_confirm_dialog: function() {
    if (this.get_remember_cookie()) {
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
  add_genome: function() {
    $('#load-genome-dialog').dialog('open');
    $('#genome-name').val('');
    $("#genome-file-wrap").replaceWith("<input id='genome-file' multiple type='file' name='file' />");
  },
  change_genome_to_analyze: function() {
    this.change_population(get_user().population);
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
    var self = this;
    
    $.each(event.target.files, function(i, file){
      self.add_genome_file(file);
    });
  },
  
  add_genome_file: function(file) {
    var self = this;
    filename = file.name.split('.')
    base = filename[filename.length-2]
    extension = filename[filename.length-1]
    
    var name = $('#genome-name').val();
    if (name == '') {
      name = base;
    }
    window.App.users[name] = new User(name);
    $('.progress-bar').progressbar({value: 0});
    $('.progress-bar > div').css('background', get_secondary_color());
    
    var reader = new FileReader();
    reader.onprogress = function(event) {
      if (event.lengthComputable) {
        var percent = Math.round((event.loaded / event.total) * 100);
        if (percent < 100) {
          $('#loading-bar').progressbar('option', 'value', percent);
        }
      }
    };
    
    reader.onloadend = function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      $('#genome label, #genome input').hide();
      $('#open-confirm-dialog').hide();
      $('#advanced').show();
      $('#genome-analysis').append($("<option />").val(name).text(name));
      self.update_genome_lists();
      window.App.users[name].parse_genome(event.target.result, extension);
      //window.App.user_db.transaction( function(tx) {
      //  tx.executeSql("DROP TABLE IF EXISTS ?", [name]);
      //  tx.executeSql("CREATE TABLE ? (rsid VARCHAR(20) PRIMARY KEY, genotype VARCHAR(2));", [name]);
      //});
      // Should this be here?
      $('#please-load-genome').dialog('close');
      $('#load-genome-dialog').dialog('close');
    }
    
    if (true || extension == 'txt') {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
  },
  
  update_genome_lists: function() {
    var self = this;
    $.each(self.genome_lists, function(i, v){
      v();
    });
  },
  
  clear_genome: function(event) {
    $('#confirm-clear-genome').dialog({
      modal: true, resizable: false, buttons: {
        'Cancel': function() {
          $(this).dialog('close');
        },
        'Clear': function() {
          $(this).dialog('close');
          username = $('#genome-analysis option:selected').val();
          $('#genome-analysis option[value="' + username + '"]').remove();
          delete window.App.users[username];
          if (_.isEmpty(window.App.users)) {
            window.location = '';
          }
        }
      }
    });
  },
  
  change_population_from_toolbar: function(event) {
    var population = $('#toolbar-population option:selected').val();
    this.change_population(population);
  },
  
  change_population_from_check: function(event) {
    var population = $('#check-population option:selected').val();
    this.change_population(population);
  },
  
  change_population: function(population) {
    user = get_user();
    user.population = population;
    
    $('#please-select-population').dialog('close');
    $('#toolbar-population option[id="dummy-2"]').remove();
    $('#check-population option[id="dummy"]').remove();
    $('#toolbar-population option[value="' + population + '"]').attr('selected', true);
    $('#check-population option[value="' + population + '"]').attr('selected', true);
    $('#pre-population-selection').hide();
    $('#post-population-selection').show();
  },
  
  check_any_genome: function(name) {
    user = get_user();
    if (_.isEmpty(window.App.users) || _.isEmpty(user.snps)) {
      $('#please-load-genome').dialog({
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
    if (get_user().population == null) {
      $('#please-select-population').dialog({
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
