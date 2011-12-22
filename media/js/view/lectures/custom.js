$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  
  name: 'Custom',
  table_id: '#custom_table',
  template_id: '#custom_template',
  table_header_id: '#custom_header',
  table_header_template_id: '#custom_header_template',
  counts_table_id: '#custom_count_table',
  counts_template_id: '#custom_count_template',
  counts_section_id: '#custom_counts',
  url: '/media/template/lectures/custom.html',

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
	  this.counts_table_template = $(this.counts_template_id).html();
	  this.header_template = $(this.table_header_template_id).html();
    get_user().lookup_snps(window.Generic.display, App.custom_exercise, _.keys(App.custom_exercise.snps), null);
  },
  
  start: function(response) {

  },

  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var counts = {};
    var countcolidx = [];
    var countcolname = {};
    n = window.App.custom_exercise.head.length;
    this.el.find(this.table_header_id).append('<th>dbSNP</th>');
    this.el.find(this.table_header_id).append('<th>Genotype</th>');
    this.el.find(this.table_header_id).append('<th>Imputed from</th>');
    this.el.find(this.table_header_id).append('<th>R<sup>2</sup></th>');
    $.each(window.App.custom_exercise.head.slice(1, n), function(i ,v) {
      lv = v.toLowerCase();
      if( lv.slice(0, 6) == 'count(' && lv[lv.length-1] == ')'){
        realv = v.slice(6, v.length-1);
        countcolidx.push(i);
        counts[i] = 0;
        countcolname[i] = realv;
        self.el.find(self.table_header_id).append('<th>'+realv+'</th>');
      }
      else {
        self.el.find(self.table_header_id).append('<th>'+v+'</th>');
      }
    });
    $.each(response['snps'], function(i, v) {
      _.extend(v, extended_dbsnps[i]);
      output = {};
      output['dbsnp'] = v['dbsnp'];
      output['genotype'] = v['genotype'];
      output['imputed_from'] = v['imputed_from'];
      output['r_squared'] = v['r_squared'];
      $.each(window.App.custom_exercise.head.slice(1, n), function(i, value) {
        output[value] = v[value];
        if( _.indexOf(countcolidx, i) >= 0 ) {
           counts[i] += count_genotype(v['genotype'], v[value]);
        }
      });
      self.el.find(self.table_id + " > tbody").append(_.template(self.table_template, {row:output}));
    });
    if (countcolidx.length > 0) {
      for(i in countcolidx) {
        idx = countcolidx[i];
        this.el.find(this.counts_table_id).append(_.template(this.counts_table_template, {colname:countcolname[idx], colcount:counts[idx]}));
      }
      this.el.find(this.counts_section_id).show();
    }
    this.el.find(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  }
});
});
