$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#ashley_cad_table',
  template_id: '#ashley_cad_template',
  url: '/media/template/lectures/ashley_cad.html',

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
    $.get('/media/help/ashley_cad.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    
    var cad_count = 0;
    var total = 0;
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      if (v['genotype'] != '??') {
        cad_count += count_genotype(v['genotype'], v['risk_allele']);
        total += 2;
      }
      self.el.find(self.table_id).append(_.template(self.table_template, v));
    });
    this.el.find(self.table_id).show();
    $('#table-options').show();
    
    this.finish(cad_count, total);
  },
  
  finish: function(cad_count, total) {
    $('#ashley_cad_count').html(cad_count);
    $('#ashley_cad_total').html(total);
    this.el.find('#ashley_cad_chart').show();
  }
});
});