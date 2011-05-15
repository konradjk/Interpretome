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
	  this.el.append(response);
	  
	  // Widget initialization.
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
    this.el.find('#earwax').buttonset();
    this.el.find('#eyes').buttonset();
    this.el.find('#asparagus').buttonset();
    this.el.find('#bitter').buttonset();
    this.el.find('#lactose').buttonset();
	  this.el.find('.help > div').show();
	  this.el.find('.description > div').hide();
	  this.el.find('.submit > div').hide();
	  
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
    this.el.find('#gwas-snps-table tr').each( function() {
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
    this.el.find('#gwas-snps-table tr').slice(1).remove();
    this.el.find('#gwas-snps-table').hide();
    this.el.find('.submit > div').hide();
  },
  
  click_gwas_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = filter_identifiers(
      this.el.find('#gwas-snps-textarea').val().split('\n')
    );
    return window.App.user.lookup_snps(this.show_table, {}, dbsnps, {});
  },
  
  show_table: function(args, dbsnps, info){
    var self = this;
    $.each(dbsnps, function(i, v) {
      self.el.find('#gwas-snps-table').append(_.template(self.gwas_snp_template, info[v]));
    });
    self.el.find('#gwas-snps-table').show();
    self.el.find('.submit > div').show();
  }
  });
});
