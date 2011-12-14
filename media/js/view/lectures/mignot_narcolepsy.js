$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name:'Narcolepsy-Mignot',  
  table_id: '#mignot_narcolepsy_table',
  template_id: '#mignot_narcolepsy_template',
  url: '/media/template/lectures/mignot_narcolepsy.html',

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
    $.get('/media/help/mignot_narcolepsy.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var or_total = 0;
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      if (v['genotype'] != '??' && v['odds_ratio'] != null && v['disorder'] == 'RLS') {
        if (count_genotype(v['genotype'], v['risk']) > 0) {
          or_total += count_genotype(v['genotype'], v['risk'])*Math.log(v['odds_ratio']);
        }
      }
      self.el.find(self.table_id + " > tbody").append(_.template(self.table_template, v));
    });
    this.el.find(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    
    this.finish(Math.exp(or_total));
  },
  
  finish: function(or_total) {
    $('#mignot_narcolepsy_count').html(or_total.toFixed(2));
    this.el.find('#mignot_narcolepsy_chart').show();
  }
});
});
