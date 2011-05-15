$(function() {
window.DiseaseView = Backbone.View.extend({
  has_loaded: false,
  el: $('#disease'),

  events: {
    'click #get-gwas': 'click_disease'
  },

  initialize: function() {
    _.bindAll(this, 'click_disease', 'show_gwas_snps',
              'got_diseases', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/disease.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help > div').show();
    this.el.find('#disease-table').hide();
	  this.disease_template = $('#disease-template').html();
    this.has_loaded = true;
  },
  
  show_gwas_snps: function(response, dbsnps, extended_snp) {
    var self = this;
    $.each(response, function(i, v) {
      var dbsnp = v['strongest_snp'];
      if (extended_snp[dbsnp] != undefined){
        v['genotype'] = extended_snp[dbsnp]['genotype'];
        v['imputed_from'] = extended_snp[dbsnp]['imputed_from'];
        v['r_squared'] = extended_snp[dbsnp]['r_squared'];
        self.el.find('#disease-table').append(_.template(self.disease_template, v));
      }
    });
    self.el.find('#disease-table').show();
  },
  
  got_diseases: function(response) {
    var self = this;
    var dbsnps = [];
    $.each(response, function(i, v) {
      dbsnps.push(v['strongest_snp']);
    });
    window.App.user.lookup_snps(
      this.show_gwas_snps, response, filter_identifier(dbsnps), {}
    );
  },
  
  click_disease: function(event) {
    this.el.find('#disease-table tr').slice(1).remove();
    this.el.find('#disease-table').hide();
    
    if (window.App.check_all() == false) return;
    
    $('#looking-up').dialog('open');
    $.get('/disease/get_gwas_catalog', {population: window.App.user.population}, this.got_diseases);
  }
  });
});
