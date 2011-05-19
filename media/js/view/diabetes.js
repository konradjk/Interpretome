$(function() {
window.DiabetesView = Backbone.View.extend({
  el: $('#diabetes'),
  has_loaded: false,
  
  events: {
    'click #compute-diabetes': 'click_compute_diabetes',
    'click #submit-diabetes': 'click_submit_diabetes'
  },
  
	priors: {
    CEU: 0.237,
    JPT: 0.20,
    CHB: 0.20,
    YRI: 0.233
  },


  initialize: function() {
    _.bindAll(this, 
      'click_compute_diabetes', 
      'got_diabetes_snps', 
      'show_diabetes_snps',
      'click_submit_diabetes',
      'loaded'
    );
  },
  
  render: function() {
    $.get('/media/template/diabetes.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  
	  this.el.find('button').button();
	  match_style(this.el);
	  
	  this.diabetes_snp_template = this.el.find('#diabetes-snp-template').html();
	  
    this.has_loaded = true;
  },
  
  click_compute_diabetes: function(event) {
    if (window.App.check_all() == false) return;
    
    this.el.find('#diabetes-table tr').slice(1).remove();
    this.el.find('#diabetes-table').hide();
    
    $.get('/diabetes/', {population: window.App.user.population}, this.got_diabetes_snps);
  },
  
  got_diabetes_snps: function(response) {
    window.App.user.lookup_snps(
      this.show_diabetes_snps, response['snps'], response['dbsnps'], response
    );
  },
  
  show_diabetes_snps: function(response, all_dbsnps, extended_dbsnps) {
    all_dbsnps = _.uniq(all_dbsnps);
    var self = this;
    var lr = compute_odds(this.priors[window.App.user.population]);
    
    data = new google.visualization.DataTable();
    data.addColumn('string', 'SNP');
    data.addColumn('number', 'Running LR');
    data.addColumn('number', 'Prior');
    data.addRow(['Prior', 100 * compute_probability(lr), 100 * this.priors[window.App.user.population]]);
    
    self.el.find('#diabetes-table').append(
      '<tr><td><strong>Prior</td><td></td><td></td><td></td><td></td></tr>'
    );
    self.el.find('#diabetes-table tr:last').
          append('<td>' + parseFloat(lr).toFixed(3) + '</td><td>' + parseFloat(lr).toFixed(3) +
                 '</td><td>' + parseFloat(100*compute_probability(lr)).toFixed(3) + '% </td>');
    for (var i = 0; all_dbsnps[i]; i++) {
      var user_snp = extended_dbsnps[all_dbsnps[i]];
      for (var j = 0; response[all_dbsnps[i]][j]; j++) {
        var study_snp = response[all_dbsnps[i]][j];
        if (user_snp.genotype == 'NA') continue;
        if (!compare_arrays(user_snp.genotype.split(''), study_snp.genotype.split(''))) continue;
        //console.log(i);
        //console.log(all_dbsnps[i]);
        //console.log(response[all_dbsnps[i]][j]);
        user_snp.study_size = study_snp.study_size;
        user_snp.LR = study_snp.LR;
        self.el.find('#diabetes-table').append(_.template(self.diabetes_snp_template, user_snp));
	      lr = lr * study_snp.LR;
	      self.el.find('#diabetes-table tr:last').
	        append('<td>' + study_snp.LR.toFixed(3) + '</td><td>' + parseFloat(lr).toFixed(3) + 
	          '</td><td>' + parseFloat(100 * compute_probability(lr)).toFixed(3) + '% </td>');
	      data.addRow([study_snp.dbsnp + '', 100 * compute_probability(lr), 100 * this.priors[window.App.user.population]]);
	      break;
      }
    }
    this.el.find('#diabetes-table').show();
    
    var chart = new google.visualization.LineChart(
      document.getElementById('diabetes-chart')
    );
    
    chart.draw(data, {
      width: 0.9 * this.el.find('.main').width(), 
      height: 400, 
      title: 'Running Total (By Likelihood Ratios)',
      fontSize: 14, vAxis: {
        title: 'Adjusted Probability'
      }, hAxis: {
        title: 'SNP Index (Ordered By Study Size)'
      }
    });
    this.el.find('#diabetes-chart').show();
    this.el.find('#submit-diabetes').parent().show();
	},
	
	click_submit_diabetes: function() {
	  var self = this;
	  this.el.find('#confirm-submit-diabetes').dialog({modal: true, resizable: false, buttons: {
	    'Okay': function() {
	      $(this).dialog('close');
	      var data = window.App.user.serialize();
	      var prior = parseFloat(self.el.find('#diabetes-table tr:eq(1) td:last').html()) / 100;
	      var estimate = parseFloat(self.el.find('#diabetes-table tr:last td:last').html()) / 100;
	      data = $.extend(data, {prior: prior, estimate: estimate, exercise: 'class_diabetes'});
	      $.get('/submit/', data, check_submission);
	    },
	    'Cancel': function() {
	      $(this).dialog('close');
	    }
	  }})
	}

});
});
