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
	  this.el.find('button').button();
    this.el.find('#disease-table').hide();
	  this.disease_template = $('#disease-template').html();
	  match_style(this.el);
    this.has_loaded = true;
  },
  
  got_diseases: function(response) {
    var self = this;
    $.each(response, function(i, v) {
      var dbsnp = window.App.user.lookup(filter_identifier(v['strongest_snp']));
      if (dbsnp != undefined){
        v['genotype'] = dbsnp.genotype;
        self.el.find('#disease-table').append(_.template(self.disease_template, v));
      }
    });
    self.el.find('#disease-table').show();
  },
  
  click_disease: function(event) {
    this.el.find('#disease-table tr').slice(1).remove();
    this.el.find('#disease-table').hide();
    
    if (window.App.check_genome() == false) return;
    
    $.get('/disease/get_gwas_catalog', {population: window.App.user.population}, this.got_diseases);
  }
  });
});
