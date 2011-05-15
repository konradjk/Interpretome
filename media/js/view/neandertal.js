$(function() {
window.NeandertalView = Backbone.View.extend({
  has_loaded: false,
  el: $('#neandertal'),

  events: {
    'click #compute-neandertal': 'click_neandertal',
    'click #submit-neandertal': 'click_submit_neandertal'
  },

  initialize: function() {
    _.bindAll(this, 'click_neandertal', 'loaded', 'calculate_neandertal',
      'click_submit_neandertal');
  },
  
  render: function() {
    $.get('/media/template/neandertal.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  
	  // Initialize widgets.
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.el.find('.help > div').show();
    this.el.find('#neandertal-chart').hide();
	  
	  // Initialize templates.
	  this.neandertal_template = $('#neandertal-template').html();
	  
	  this.has_loaded = true;
  },
  
  calculate_neandertal: function(response){
    var self = this;
    var total_index = 0;
    var total = 0;
    $.each(response, function(i, v) {
      var snp = window.App.user.lookup(v['rsid']);
      if (snp != undefined){
        var count = count_genotype(snp.genotype, v['out_of_africa_allele']);
        total_index += count;
        v['count'] = count;
        v['genotype'] = snp.genotype;
        self.el.find('#neandertal-table').append(_.template(self.neandertal_template, v));
        total += 2;
      }
    });
    self.el.find('#neandertal-table').show();
    self.el.find('#neandertal-chart').show();
    document.getElementById('neandertal-count').innerText = total_index;
    document.getElementById('neandertal-total').innerText = total;
    this.el.find('#submit-neandertal').parent().show();
  },
  
  click_neandertal: function(event) {
    this.el.find('#neandertal-chart').hide();
    this.el.find('#neandertal-table tr').slice(1).remove();
    this.el.find('#neandertal-table').hide();
    if (window.App.check_genome() == false) return;
    $.get('/lookup/neandertal/', {}, this.calculate_neandertal);
  },
  
  click_submit_neandertal: function(event) {
	  this.el.find('#confirm-submit-neandertal').dialog({modal: true, resizable: false, buttons: {
	    'Okay': function() {
	      $(this).dialog('close');
	      var data = window.App.user.serialize();
	      data['count'] = $('#neandertal-count').text();
	      data['exercise'] = 'class_neandertal';
	      $.get('/submit/', data, check_submission);
	    },
	    'Cancel': function() {
	      $(this).dialog('close');
	    }
	  }});
  }
  });
});
