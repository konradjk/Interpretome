$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name:'Binding-Snyder',  
  table_id: '#snyder_binding_table',
  template_id: '#snyder_binding_template',
  url: '/media/template/lectures/snyder_binding.html',

  initialize: function() {
    _.bindAll(this, 'loaded',
      'start',
      'display',
      'finish'
    );
  },
  
  render: function() {
    $.get(this.url, this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.table_template = $(this.template_id).html();
  },
  
  start: function(response) {
    $.get('/media/help/snyder_binding.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    $.each(response['snps'], function(dbsnp, array) {
      var snp = extended_dbsnps[dbsnp];
      $.each(array, function(i, v) {
        if (snp != undefined && v['genotype'] == snp['genotype']) {
          _.extend(v, snp);
          self.el.find(self.table_id + " > tbody").append(_.template(self.table_template, v));
        }
      });
    });
    this.el.find(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  }
});
});
