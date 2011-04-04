$(function() {
window.GwasView = Backbone.View.extend({
  el: $('#gwas'),
  has_loaded: false,
  hidden: false,

  events: {
    'click #gwas-snps': 'click_gwas_snps',
    'click #clear-snps': 'click_clear_snps',
    'click .help-button': 'click_help',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit'
  },

  initialize: function() {
    _.bindAll(this,
      'click_gwas_snps', 'click_help',
      'click_submit', 'click_confirm_submit',
      'loaded'
    );
  },
  
  render: function() {
    $.get('/media/template/gwas.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#gwas');
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.gwas_snp_template = $('#gwas-snp-template').html();
    this.el.find('#earwax').buttonset();
    this.el.find('#eyes').buttonset();
    this.el.find('#asparagus').buttonset();
    this.el.find('#bitter').buttonset();
    this.el.find('#lactose').buttonset();
	  this.el.find('.help > div').show();
	  this.el.find('.description > div').hide();
	  this.el.find('.submit > div').hide();
	  this.has_loaded = true;
  },
  
  filter_identifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
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
    $.get(
      '/submit/submit_gwas_snps/',
      output,
      function(response) {
        if (response != null){
          return self.thanks_for_submitting();
        }else{
          return self.nothing_submitted();
        }
      }
    );
  },
  
  nothing_submitted: function(event) {
    $('#nothing').dialog({
      modal: true, resizable: false,
      buttons: {
        'OK' : function() {
          $(this).dialog('close');
        }
      }
    })
  },
  
  thanks_for_submitting: function(event) {
    $('#thank-you').dialog({
      modal: true, resizable: false, buttons: {
        'Woohoo!' : function() {
          $(this).dialog('close');
        }
      }
    });
  },
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    if (this.hidden){
      this.el.find('.help > div').hide().parent().find(id).show('normal');
      this.hidden = false;
    }else{
      this.el.find('.help > div').hide('normal');
      this.hidden = true;
    }
  },
  
  click_clear_snps: function(event) {
    this.el.find('#gwas-snps-table tr').slice(1).remove();
    this.el.find('#gwas-snps-table').hide();
    this.el.find('.submit > div').hide();
  },
  
  click_gwas_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = this.filter_identifiers(
      this.el.find('#gwas-snps-textarea').val().split('\n')
    );
    self = this;  
    $.each(dbsnps, function(i, v) {
      if (window.App.user.lookup(v) != undefined){
        print_snp = {};
        print_snp['dbsnp'] = v;
        print_snp['genotype'] = window.App.user.lookup(v).genotype;
        self.el.find('#gwas-snps-table').append(_.template(self.gwas_snp_template, print_snp));
      }
    });
    self.el.find('#gwas-snps-table').show();
    self.el.find('.submit > div').show();
  }
  });
});
