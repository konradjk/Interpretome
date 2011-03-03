$(function() {
window.AppView = Backbone.View.extend({
  el: $('body'),

  events: {
    'change #genome-file': 'changeGenome',
    'click #clear-genome': 'clearGenome',
    'click #population label': 'changePopulation'
  },

  initialize: function() {
    _.bindAll(this, 'changeGenome', 'clearGenome', 'changePopulation');
  },
  render: function() {
    $('#tabs').tabs({
      select: function(event, ui) {
        window.location.hash = ui.tab.hash;
      }
    });
    $('#population').buttonset();
  },
  changeGenome: function(event) {
    console.log(event);

    var reader = new FileReader();
    reader.onloadend = this.loadGenome;
    reader.readAsText(event.target.files[0]);
  },
  
  loadGenome: function(event) {
    $('#genome label, #genome input').hide();
    $('#global-settings #genome button').button({icons: {primary: 'ui-icon-circle-close'}}).show();
    window.App.user.parseGenome(event.target.result.split('\n'));
  },
  
  clearGenome: function(event) {
    console.log('clear');
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
  
  changePopulation: function(event) {
    $('#population div.setting-label label').hide();
    this.user.population = $('#population label[aria-pressed="true"]').attr('for');
    console.log('user.population = ' + this.user.population + '.');
  },
  
  checkGenome: function() {
    console.log('checkGenome');
    if (_.isEmpty(this.user.snps)) {
      $('#please-load-genome').dialog({
        modal: true, resizable: false, buttons: {
          'Okay': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    return true;
  },
  
  checkPopulation: function() {
    console.log('checkPopulation');
    if (this.user.population == null) {
      $('#please-select-population').dialog({
        modal: true, resizable: false, buttons: {
          'Okay': function() {$(this).dialog('close');}
        }
      });
      return false;
    }
    
    return true;
  },
  
  checkAll: function() {
    console.log('checkAll');
    if (this.checkGenome() == false) return false;
    return this.checkPopulation();
  }
  
});
});