$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  nam:'Longevity',  
  table_id: '#longevity_table',
  template_id: '#longevity_template',
  url: '/media/template/lectures/longevity.html',

  regex: new RegExp(/\//),
  
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
    $.get('/media/help/longevity.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    return true;
  },
  
  display: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var dbsnps = [];
    var el_alleles = [];
    var el_probabilities = [];
    var user_genotypes = [];
    
    data = new google.visualization.DataTable();
    data.addColumn('string', 'SNP');
    data.addColumn('number', 'Running Probability');
    
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
          dbsnps.push(v);
          el_probabilities.push(probabilities);
        }
      });
    });
    
    this.el.find('#longevity_table').show();
    $('#table-options').show();
    
    this.finish(el_probabilities, el_alleles, dbsnps, extended_dbsnps);
  },
  
  finish: function(el_probabilities, el_alleles, dbsnps, extended_dbsnps) {
    
    var self = this;
    var el_running_odds = [1];
    var el_running_probability = [50]; 
    $.each(el_probabilities, function(i, v) {
		  var dbsnp = dbsnps[i];
      el_odds = v[0] / v[1];
      el_running_odds.push(el_running_odds[i] * el_odds);
	    el_running_probability.push(100 * (el_running_odds[i + 1] / (1 + el_running_odds[i + 1])));
      data.addRow([dbsnp, Math.round(el_running_probability[i + 1]*100)/100]);
      var template_data = {
        dbsnp: dbsnp, alleles: el_alleles[i], genotype: extended_dbsnps[dbsnp].genotype,
        imputed_from: extended_dbsnps[dbsnp].imputed_from, 
        r_squared: extended_dbsnps[dbsnp].r_squared,
        or: el_odds, ror: el_running_odds[i + 1], rp: el_running_probability[i + 1]
      };
      self.el.find('#longevity_table').append('<tr><td>' + 
        _.map(
          ['dbsnp', 'alleles', 'genotype', 'imputed_from', 'r_squared', 'or', 'ror', 'rp'], 
          function(v) {
            if (_.isNumber(template_data[v])) return Math.round(template_data[v] * 1000) / 1000;
            else return template_data[v];
          }
        ).join('</td><td>') + '</td></tr>'
      );
    });
    this.el.find('#longevity_table').append(
      '<tr>' + 
      '<td class="key"><strong>Probability of extreme longevity:</strong>' +
      '</td><td></td><td></td><td></td><td></td><td></td><td></td>' +
      '<td class="value">' + 
      self.el.find('#longevity_table tr:last td:last').text() + '</td></tr>'
    );
    var chart = new google.visualization.LineChart(
      document.getElementById('longevity_chart')
    );
    
    chart.draw(data, {
      width: 0.9 * this.el.find('.main').width(), 
      height: 400, 
      title: 'Probability of Extreme Longevity',
      fontSize: 14, vAxis: {
        title: 'Probability (%)'
      }, hAxis: {
        title: 'SNP (Ordered by Informativeness)'
      }
    });      
    
    this.el.find('#submit-longevity').parent().show();  
  }
});
});
