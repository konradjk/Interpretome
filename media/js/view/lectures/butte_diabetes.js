$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name: 'Diabetes-Butte', 
  table_id: '#butte_diabetes_table',
  template_id: '#butte_diabetes_template',
  url: '/media/template/lectures/butte_diabetes.html',

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
    $.get('/media/help/butte_diabetes.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    
    var diabetes_count = 0;
    var total = 0;
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      if (v['genotype'] != '??') {
        diabetes_count += count_genotype(v['genotype'], v['risk']);
        total += 2;
      }
      self.el.find(self.table_id).append(_.template(self.table_template, v));
    });
    this.el.find(self.table_id).show();
    $('#table-options').show();
    
    this.finish(diabetes_count, total);
  },
  
  finish: function(diabetes_count, total) {
    $('#butte_diabetes_count').html(diabetes_count);
    $('#butte_diabetes_total').html(total);
    this.el.find('#butte_diabetes_chart').show();
  }
});
});
