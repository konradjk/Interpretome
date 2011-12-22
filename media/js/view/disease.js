$(function() {
window.DiseaseView = Backbone.View.extend({
  has_loaded: false,
  el: $('#disease'),

  events: { 'click #get-gwas': 'click_disease' },

  initialize: function() {
    _.bindAll(this, 'click_disease', 'got_diseases', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/disease.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  $('button').button();
    $('#disease-table').hide();
	  this.disease_template = $('#disease-template').html();
	  match_style(this.el);
    $('#disease-table').tablesorter();
    this.has_loaded = true;
  },
  
  got_diseases: function(response) {
    var self = this;
    user = get_user();
    $.each(response, function(i, v) {
      var dbsnp = user.lookup(filter_identifier(v['strongest_snp']));
      if (dbsnp != undefined){
        v['genotype'] = dbsnp.genotype;
        $('#disease-table > tbody').append(_.template(self.disease_template, v));
      }
    });
    $('#disease-table').show();
    $('#disease-table').trigger('update');
    $('#looking-up').dialog('close');
  },
  
  click_disease: function(event) {
    clear_table('disease-table');
    
    if (window.App.check_all() == false) return;
    $('#looking-up').dialog('open');
    $.get('/disease/get_gwas_catalog', {population: get_user().population}, this.got_diseases);
  }
  });
});
