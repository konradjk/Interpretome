$(function() {
window.SimilarityView = Backbone.View.extend({
  el: $('#similarity'),
  has_loaded: false,

  events: {
    'click #similarity-snps': 'click_similarity_snps',
    'click #clear-snps': 'click_clear_snps',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit'
  },

  initialize: function() {
    _.bindAll(this,
      'click_similarity_snps', 'refresh_individuals',
      'click_submit', 'click_confirm_submit', 'calc_ibs_locus',
      'rearrange_individuals', 'loaded', 'calc_ibs', 'process_ibs',
      'calc_ibs_distance'
    );
  },
  
  render: function() {
    $.get('/media/template/similarity.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#similarity');
	  this.el.append(response);
	  
	  // Widget initialization.
	  this.el.find('button').button();
	  $('#table-options').hide();
    
    $('#looking-up').dialog({modal: true, resizable: false, autoOpen: false});
	  $('#similarity-resolution').buttonset();
	  // Template initialization.
	  this.similarity_snp_template = $('#similarity-snp-template').html();
	  $("#similarity-snps-table").tablesorter();
    clear_table('similarity-snps-table');
    
    window.App.genome_lists.push(this.refresh_individuals);
    this.refresh_individuals();
	  match_style(this.el);
	  this.has_loaded = true;
  },
  
  refresh_individuals: function(event) {
    $('#other-comparisons').empty();
    $('#genome-analysis option').each(function(i, v) {
      var item_name = v.value;
      $('#other-comparisons').append(
        $(document.createElement("input")).attr({ type:  'checkbox', id: item_name + '-similarity', value: item_name } )
      );
      $('#other-comparisons').append(' ' + item_name + '<br/>');
    });
  },
  
  click_submit: function(event) {
    var self = this;
    $('#confirm-submit-snps').dialog({
      modal: true, resizable: false, buttons: {
        'Confirm' : function() {
          self.click_confirm_submit();
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  },
  
  click_confirm_submit: function(event) {
    var output = {};
    var self = this;
    $('#similarity-snps-table tr').each( function() {
      dbsnp = $(this).find('.dbsnp').html();
      genotype = $(this).find('.genotype').html();
      if (dbsnp != null && genotype != 'Cannot Impute'){
        output[dbsnp] = genotype;
      }
    });
    $.get('/submit/submit_similarity_snps/', output, check_submission)
  },
  
  click_clear_snps: function(event) {
    clear_table('similarity-snps-table');
    $('#table-options').hide();
  },
  
  click_similarity_snps: function(event) {
    clear_table('similarity-snps-table');
    $('#similarity-number-of-snps').empty();
    $('#dendrogram').empty();
    $('.required').hide();
    if (window.App.check_genome() == false) return;
    var self = this;
	  
    var numsnps = $('#similarity-resolution label[aria-pressed="true"]').attr('for').replace('sim_', '');
    $('#table-options').show();
    
    // Add pre-defined individuals
    standard_compare = [];
    $('#standard-comparisons input').each( function(i, v){
      if (v.checked) {
        standard_compare.push(v.value);
      }
    });
    
    // Add other individuals
    user_compare = {};
    $('#other-comparisons input').each( function(i, v){
      if (v.checked) {
        user_compare[v.value] = window.App.users[v.value];
      }
    });
    
    if (_.size(user_compare) + _.size(standard_compare) == 0) {
      $('#please-select-similarity').show('slow');
      return;
    }
    $('#looking-up').dialog('open');
    
    if (_.size(standard_compare) == 0) {
      setTimeout(self.rearrange_individuals, 0, user_compare, null);
    } else {
      $.get(
        '/similarity/get_individuals/', {individuals : standard_compare.join(','), numsnps : numsnps},
        function(response) {
          self.rearrange_individuals(user_compare, response);
      });
    }
  },
  
  rearrange_individuals: function(user_compare, download_compare) {
    user = get_user();
    var total_comparisons = 0;
    var self = this;
    
    // Set up similarities array
    var hash_vectors = {};
    hash_vectors[user.username] = [];
    if (download_compare != null) {
      $.each(_.values(download_compare)[0], function(k){
        if (k != 'dbsnp') {
          hash_vectors[k] = [];
        }
      });
    }
    $.each(user_compare, function(k, g){
      hash_vectors[k] = [];
    });
    
    // Iterate through SNPs, only add if all individuals have SNP
    $.each(user.snps, function(i, v) {
      var user_genotype = v.genotype;
      if (user_genotype != null) {
        this_snp = {};
        add = true;
        // Iterate through downloaded individuals
        if (download_compare != null) {
          if (download_compare[i] != undefined) {
            $.each(download_compare[i], function(k, g) {
              if (k != 'dbsnp') {
                if (g != null) {
                  this_snp[k] = g;
                } else {
                  add = false;
                }
              }
            });
          } else {
            add = false;
          }
        }
        // Iterate through selected individuals
        if (_.size(user_compare) > 0) {
          $.each(user_compare, function(k, indiv) {
            g = indiv.lookup(i)
            if (g != undefined && g.genotype != null) {
              this_snp[k] = g.genotype;
            } else {
              add = false;
            }
          });
        }
        
        // Stringent check; deal with it.
        if (add) {
          this_snp[user.username] = user_genotype;
          $.each(this_snp, function(k){
            hash_vectors[k].push(this_snp[k]);
          });
        }
      }
    });
    self.process_ibs(hash_vectors);
  },
  
  process_ibs: function(hash_vectors) {
    var self = this;
    similarities = {};
    $.each(hash_vectors, function(i, v){
      if (i != user.username) {
        similarities[i] = self.calc_ibs(hash_vectors[user.username], v);
      }
    });
    self.draw_similarities_table(similarities, _.size(hash_vectors[user.username]));
    
    if ($('#cluster-similarity').attr('checked')) {
      var labels = _.keys(hash_vectors);
      var vectors = _.values(hash_vectors);
      var linkages = {'single-linkage' : figue.SINGLE_LINKAGE,
      'complete-linkage' : figue.COMPLETE_LINKAGE,
      'average-linkage' : figue.AVERAGE_LINKAGE};
      var root = figue.agglomerate(labels, vectors, self.calc_ibs_distance, linkages[$('#cluster-linkage option:selected').val()]);
      var dendrogram = root.buildDendogram(5, true, true, false, true);
      
      var pre = document.getElementById('dendrogram');
      if( document.all ) { pre.innerText = dendrogram; } else { pre.innerHTML = dendrogram; }
    }
    $('#looking-up').dialog('close');
  },
  
  calc_ibs_distance: function(vec1, vec2) {
    return (1.0 - 0.5*this.calc_ibs(vec1, vec2)/_.size(vec2));
  },
  
  calc_ibs: function(vec1, vec2) {
    var self = this;
    var ibs = 0;
    $.each(vec1, function(i, v){
      ibs += self.calc_ibs_locus(v, vec2[i]);
    });
    return ibs;
  },
  
  calc_ibs_locus: function(user_snp, other_snp) {
    if (user_snp.charAt(0) == other_snp.charAt(0)){
      if (user_snp.charAt(1) == other_snp.charAt(1)) {
        return 2;
      } else {
        return 1;
      }
    } else {
      if (user_snp.charAt(1) == other_snp.charAt(0)){
        if (user_snp.charAt(0) == other_snp.charAt(1)) {
          return 2;
        } else {
          return 1;
        }
      }
    }
    return 0;
  },  
  
  draw_similarities_table: function(similarities, total) {
    var self = this;
    $('#similarity-number-of-snps').append('Based on ' + total + ' SNPs, You (' + get_user().username + ') have the following IBS:');
    
    $.each(similarities, function(k, v) {
      output = {};
      output['indiv'] = k;
      sim = 100*v/(2*total);
      output['sim'] = sim.toFixed(3) + '%';
      $('#similarity-snps-table > tbody').append(_.template(self.similarity_snp_template, output));
    });
    $('#similarity-snps-table').show();
    $("#similarity-snps-table").trigger("update");
  }
  
  });
});
