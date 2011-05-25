$(function() {
window.PharmacogenomicsView = Backbone.View.extend({
  has_loaded: false,
  el: $('#pharmacogenomics'),

  events: { 'click #get-pharmacogenomics': 'click_pharmacogenomics' },

  initialize: function() {
    _.bindAll(this, 'click_pharmacogenomics', 'got_pharmacogenomics', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/pharmacogenomics.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  match_style(this.el);
    this.el.find('#pharmacogenomics-table').hide();
	  this.pharmacogenomics_template = $('#pharmacogenomics-template').html();
    this.has_loaded = true;
  },
  
  got_pharmacogenomics: function(response) {
    var self = this;
    $.each(response, function(i, v) {
      var dbsnp = window.App.user.lookup(v['dbsnp']);
      if (dbsnp != undefined && v['genotype'] == dbsnp.genotype){
        v['genotype'] = dbsnp.genotype;
        self.el.find('#pharmacogenomics-table').append(_.template(self.pharmacogenomics_template, v));
      }
    });
    self.el.find('#pharmacogenomics-table').show();
  },
  
  click_pharmacogenomics: function(event) {
    this.el.find('#pharmacogenomics-table tr').slice(1).remove();
    this.el.find('#pharmacogenomics-table').hide();
    
    if (window.App.check_genome() == false) return;
    
    $.get('get_pharmacogenomics_snps', {}, this.got_pharmacogenomics);
  }
  });
});
