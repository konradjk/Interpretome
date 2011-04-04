$(function() {
window.DiseaseView = Backbone.View.extend({
  el: $('#disease'),

  events: {
    'click #disease': 'click_disease',
    'click .help-button': 'clickHelp'
  },

  initialize: function() {
    _.bindAll(this, 'click_disease', 'clickHelp', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/warfarin.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.disease_template = $('#disease-template').html();
	  this.disease_graph_template = $('#disease-graph-template').html();
	  this.el.find('.help > div').hide();
  },
  
  filter_identifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
  },
  
  clickHelp: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    console.log(id);
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  checkFloat: function(value) {
    if (!_.isNaN(parseFloat(value))){
      return value;
    }else{
      return null;
    }
  },
  
  count_genotype: function(value, allele) {
    result = _.select(value, function(v) {return v == allele;}).length;
  },
  
  compute_factor: function(feature, results, clincial_multiplier, genetic_multiplier, value) {
    console.log('Results: ', results);
    results['clinical_total'] += clincial_multiplier*value;
    results['genetic_total'] += genetic_multiplier*value;
    this.display_factor(feature, clincial_multiplier, results['clinical_total'], genetic_multiplier, results['genetic_total'], value)
    return results;
  },
  
  display_factor: function(value){
    var output = {};
    output['value'] = value
    this.el.find('#disease-table').append(_.template(this.warfarin_dose_template, output));
  },
  
  show_graph: function(clinical_total, genetic_total, extended_total) {
    var output = {}
    output['graph'] = this.generate_graph(clinical_total);
    this.el.find('#disease-graph-table').append(_.template(this.warfarin_graph_template, output));
    this.el.find('#disease-graph-table').show();
  },
  
  // jQuery can format query strings for you.
  generate_graph: function(dose){
    var url = 'http://chart.apis.google.com/chart?';
    var options = {}
    options['chxl'] = '0:|Low|High';
    options['chxp'] = '0,21,49';
    options['chxr'] = '0,15,60';
    options['chxs'] = '0,676767,14.5,0,l,676767';
    options['chxt'] = 'y';
    options['chs'] = '300x130';
    options['cht'] = 'gm';
    options['chco'] = '000000,00FF00|FFFF00|FF0000';
    options['chd'] = 't:' + dose;
    options['chts'] = '676767,16';
    $.each(options, function(k, v){
      url += k + '=' + v + '&';
    });
    return '<img src="' + url + '">';
  },
  
  click_disease: function(event) {
    this.el.find('#disease-table tr').slice(1).remove();
    this.el.find('#disease-table').hide();
    
    this.el.find('#disease-graph-table tr').slice(1).remove();
    this.el.find('#disease-graph-table').hide();
    
    if (this.check_disease() == false) return;
    
    
    
  },
  
  check_disease: function(){
    if (window.App.check_all() == false) return false;
    
    return true;
  }
  
  });
});
