$(function() {
window.GwasView = Backbone.View.extend({
  el: $('#gwas'),
  has_loaded: false,

  events: {
    'click #gwas-snps': 'click_gwas_snps',
    'click #clear-snps': 'click_clear_snps',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit'
  },

  initialize: function() {
    _.bindAll(this,
      'click_gwas_snps',
      'click_submit', 'click_confirm_submit',
      'loaded', 'show_table'
    );
  },
  
  render: function() {
    $.get('/media/template/gwas.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#gwas');
	  $(this.el).append(response);
	  
	  // Widget initialization.
	  $('button').button();
	  $('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
    $('#earwax').buttonset();
    $('#eyes').buttonset();
    $('#asparagus').buttonset();
    $('#bitter').buttonset();
    $('#lactose').buttonset();
	  $('.help > div').show();
	  $('.description > div').hide();
	  $('.submit > div').hide();
	  
	  // Template initialization.
	  this.gwas_snp_template = $('#gwas-snp-template').html();
	  
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
    $('#gwas-snps-table tr').each( function() {
      dbsnp = $(this).find('.dbsnp').html();
      genotype = $(this).find('.genotype').html();
      if (dbsnp != null && genotype != 'Cannot Impute'){
        output[dbsnp] = genotype;
      }
    });
    output['earwax'] = $('#earwax label[aria-pressed="true"]').attr('for')
    output['eyes'] = $('#eyes label[aria-pressed="true"]').attr('for')
    output['asparagus'] = $('#asparagus label[aria-pressed="true"]').attr('for')
    output['bitter'] = $('#bitter label[aria-pressed="true"]').attr('for')
    output['lactose'] = $('#lactose label[aria-pressed="true"]').attr('for')
    $.get( '/submit/submit_gwas_snps/', output, check_submission);
  },
  
  click_clear_snps: function(event) {
    $('#gwas-snps-table tr').slice(1).remove();
    $('#gwas-snps-table').hide();
    $('.submit > div').hide();
  },
  
  click_gwas_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = filter_identifiers(
      $('#gwas-snps-textarea').val().split('\n')
    );
    return get_user().lookup_snps(this.show_table, {}, dbsnps, {});
  },
  
  show_table: function(args, dbsnps, info){
    var self = this;
    $.each(dbsnps, function(i, v) {
      $('#gwas-snps-table').append(_.template(self.gwas_snp_template, info[v]));
    });
    $('#gwas-snps-table').show();
    $('.submit > div').show();
  }
  });
});
