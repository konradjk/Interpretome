$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  table_id: '#neandertal_table',
  template_id: '#neandertal_template',
  url: '/media/template/lectures/neandertal.html',

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
    $.get('/media/help/neandertal.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var total_index = 0;
    var total = 0;
    $.each(response['snps'], function(i, v) {
      var snp = extended_dbsnps[i];
      if (snp != undefined){
        var count = count_genotype(snp.genotype, v['out_of_africa_allele']);
        total_index += count;
        v['count'] = count;
        v['genotype'] = snp.genotype;
        self.el.find(self.table_id).append(_.template(self.table_template, v));
        total += 2;
      }
    });
    this.el.find(this.table_id).show();
    $('#table-options').show();
    
    this.finish(total_index, total);
  },
  
  finish: function(total_index, total) {
    data = new google.visualization.DataTable();
    
    data.addColumn('string', 'Label');
    data.addColumn('number', 'Value');
    data.addRows(1);
    data.setValue(0, 0, 'Neandertal');
    data.setValue(0, 1, total_index);
    
    var chart = new google.visualization.Gauge(document.getElementById('neandertal_chart'));
    var options = {width: 900, height: 300, redFrom: total/4, redTo: 84,
        min: 0, max: total,
        yellowFrom:total/8, yellowTo: total/4, minorTicks: 5};
    chart.draw(data, options);
    
    this.el.find('#neandertal_chart').show();
  }
});
});