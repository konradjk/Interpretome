$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#selection_table',
  template_id: '#selection_template',
  url: '/media/template/lectures/selection.html',
  help_url: '/media/help/selection.html',

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
    $.get(this.help_url, {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
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
    var self = this;
    var n_selected = 0;
    var n_not_selected = 0;
    var n_derived = 0;
    var n_ancestral = 0;
    var rows = this.el.find('.results-table:visible tr').slice(1);
    $.each(rows, function(i, v) {
      var genotype = $(v).find('td:nth-child(2)').text();
      if (genotype == '??') return;
      
      var ancestral = $(v).find('td:nth-child(3)').text();
      var count = count_genotype(genotype, ancestral);
      n_ancestral += count;
      n_derived += (2 - count);
      
      var selected = $(v).find('td:nth-child(4)').text();
      var count = count_genotype(genotype, selected);      
      n_selected += count;
      n_not_selected += (2 - count);
      
    });
    this.el.find('.results-table:visible tr:last').
      after('<tr><td class="key"><strong>Total ancestral:</strong></td><td class="value">' + 
        n_ancestral + '</td></tr>');
    this.el.find('.results-table:visible tr:last').
      append('<td class="key"><strong>Total selected:</strong></td><td class="value">' + 
        n_selected + '</td>');
    this.el.find('.results-table:visible tr:last').
      after('<tr><td class="key"><strong>Total derived:</strong></td><td class="value">' + 
        n_derived + '</td></tr>');
    this.el.find('.results-table:visible tr:last').
      append('<td class="key"><strong>Total not selected:</strong></td><td class="value">' + 
        n_not_selected + '</td>');
  }
});
});