$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),

  initialize: function() {
    _.bindAll(this, 'loaded',
      'start',
      'display',
      'finish'
    );
  },
  
  render: function() {
    $.get('/media/template/lectures/template.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.generic_template = $('#generic_template').html();
  },
  
  start: function(response) {

  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    
    $.each(extended_dbsnps, function(i, v) {
      self.el.find(table_id).append(_.generic_template(template, v))
    });
    this.el.find('#generic_table').show();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  }
});
});