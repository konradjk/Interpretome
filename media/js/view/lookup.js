$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),

  events: {
    'click #lookup-snps': 'clickLookupSnps',
    'click #impute-snp': 'clickImputeSnp',
    'click .help-button': 'clickHelp'
  },

  initialize: function() {
    _.bindAll(this, 'clickLookupSnps', 'clickImputeSnp', 'clickHelp', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/lookup.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.lookupSnpTemplate = $('#lookup-snp-template').html();
	  this.imputeSnpTemplate = $('#impute-snp-template').html();
	  this.el.find('.help > div').hide();
  },
  
  filterIdentifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
  },
  
  clickHelp: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    console.log(id);
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  
  clickLookupSnps: function(event) {
    var dbsnps = this.filterIdentifiers(this.el.find('#lookup-snps-textarea').val().split('\n'));
    this.lookupSnps(dbsnps);
  },
  
  lookupSnps: function(dbsnps) {
    if (window.App.checkGenome() == false) return;
    
    var table = this.el.find('#lookup-snps-table');
    table.find('tr:first ~ tr').remove();

    $.each(dbsnps, function(i, v) {
      var snp = {dbsnp: v};
      var userSnp = window.App.user.lookup(parseInt(v));
      
      if (userSnp == undefined) snp.genotype = 'no value';
      else snp.genotype = userSnp.genotype;
      
      $(table).append(_.template(window.Lookup.lookupSnpTemplate, snp));
    });
    table.show();
  },
  clickImputeSnp: function() {
    if (window.App.checkAll() == false) return;
    
    var dbsnp = parseInt(this.el.find('#impute-snp-input').val());
    if (_.include(window.App.user.dbsnps, dbsnp)) {
      this.lookupSnps([dbsnp]);
      this.el.find('#have-snp').dialog({
        modal: true, resizable: false, buttons: {
          'Okay': function() {$(this).dialog('close');}
        }
      });
      return;
    }
    var population = window.App.user.population;
    
    $.get('/lookup/linked/', {dbsnp: dbsnp, population: population}, this.gotLinked);
  },
  gotLinked: function(response) {
    console.log(response);
  }
});
});