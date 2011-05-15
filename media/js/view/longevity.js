$(function() {
window.LongevityView = Backbone.View.extend({
  el: $('#longevity'),
  has_loaded: false,
  regex: new RegExp(/\//),
  
  events: {
    'click #compute-longevity': 'click_compute_longevity',
    'click .help-button': 'click_help',
    'click #submit-longevity': 'click_submit_longevity'
  },

  initialize: function() {
    _.bindAll(this, 
      'click_compute_longevity', 'got_longevity_snps', 'show_longevity_snps',
      'click_submit_longevity',
      'click_help', 'loaded'
    );
  },
  
  render: function() {
    $.get('/media/template/longevity.html', this.loaded);
  },
  
  sort_genotype: function(genotype) {
    return genotype.split('').sort().join('');
  },
    
  loaded: function(response) {
    this.el.append(response);
    
    this.el.find('button').button();
    this.el.find('#sex').buttonset();
    this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
    this.el.find('.help > div').hide();
    
    match_style(this.el);
    
    this.longevity_snp_template = $('#longevity-snp-template').html();
    
    this.has_loaded = true;
  },
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  click_compute_longevity: function(event) {
    window.App.check_all();
    $.get('/lookup/longevity/', {}, this.got_longevity_snps);
  },
  
  got_longevity_snps: function(response) {
    window.App.user.lookup_snps(
      this.show_longevity_snps, response, response.sorted_dbsnps, {}
    );
  },
  
  show_longevity_snps: function(response, all_dbsnps, extended_dbsnps) {
    window.App.user.sex = this.el.find('#sex label[aria-pressed="true"] span').html()
    
    var self = this;
    var dbsnps = [];
    var el_alleles = [];
    var el_probabilities = [];
    var user_genotypes = [];
    
    data = new google.visualization.DataTable();
    data.addColumn('string', 'SNP');
    data.addColumn('number', 'Running probability');
    
    //console.log(all_dbsnps);
    
    _.each(response.sorted_dbsnps, function(v) {
      var found = false;
      var longevity_snp = response.snps[v];
      var user_snp = extended_dbsnps[v];
      if (_.isNaN(user_snp.genotype)) 
        return;
        
      _.each([user_snp.genotype, flip_genotype(user_snp.genotype)], function(user_genotype) {
        var probabilities = [];
        if (found || user_genotype == 'NA') return;
		    
		    var alleles = longevity_snp.alleles.split(self.regex);
		    
		    if (alleles[0] + alleles[0] == user_genotype) {
		      probabilities.push(longevity_snp['f_cases_aa']);
		      probabilities.push(longevity_snp['f_controls_aa']);
		    } else if (alleles[1] + alleles[1] == user_genotype) {
		      probabilities.push(longevity_snp['f_cases_bb']);
		      probabilities.push(longevity_snp['f_controls_bb']);
		    } else if (alleles.sort().join('') == user_genotype.split('').sort().join('')) {
		      probabilities.push(longevity_snp['f_cases_ab']);
		      probabilities.push(longevity_snp['f_controls_ab']);
		    }
        
        if (probabilities.length == 2) {
          found = true;
          el_alleles.push(longevity_snp.alleles);
          user_genotypes.push(user_genotype);
          dbsnps.push(v);
          el_probabilities.push(probabilities);
        }
      });
      //if (!found) console.log('Unable to match ' + v);
    });
    
    this.el.find('#longevity-table').show();
    var el_running_odds = [1];
    var el_running_probability = [50]; 
    $.each(el_probabilities, function(i, v) {
		  var dbsnp = dbsnps[i];
      el_odds = v[0] / v[1];
      el_running_odds.push(el_running_odds[i] * el_odds);
	    el_running_probability.push(100 * (el_running_odds[i + 1] / (1 + el_running_odds[i + 1])));
      data.addRow([dbsnp, el_running_probability[i + 1]]);
      var template_data = {
        dbsnp: dbsnp, alleles: el_alleles[i], genotype: user_genotypes[i],
        imputed_from: extended_dbsnps[dbsnp].imputed_from, 
        r_squared: extended_dbsnps[dbsnp].r_squared,
        or: el_odds, ror: el_running_odds[i + 1], rp: el_running_probability[i + 1]
      };
      $('#longevity-table').append('<tr><td>' + 
        _.map(
          ['dbsnp', 'alleles', 'genotype', 'imputed_from', 'r_squared', 'or', 'ror', 'rp'], 
          function(v) {
            if (_.isNumber(template_data[v])) return Math.round(template_data[v] * 1000) / 1000;
            else return template_data[v];
          }
        ).join('</td><td>') + '</td></tr>'
      );
    });
    
    
    var chart = new google.visualization.LineChart(
      document.getElementById('longevity-chart')
    );
    
    chart.draw(data, {
      width: 0.9 * this.el.find('.main').width(), 
      height: 400, 
      title: 'Probability of extreme longevity',
      fontSize: 14, vAxis: {
        title: 'Probability'
      }, hAxis: {
        title: 'SNP index (ordered by informativeness)'
      }
    });      
    
    this.el.find('#submit-longevity').parent().show();
      
    
  },
  
  click_submit_longevity: function() {
    var self = this;
    this.el.find('#confirm-submit-longevity').dialog({modal: true, resizable: false, buttons: {
      'Okay': function() {
        $(this).dialog('close');
        var data = window.App.user.serialize();
        var prior = parseFloat(self.el.find('#longevity-table tr:eq(1) td:last').html()) / 100;
        var estimate = parseFloat(self.el.find('#longevity-table tr:last td:last').html()) / 100;
        data = $.extend(data, {prior: prior, estimate: estimate, exercise: 'class_longevity'});
        $.get('/submit/', data, function(response) {
          self.el.find('#submitted-longevity').dialog({resizable: false, modal: true, buttons: {
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
