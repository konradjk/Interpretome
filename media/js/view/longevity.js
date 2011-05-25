$(function() {
window.LongevityView = Backbone.View.extend({
  el: $('#longevity'),
  has_loaded: false,
  regex: new RegExp(/\//),

  initialize: function() {
    _.bindAll(this, 
      'click_compute_longevity', 'got_longevity_snps', 'show_longevity_snps',
      'click_submit_longevity',
      'click_help', 'loaded'
    );
  },
  
    
  click_compute_longevity: function(event) {
    window.App.check_all();
    $.get('/lookup/longevity/', {}, this.got_longevity_snps);
  },
  
  got_longevity_snps: function(response) {
    window.App.user.lookup_snps(
      this.show_longevity_snps, response, response.sorted_dbsnps, {}
    );
  },
  
  show_longevity_snps: function(response, all_dbsnps, extended_dbsnps) {
    
    
    
    
    
  }

});
});