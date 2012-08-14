$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name: 'Kim-Aging', 
  table_id: '#kim_aging_table',
  template_id: '#kim_aging_template',
  url: '/media/template/lectures/kim_aging.html',

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
	  $(this.el).append(response);
	  this.table_template = $(this.template_id).html();
  },
  
  start: function(response) {
    $.get('/media/help/kim_aging.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      $(self.table_id + " > tbody").append(_.template(self.table_template, v));
    });
    $(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    
    //this.finish(diabetes_count, total);
  },
  
  finish: function(diabetes_count, total) {
    //$('#butte_diabetes_count').html(diabetes_count);
    //$('#butte_diabetes_total').html(total);
    //$('#butte_diabetes_chart').show();
  }
});
});
