$(function() {
window.DiabetesView = Backbone.View.extend({
  el: $('#diabetes'),
  has_loaded: false,
  
  priors: {
    CEU: {
      Male: 0.237,
      Female: 0.182
    },
    JPT: {
      Male: 0.2,
      Female: 0.2
    },
    CHB: {
      Male: 0.2,
      Female: 0.2
    },
    GIH: {
      Male: 0.2,
      Female: 0.2
    },
    YRI: {
      Male: 0.233,
      Female: 0.233
    }
  },

  events: {
    'click #compute-diabetes': 'click_compute_diabetes',
    'click .help-button': 'click_help',
    'click #submit-diabetes': 'click_submit_diabetes'
  },

  initialize: function() {
    _.bindAll(this, 
      'click_compute_diabetes', 'got_diabetes_snps', 'show_diabetes_snps',
      'click_submit_diabetes',
      'click_help', 'loaded'
    );
  },
  
  render: function() {
    $.get('/media/template/diabetes.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  
	  this.el.find('button').button();
	  this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
    this.el.find('#sex').buttonset();
	  this.el.find('.help > div').hide();
	  
	  match_style(this.el);
	  
	  this.diabetes_snp_template = $('#diabetes-snp-template').html();
	  
    this.has_loaded = true;
  },
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  click_compute_diabetes: function(event) {
    window.App.check_all();
    $.get('/diabetes/', {population: window.App.user.population}, this.got_diabetes_snps);
  },
  
  got_diabetes_snps: function(response) {
    window.App.user.lookup_snps(
      this.show_diabetes_snps, response['snps'], response['dbsnps'], response
    );
  },
  
  show_diabetes_snps: function(response, all_dbsnps, extended_dbsnps) {
    window.App.user.sex = this.el.find('#sex label[aria-pressed="true"] span').html()
    
    var self = this;
    var lr = compute_odds(this.priors[window.App.user.population][window.App.user.sex]);
    
    data = new google.visualization.DataTable();
    data.addColumn('string', 'SNP');
    data.addColumn('number', 'Running LR');
    data.addRow(['Prior', 100 * compute_probability(lr)]);
    
    self.el.find('#diabetes-table').append(_.template(self.diabetes_snp_template, window.App.user.blank_extended_snp('Prior')));
    self.el.find('#diabetes-table tr:last').
          append('<td>' + parseFloat(lr).toFixed(3) + '</td><td>' + parseFloat(lr).toFixed(3) +
                 '</td><td>' + parseFloat(100*compute_probability(lr)).toFixed(3) + '% </td>');
    $.each(all_dbsnps, function(i, v) {
      var user_snp = extended_dbsnps[v];
      _.each(response[v], function(v) {
        if (user_snp.genotype != 'NA' && 
            compare_arrays(user_snp.genotype.split(''), v.genotype.split(''))) {
		      self.el.find('#diabetes-table').append(_.template(self.diabetes_snp_template, user_snp));
		      lr = lr * v.LR;
		      self.el.find('#diabetes-table tr:last').
		            append('<td>' + v.LR.toFixed(3) + '</td><td>' + parseFloat(lr).toFixed(3) +
                       '</td><td>' + parseFloat(100 * compute_probability(lr)).toFixed(3) + '% </td>');
		      data.addRow([v.dbsnp + '', 100*compute_probability(lr)]);
        }
      });
    });
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
	      $.get('/submit/', data, function(response) {
	        self.el.find('#submitted-diabetes').dialog({resizable: false, modal: true, buttons: {
            'Thanks!': function() {$(this).dialog('close');}
          }});
	      });
	    },
	    'Cancel': function() {
	      $(this).dialog('close');
	    }
	  }})
	}

});
});
