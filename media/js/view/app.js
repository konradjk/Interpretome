$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),

  events: {
    'change #genome-file': 'change_genome',
    'click #clear-genome': 'clear_genome',
    'click #population label': 'change_population'
  },

  initialize: function() {
    _.bindAll(this, 'change_genome', 'clear_genome', 'change_population');
  },
  
  render: function() {
    $('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
    $('#population').buttonset();
  },
  
  change_genome: function(event) {
    var reader = new FileReader();
    reader.onloadend = this.load_genome;
    reader.readAsText(event.target.files[0]);
  },
  
  load_genome: function(event) {
    $('#genome label, #genome input').hide();
    $('#global-settings #genome button').button({icons: {primary: 'ui-icon-circle-close'}}).show();
    window.App.user.parseGenome(event.target.result.split('\n'));
    $('#please-load-genome').dialog('close');
  },
  
  clear_genome: function(event) {
    //console.log('clear');
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
  
  change_population: function(event) {
    $('#population div.setting-label label').hide();
    this.user.population = $('#population label[aria-pressed="true"]').attr('for');
    //console.log('user.population = ' + this.user.population + '.');
    $('#please-select-population').dialog('close');
  },
  
  check_genome: function() {
    //console.log('check_genome');
    if (_.isEmpty(this.user.snps)) {
      $('#please-load-genome').dialog({
        modal: true, resizable: false,
        width: 400,
        buttons: {
          'Cancel': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    return true;
  },
  
  check_population: function() {
    //console.log('check_population');
    if (this.user.population == null) {
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
    //console.log('check_all');
    if (this.check_genome() == false) return false;
    return this.check_population();
  }
  
});
});