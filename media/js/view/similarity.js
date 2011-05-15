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
      'click_similarity_snps',
      'click_submit', 'click_confirm_submit',
      'loaded'
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
	  this.el.find('.help-button').button({
	    icons: {primary: 'ui-icon-help'}	    
	  });
	  this.el.find('.help > div').show();
	  this.el.find('.description > div').show();
	  this.el.find('.submit > div').hide();
    
    this.el.find('#looking-up').dialog({modal: true, resizable: false, autoOpen: false});
	  
	  // Template initialization.
	  this.similarity_snp_template = $('#similarity-snp-template').html();
	  
	  this.has_loaded = true;
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
    this.el.find('#similarity-snps-table tr').each( function() {
      dbsnp = $(this).find('.dbsnp').html();
      genotype = $(this).find('.genotype').html();
      if (dbsnp != null && genotype != 'Cannot Impute'){
        output[dbsnp] = genotype;
      }
    });
    $.get('/submit/submit_similarity_snps/', output, check_submission)
  },
  
  click_clear_snps: function(event) {
    this.el.find('#similarity-snps-table tr').slice(1).remove();
    this.el.find('#similarity-snps-table').hide();
    this.el.find('.submit > div').hide();
  },
  
  click_similarity_snps: function(event) {
    if (window.App.check_genome() == false) return;
    $('#looking-up').dialog('open');
    var numsnps = this.el.find('#numsnps-textarea').val();
    var self = this;
    $.get(
      '/similarity/get_individuals/', {numsnps : numsnps},
      function(response) {
        var similarities = {};
        var total_comparisons = {};
        $.each(response, function(index, v) {
          user_SNP = window.App.user.lookup(filter_identifier(v['rsid'])[0]);
          if (user_SNP != undefined){
            user_genotype = user_SNP.genotype;
            $.each(v, function(k, g) {
              if (user_genotype != null && g != null && k != 'rsid') {
                if (!(k in total_comparisons)){
                  similarities[k] = 0;
                  total_comparisons[k] = 0;
                }
                if (user_genotype.charAt(0) == g.charAt(0) || user_genotype.charAt(0) == g.charAt(1)) {
                  similarities[k] += 1;
                }
                if (user_genotype.charAt(1) == g.charAt(0) || user_genotype.charAt(1) == g.charAt(1)) {
                  similarities[k] += 1;
                }
                total_comparisons[k] += 1;
              }
            });
          }
        });
        $.each(similarities, function(k, v) {
          output = {};
          output['indiv'] = k;
          sim = 100*v/(2*total_comparisons[k]);
          output['sim'] = sim.toFixed(3) + '%';
          self.el.find('#similarity-snps-table').append(_.template(self.similarity_snp_template, output));
        });
        self.el.find('#similarity-snps-table').show();
        $('#looking-up').dialog('close');
      }
    );
  }
  
  
  });
});
