$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#assimes_cad_table',
  template_id: '#assimes_cad_template',
  url: '/media/template/lectures/assimes_cad.html',

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

  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      self.el.find(self.table_id).append(_.template(self.table_template, v))
    });
    this.el.find(this.table_id).show();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {
    var n_risk = 0, n_total = 0;
    var rows = this.el.find('.results-table:visible tr').slice(1);
    $.each(rows, function(i, v) {
      var genotype = $(v).find('td:nth-child(2)').text();
      if (genotype == '??') return;
      
      n_total += 2;
      var count = count_genotype(genotype, $(v).find('td:nth-child(3)').text());
      n_risk += count;
    });
    this.el.find('.results-table:visible tr:last').after(
      '<tr><td class="key"><strong>Number of risk alleles</strong></td><td class="value">' + 
        n_risk + '</td></tr>'
    );
    this.el.find('.results-table:visible tr:last').after(
      '<tr><td class="key"><strong>Total</strong></td><td class="value">' + n_total + '</td></tr>'
    );

  }
});
});