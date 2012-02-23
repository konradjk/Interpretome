$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name:'Height',  
  table_id: '#height_table',
  template_id: '#height_template',
  url: '/media/template/lectures/height.html',
      
  events: {
    'click #predict_height': 'start'  
  },
  
  initialize: function() {
    _.bindAll(this, 'get_family_height',
      'adjust_height', 'loaded',
      'start',
      'display',
      'finish'
    );
  },
  
  render: function() {
    $.get(this.url, this.loaded);
  },
    
  loaded: function(response) {
	  $(this.el).append(response);
    $('#predict_height').button();
    $('#sex').buttonset();
    $('#your_height_units').buttonset();
    $('#mom_height_units').buttonset();
    $('#dad_height_units').buttonset();
    this.priors = { "CEU" : {"male" : 178.9, "female" : 164.8 },
        "YRI" : {"male" : 178, "female" : 163.2 },
        "MEX" : {"male" : 170.6, "female" : 158.7 },
        "CHB" : {"male" : 170.2, "female" : 158.6 },
        "CHD" : {"male" : 170.2, "female" : 158.6 },
        "JPT" : {"male" : 171.5, "female" : 158 }};
    
	  this.table_template = $(this.template_id).html();
  },
  
  start: function(response) {
    $.get('/media/help/height.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    $('.required').hide();
    $('#height_table tr').slice(1).remove();
    $('#height_chart').empty();
    user = get_user();
    user.sex = $('#sex label[aria-pressed="true"]').attr('for');
    if (user.sex == undefined) {
      $('#please-select-sex').show('slow');
      return false;
    }
    var raw_height = $('#mom-height-textarea').val();
    if ($('#mom_height_units label[aria-pressed="true"]').attr('for') == 'mom_height_units_in') {
      user.mom_height = check_inches(raw_height);
    } else {
      user.mom_height = check_float(raw_height);
    }
    
    var raw_height = $('#dad-height-textarea').val();
    if ($('#dad_height_units label[aria-pressed="true"]').attr('for') == 'dad_height_units_in'){
      user.dad_height = check_inches(raw_height);
    } else {
      user.dad_height = check_float(raw_height);
    }
    
    var raw_height = $('#height-textarea').val();
    if ($('#your_height_units label[aria-pressed="true"]').attr('for') == 'your_height_units_in'){
      user.height = check_inches(raw_height);
    } else {
      user.height = check_float(raw_height);
    }
    
    if (user.mom_height == null) {
      $('#please-enter-mom-height').show('slow');
      return false;
    }
    if (user.dad_height == null) {
      $('#please-enter-dad-height').show('slow');
      return false;
    }
    if (user.height == null) {
      $('#please-enter-height').show('slow');
      return false;
    }
    
    if (!(user.population in this.priors)){
      $('#pop-error-box').empty();
      $('#please-choose-another-population').show('slow');
      $('#pop-error-box').append(user.population);
      return false;
    }
    
    var prior = this.priors[user.population][user.sex];
    var family = this.get_family_height();
    var self = this;
    $.get(
      '/height/get_height_snps/', {
        population: user.population
      }, function(response) {
        return user.lookup_snps(
          self.display, {
            prior: prior, family: family, 
            actual: user.height, height_info: response
          }, _.keys(response), {}
        );
      }
    );
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    
    var prior = response['prior'];
    var family = response['family'];
    var actual = response['actual'];
    var height_info = response['height_info'];
    var self = this;
    var genetic = prior;
    var running_total = [];
    $.each(all_dbsnps, function(i, v) {
      var user_snp = extended_dbsnps[v];
      if (user_snp != undefined) {
        genetic += self.adjust_height(user_snp, height_info[v].risk_allele, height_info[v].effect_size_cm);
        running_total.push(genetic);
      }
    });
    
    values = {};
    values['genetic'] = Math.round(genetic * 100) / 100;
    values['family'] = family;
    values['population'] = prior;
    values['actual'] = actual;
    
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
      document.getElementById('height_chart')
    );
    chart.draw(data, {
      width: 0.9 * $('.main').width(), 
      height: 400, 
      title: 'Predicted Heights',// (Genetic Prediction ' + Math.round(genetic * 100) / 100 + 'cm)',
      fontSize: 14, vAxis: {
        title: 'Height (cm)'
      }, hAxis: {
        title: 'SNP index (ordered by p-value)'
      }
    });
    
    $('#height_table').append(_.template(this.table_template, values));
    $('#height_table').show();
    
    return;
    
    //$.each(extended_dbsnps, function(i, v) {
    //  $(self.table_id + " > tbody").append(_.template(self.table_template, v))
    //});
    //$(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    
    this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  },
  
  get_family_height: function(){
    var family_prior = 
      this.priors[user.population][user.sex];
    var father_adjust = user.dad_height - 
                        this.priors[user.population]['male'];
    var mother_adjust = user.mom_height - 
                        this.priors[user.population]['female'];
    return (family_prior + father_adjust + mother_adjust);
  },
  
  adjust_height: function(snp, risk_allele, effect_size) {
    factor = count_genotype(snp.genotype, risk_allele) - 1;
    return (effect_size * factor / 2);
  },
});
});
