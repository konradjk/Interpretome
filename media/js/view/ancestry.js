$(function() {
window.AncestryView = Backbone.View.extend({
  el: $('#ancestry'),
  has_loaded: false,

  events: {
    'click #ancestry': 'click_ancestry',
    'click .help-button': 'click_help'
  },

  initialize: function() {
    _.bindAll(this, 'click_ancestry', 'click_help', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/ancestry.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
	  this.ancestry_graph_template = $('#ancestry-graph-template').html();
    this.el.find('#detail').buttonset();
	  this.el.find('.help > div').hide();
    this.has_loaded = true;
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
    return _.select(value, function(v) {return v == allele;}).length;
  },
  
  compute_factor: function(feature, multiplier, value, running_total) {
    console.log('Running Total: ', running_total);
    running_total += multiplier*value;
    this.display_factor(feature, multiplier, value, running_total)
    return running_total;
  },
  
  display_factor: function(feature, multiplier, value, running_total){
    var output = {};
    output['feature'] = feature;
    output['multiplier'] = multiplier;
    output['value'] = value;
    output['running_total'] = running_total;
    this.el.find('#ancestry-table').append(_.template(this.ancestry_template, output));
  },
  
  display_bar_graph: function(results) {
    var output = {};
    output['graph'] = this.generate_bar_graph(genetic_ancestry, family_predicted_ancestry, background_ancestry, actual_ancestry);
    this.el.find('#ancestry-graph-table').append(_.template(this.ancestry_graph_template, output));
    this.el.find('#ancestry-graph-table').show();
  },
  
  // jQuery can do query string formatting for you.
  generate_bar_graph: function(genetic_ancestry, family_predicted_ancestry, background_ancestry, actual_ancestry){
    var url = 'http://chart.apis.google.com/chart?';
    var options = {
      "cht": "bvg",
      "chtt" : "Predicted Heights",
      "chs":  "400x300",
      "chma": "15,5,5,5",
      "chxt": "x,y,y",
      "chxl": "0:|Genetic|Family|Population|Actual|2:|Height (in cm)",
      "chxp": "0,15,39,62,85|2,50",
      "chxtc": "0,5",
      "chco": "FF0000,FF7400,009999,00CC00",
      "chxr" : "1,120,250",
      "chds" : "120,250",
      "chbh": "a",
      "chm": "N,000000,0,-1,14|N,000000,1,-1,14|N,000000,2,-1,14|N,000000,3,-1,14"
    };
    options["chd"] = "t:" + [genetic_ancestry, family_predicted_ancestry, background_ancestry, actual_ancestry].join('|');
    $.each(options, function(k, v){
      url += k + '=' + v + '&';
    });
    return '<img src="' + url + '">';
  },
  
  click_ancestry: function(event) {
    this.el.find('#ancestry-table tr').slice(1).remove();
    this.el.find('#ancestry-table').hide();
    
    this.el.find('#ancestry-graph-table tr').slice(1).remove();
    this.el.find('#ancestry-graph-table').hide();
    
    var raw_sex = $('#sex label[aria-pressed="true"]').attr('for');
    if (raw_sex != undefined){
      window.App.user.sex = raw_sex;
    }
    
    if (this.check_ancestry() == false) return;
    var self = this;
    $.get(
      '/ancestry/get_ancestry_snps/', {
        population: window.App.user.population
      }, function(response) {
        console.log(response);
        self.calculate_ancestry(response);
      }
    );
  },
  
  calculate_ancestry: function(snps) {
    self = this;
    var adjust = 0;
    var running_total = [];
    $.each(snps, function(i, v) {
      var user_snp = window.App.user.lookup(i);
      if (user_snp != undefined) {
        factor = self.count_genotype(user_snp.genotype, v.risk_allele) - 1;
        adjust += v.effect_size_cm*factor/2;
        running_total.push(adjust);
      }
    });
    console.log(adjust);
    //this.display_graph('');
    return;
  },
  
  check_ancestry: function(){
    this.el.find('.required').hide();
    if (window.App.user.sex == null) {
      this.el.find('#please-enter-sex').show('slow');
      return false;
    }
    //if (window.App.check_all() == false) return false;
    
    return true;
  }
  
  });
});
