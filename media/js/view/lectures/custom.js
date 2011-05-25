$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#custom_table',
  template_id: '#custom_template',
  table_header_id: '#custom_header',
  table_header_template_id: '#custom_header_template',
  url: '/media/template/lectures/custom.html',

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
	  this.header_template= $(this.table_header_template_id).html();
  },
  
  start: function(response) {

  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    n = window.App.custom_exercise.head.length;
    $.each(window.App.custom_exercise.head.slice(1, n), function(i ,v) {
      self.el.find(self.table_header_id).append('<th>'+v+'</th>');
    });
    this.el.find(this.table_header_id).append('<th>Genotype</th>');
    this.el.find(this.table_header_id).append('<th>dbSNP</th>');
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      self.el.find(self.table_id).append(_.template(self.table_template, {row:v}));
    });
    this.el.find(this.table_id).show();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  }
});
});
