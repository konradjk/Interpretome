$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),

  events: {
    'click #lookup-snps': 'clickLookupSnps',
    'click .help-button': 'clickHelp'
  },

  initialize: function() {
    _.bindAll(this, 'clickLookupSnps', 'clickHelp', 'loaded', 'gotLinked', 'gotPhases');
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
    if (window.App.checkAll() == false) return;
    
    var dbsnps = this.filterIdentifiers(this.el.find('#lookup-snps-textarea').val().split('\n'));
    var haveDbsnps = [];
    var lookupDbsnps = [];
    $.each(dbsnps, function(i, v) {
      var dbsnp = window.App.user.lookup(v);
      if (dbsnp == undefined) lookupDbsnps.push(v);
      else haveDbsnps.push(v);
    });
    if (lookupDbsnps.length == 0) return this.gotPhases(dbsnps, [], {});
    
    var self = this;
    $.get(
      '/lookup/linked/', 
      {population: window.App.user.population, dbsnps: lookupDbsnps.join(',')},
      function(response) {return self.gotLinked(haveDbsnps, response);}
    );
  },
  
  gotLinked: function(haveDbsnps, response) {
    var unimputableDbsnps = [];
    var requestDbsnps = [];
    $.each(Object.keys(response), function(i, v) {
      var any = false;
      $.each(response[v], function(i, linkedSnp) {
        if (parseInt(v) != linkedSnp.dbSNP1) var linkedDbsnp = linkedSnp.dbSNP1; 
        else var linkedDbsnp = linkedSnp.dbSNP2;
        
        var userSnp = window.App.user.lookup(linkedDbsnp);
        if (userSnp != undefined) {
          requestDbsnps.push(linkedDbsnp);
          any = true;
          return;
        }
      });
      if (!any) {
        unimputableDbsnps.push(parseInt(v));
      }
    });
    console.log('Requesting:', requestDbsnps);
    var self = this;
    $.get(
      '/lookup/impute/',
      {population: window.App.user.population, dbsnps: requestDbsnps.join(',')},
      function(response) {
        self.gotPhases(haveDbsnps, unimputableDbsnps, response);
      }
    );
  },
  
  gotPhases: function(haveDbsnps, unimputableDbsnps, response) {
    console.log('Have:', haveDbsnps);
    console.log('Unimputable:', unimputableDbsnps);
    console.log('Response:', response);
    
  }
});
});
