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
    
    var n_selected = 0;
    var n_derived = 0;
    var total = 0;
    
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      self.el.find(self.table_id).append(_.template(self.table_template, v));
      
      if (v['genotype'] != '??'){
        var count = count_genotype(v['genotype'], v['ancestral']);
        n_derived += (2 - count);
        var count = count_genotype(v['genotype'], v['selected']);      
        n_selected += count;
        total += 2;
      }
    });
    this.el.find(this.table_id).show();
    $('#table-options').show();
    
    this.finish(n_selected, n_derived, total);
  },
  
  finish: function(n_selected, n_derived, total) {
    
    data = new google.visualization.DataTable();
    
    data.addColumn('string', 'Label');
    data.addColumn('number', 'Value');
    data.addRows(2);
    data.setValue(0, 0, 'Derived');
    data.setValue(0, 1, n_derived);
    data.setValue(1, 0, 'Selected');
    data.setValue(1, 1, n_selected);
    
    var chart = new google.visualization.Gauge(document.getElementById('selection_chart'));
    var options = {width: 900, height: 300, redFrom: total/2, redTo: total,
        min: 0, max: total,
        yellowFrom:total/4, yellowTo: total/2, minorTicks: 5};
    chart.draw(data, options);
    
    this.el.find('#selection_chart').show();
    
  }
});
});