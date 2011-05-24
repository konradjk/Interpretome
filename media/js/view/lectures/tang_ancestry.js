$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#tang_ancestry_table',
  template_id: '#tang_ancestry_template',
  url: '/media/template/lectures/tang_ancestry.html',

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
    $.get('/media/help/tang_ancestry.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var european_count = 0;
    var east_asian_count = 0;
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      self.el.find(self.table_id).append(_.template(self.table_template, v));
      european_count += count_genotype(v['genotype'], v['european_allele']);
      east_asian_count += count_genotype(v['genotype'], v['east_asian_allele']);
    });
    this.el.find(this.table_id).show();
    $('#table-options').show();
    
    this.finish(european_count, east_asian_count);
  },
  
  finish: function(european_count, east_asian_count) {
    $('#tang_ancestry_european_count').html(european_count);
    $('#tang_ancestry_east_asian_count').html(east_asian_count);
    this.el.find('#tang_ancestry_chart').show();
  }
});
});