$(function() {
window.DiabetesView = Backbone.View.extend({
  el: $('#diabetes'),
  has_loaded: false,

  events: {
    'click #diabetes': 'click_diabetes',
    'click .help-button': 'click_help'
  },

  initialize: function() {
    _.bindAll(this, 'click_diabetes', 'click_help', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/diabetes.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
	  this.diabetes_template = $('#diabetes-template').html();
	  this.diabetes_graph_template = $('#diabetes-graph-template').html();
    this.el.find('#sex').buttonset();
	  this.el.find('.help > div').hide();
    this.has_loaded = true;
  },
  
  filter_identifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
  },
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    console.log(id);
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  check_float: function(value) {
    if (!_.isNaN(parseFloat(value))){
      return value;
    }else{
      return null;
    }
  },
  
  count_genotype: function(value, allele) {
    result = _.select(value, function(v) {return v == allele;}).length;
  },
  
  compute_factor: function(feature, results, value) {
    console.log('Results: ', results);
    results['clinical_total'] += clincial_multiplier*value;
    results['genetic_total'] += genetic_multiplier*value;
    this.display_factor(feature, clincial_multiplier, results['clinical_total'], genetic_multiplier, results['genetic_total'], value)
    return results;
  },
  
  display_factor: function(value){
    var output = {};
    output['value'] = value
    this.el.find('#diabetes-table').append(_.template(this.diabetes_template, output));
  },
  
  display_graph: function(results) {
    var output = {};
    output['graph'] = this.generate_graph(results);
    this.el.find('#diabetes-graph-table').append(_.template(this.diabetes_graph_template, output));
    this.el.find('#diabetes-graph-table').show();
  },
  
  // jQuery can do query string formatting for you.
  generate_graph: function(snp_names){
    var url = 'http://chart.apis.google.com/chart?';
    var options = {}
    var axis = '20.9864426967,26.2391139966';
    var count = '6';
    //var count = length(snp_names);
    options['chds'] = '0,6,20.9864426967,26.2391139966,0,6,20.9864426967,26.2391139966,0,6,20.9864426967,26.2391139966';
    //options['chds'] = $.format('0,%s,%s,0,%s,%s,0,%s,%s' % [count, axis, count, axis, count, axis])
    //options['chd'] = 't:-1|%s%s|-1|%s%s|-1|%s%s' % (pre_t_s, lr_string, pre_t_s, or_string, pre_t_s, pre_test_string)
    options['chd'] = 't:-1|23.7,21.5303131588,21.4864426967,23.2647561286,24.574279262,25.7391139966,25.0851888338|-1|23.7,21.9,21.7108676541,22.8403011587,23.5227373637,23.6222209809,22.1257161969|-1|23.7,23.7,23.7,23.7,23.7,23.7,23.7'
    options['chls'] = '1|1|1'
    options['chma'] = '5,5,5,25'
    options['chtt'] = 'Your+Diabetes+Risk'
    //options['chxl'] = '0:%s' % snp_names;
    options['chxl'] = '0:|rs7903146|rs4402960|rs13266634|rs1801282|rs1111875|rs5219';
    //options['chxp'] = 'chxp=0%s' % snp_count;
    options['chxp'] = 'chxp=0,1,2,3,4,5,6';
    //options['chxr'] = '&chxr=0,0,%s|1,%s' % (count, axis);
    options['chxr'] = '&chxr=0,0,6|1,20.9864426967,26.2391139966';
    options['chdl'] = 'Likelihood+Ratio|Odds+Ratio*|Average+Risk'
    options['chdlp'] = 'b';
    options['chxt'] = 'x,y';
    options['chs'] = '640x240';
    options['cht'] = 'lxy';
    options['chco'] = '3072F3,FF0000,FF9900';
    options['chts'] = '676767,16';
    $.each(options, function(k, v){
      url += k + '=' + v + '&';
    });
    return '<img src="' + url + '">';
  },
  
  click_diabetes: function(event) {
    this.el.find('#diabetes-table tr').slice(1).remove();
    this.el.find('#diabetes-table').hide();
    
    this.el.find('#diabetes-graph-table tr').slice(1).remove();
    this.el.find('#diabetes-graph-table').hide();
    
    var raw_sex = $('#sex label[aria-pressed="true"]').attr('for');
    if (raw_sex != undefined){
      window.App.user.sex = raw_sex;
    }
    
    if (this.check_diabetes() == false) return;
    var self = this;
    $.get(
      '/diabetes/get_diabetes_snps/', {
        population: window.App.user.population
      }, function(response) {
        console.log(response);
        self.calculate_risk(response);
      }
    );
  },
  
  calculate_risk: function(snps) {
    var user_LR_risk = 1;
    var user_OR_risk = 1;
    
    $.each(snps, function(i, v) {
      
      var user_snp = window.App.user.lookup(i);
      if (user_snp != undefined) {
        //return;
      }
      
    });
    this.display_graph('');
    return;
  },
  
  check_diabetes: function(){
    this.el.find('.required').hide();
    if (window.App.user.sex == null) {
      this.el.find('#please-enter-sex').show('slow');
      return false;
    }
    if (window.App.check_all() == false) return false;
    
    return true;
  }
  
  });
});
