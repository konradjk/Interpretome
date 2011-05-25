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
    $('#neandertal_count').html(total_index);
    $('#neandertal_total').html(total);
    this.el.find('#neandertal_chart').show();
  }
});
});