$(function() {
window.HeightView = Backbone.View.extend({
  el: $('#height'),
  has_loaded: false,
  priors: {},
  values: {},
 
  events: {
    'click #height': 'click_height',
    'click .help-button': 'click_help',
    'click #submit-height': 'check_submit_height'
  },

  initialize: function() {
    _.bindAll(this, 'click_height', 'click_help',
              'calculate_height', 'get_family_height',
              'adjust_height', 'loaded', 
              'check_submit_height', 'submit_height');
  },
  
  render: function() {
    $.get('/media/template/height.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
	  this.height_template = $('#height-template').html();
	  this.height_graph_template = $('#height-graph-template').html();
    this.el.find('#sex').buttonset();
    this.el.find('#height_units').buttonset();
    this.el.find('#mom_height_units').buttonset();
    this.el.find('#dad_height_units').buttonset();
	  this.el.find('.help > div').show();
    this.el.find('#submit-height').hide();
    this.has_loaded = true;
    this.priors = { "CEU" : {"male" : 178.9, "female" : 164.8 },
      "YRI" : {"male" : 178, "female" : 163.2 },
      "MEX" : {"male" : 170.6, "female" : 158.7 },
      "CHB" : {"male" : 170.2, "female" : 158.6 },
      "CHD" : {"male" : 170.2, "female" : 158.6 },
      "JPT" : {"male" : 171.5, "female" : 158 }
    };
  },
  
  click_help: function(event) {
    this.el.find('.help > div').toggle('normal');
  },
  
  check_float: function(value) {
    if (!_.isNaN(parseFloat(value))){
      return value;
    } else {
      return null;
    }
  },
  
  count_genotype: function(value, allele) {
    return _.select(value, function(v) {return v == allele;}).length;
  },
  
  
  // jQuery can do query string formatting for you.
  generate_bar_graph: function(genetic_height, family_predicted_height, background_height, actual_height){
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
    options["chd"] = "t:" + [genetic_height, family_predicted_height, background_height, actual_height].join('|');
    $.each(options, function(k, v){
      url += k + '=' + v + '&';
    });
    return '<img src="' + url + '">';
  },
  
  click_height: function(event) {
    this.el.find('#height-table tr').slice(1).remove();
    this.el.find('#height-table').hide();
    
    this.el.find('#height-graph-table tr').slice(1).remove();
    this.el.find('#height-graph-table').hide();
    
    var raw_sex = $('#sex label[aria-pressed="true"]').attr('for');
    if (raw_sex != undefined){
      window.App.user.sex = raw_sex;
    }
    
    var raw_height = this.el.find('#mom-height-textarea').val();
    
    if ($('#mom_height_units label[aria-pressed="true"]').attr('for') == 'mom_height_units_in'){
      window.App.user.mom_height = check_inches(raw_height);
    } else {
      window.App.user.mom_height = check_float(raw_height);
    }
    
    var raw_height = this.el.find('#dad-height-textarea').val();
    
    if ($('#height_units label[aria-pressed="true"]').attr('for') == 'height_units_in'){
      window.App.user.dad_height = check_inches(raw_height);
    } else {
      window.App.user.dad_height = check_float(raw_height);
    }
    
    var raw_height = this.el.find('#height-textarea').val();
    if ($('#dad_height_units label[aria-pressed="true"]').attr('for') == 'dad_height_units_in'){
      window.App.user.height = check_inches(raw_height);
    } else {
      window.App.user.height = check_float(raw_height);
    }
    
    if (this.check_height() == false) return;
    
    var prior = this.priors[window.App.user.population][window.App.user.sex];
    
    var family = this.get_family_height();
    
    var self = this;
    $.get(
      '/height/get_height_snps/', {
        population: window.App.user.population
      }, function(response) {
        return window.App.user.lookup_snps(self.calculate_height, {prior: prior, family: family, actual: window.App.user.height, height_info: response}, Object.keys(response), {});
      }
    );
  },
  
  get_family_height: function(){
    //return ((window.App.user.dad_height + window.App.user.mom_height)/2);
    var family_prior = this.priors[window.App.user.population][window.App.user.sex];
    var father_adjust = window.App.user.dad_height - this.priors[window.App.user.population]['male'];
    var mother_adjust = window.App.user.mom_height - this.priors[window.App.user.population]['female'];
    return (family_prior + father_adjust + mother_adjust);
  },
  
  calculate_height: function(args, all_snps, snp_info) {
    var prior = args['prior'];
    var family = args['family'];
    var actual = args['actual'];
    var height_info = args['height_info'];
    var self = this;
    var genetic = prior;
    var running_total = [];
    $.each(all_snps, function(i, v) {
      var user_snp = snp_info[v];
      if (user_snp != undefined) {
        genetic += self.adjust_height(user_snp, height_info[v].risk_allele, height_info[v].effect_size_cm);
        running_total.push(genetic);
      }
    });
    this.values['genetic'] = Math.round(genetic * 100) / 100;;
    this.values['family'] = family;
    this.values['population'] = prior;
    this.values['actual'] = actual;
    
    data = new google.visualization.DataTable();
    data.addColumn('string', 'SNP');
    data.addColumn('number', 'genetic');
    data.addColumn('number', 'family');
    data.addColumn('number', 'population');
    data.addColumn('number', 'actual');
    
    var running_total = _.map(running_total, function(v) {
      return Math.round(v * 100) / 100;
    });
    
    $.each(running_total, function(i, v) {
      data.addRow([(i + 1).toString(), v, family, prior, actual]);
    });
    var chart = new google.visualization.LineChart(
      document.getElementById('height-chart')
    );
    chart.draw(data, {
      width: 0.9 * this.el.find('.main').width(), 
      height: 400, 
      title: 'Predicted Heights',// (Genetic Prediction ' + Math.round(genetic * 100) / 100 + 'cm)',
      fontSize: 14, vAxis: {
        title: 'Height (cm)'
      }, hAxis: {
        title: 'SNP index (ordered by p-value)'
      }
    });
    
    this.el.find('#submit-height').show();
    
    this.el.find('#height-table').append(_.template(this.height_template, this.values));
    this.el.find('#height-table').show();
    
    return;
  },
  
  adjust_height: function(snp, risk_allele, effect_size) {
    factor = count_genotype(snp.genotype, risk_allele) - 1;
    return (effect_size * factor / 2);
  },
  
  check_height: function(){
    this.el.find('.required').hide();
    if (window.App.user.sex == null) {
      this.el.find('#please-select-sex').show('slow');
      return false;
    }
    if (window.App.user.mom_height == null) {
      this.el.find('#please-enter-mom-height').show('slow');
      return false;
    }
    if (window.App.user.dad_height == null) {
      this.el.find('#please-enter-dad-height').show('slow');
      return false;
    }
    if (window.App.user.height == null) {
      this.el.find('#please-enter-height').show('slow');
      return false;
    }
    if (window.App.check_all() == false) return false;
    
    if (!(window.App.user.population in this.priors)){
      this.el.find('#pop-error-box').empty();
      this.el.find('#please-choose-another-population').show('slow');
      this.el.find('#pop-error-box').append(window.App.user.population);
      return false;
    }
    return true;
  },
  
  check_submit_height: function() {
    console.log('Submitting');
    var self = this;
    $('#check-submit-height').dialog({
      autoOpen: false, modal: true, resizable: false, buttons: {
        'Okay!': function() {
          $(this).dialog('close');
          self.submit_height();
		    },
        'Cancel': function() {
          $(this).dialog('close');
        }
      }
    });
    $('#check-submit-height').dialog('open');
  },
  
  submit_height: function() {
    var submit_values = this.values;
    submit_values['exercise'] = 'class_height';
    $.get('/submit/', submit_values, function(response) {
      $('#submitted-height').dialog({
        modal: true, resizable: false, buttons: {
          'Okay!': function() {$(this).dialog('close');}
        }
      });
    });
  }
  });
});
