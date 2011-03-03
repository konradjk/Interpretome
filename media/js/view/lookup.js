$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),

  events: {
    'click #lookup-snps': 'clickLookupSnps',
    'click #lookup-by-file': 'clickLookupByFile',
    'click #clear-snps': 'clickClearSnps',
    'click .help-button': 'clickHelp'
  },

  initialize: function() {
    _.bindAll(this, 'clickLookupSnps', 'clickClearSnps', 'clickHelp', 'loaded', 'gotLinked', 'gotPhases');
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
  
  clickClearSnps: function(event) {
    this.el.find('#lookup-snps-table tr').slice(1).remove();
    this.el.find('#lookup-snps-table').hide();
  },
  
  clickLookupByFile: function(event) {
    var reader = new FileReader();
    reader.onloadend = this.loadSnpFile;
    reader.readAsText(event.target.files[0]);
  },
  
  loadSnpFile: function(event) {
    $.each(event.target.result.split('\n'), function (i, v){
        var line = v.split('\s');
        var rsid = line[0];
        var info = line.join(' ');
        console.log(rsid)
    });
  },
  
  clickLookupSnps: function(event) {
    if (window.App.checkAll() == false) return;
    
    var dbsnps = this.filterIdentifiers(this.el.find('#lookup-snps-textarea').val().split('\n'));
    return this.lookupSnps(dbsnps);
  },
  
  lookupSnps: function(dbsnps) {
    var haveDbsnps = [];
    var lookupDbsnps = [];
    $.each(dbsnps, function(i, v) {
      var dbsnp = window.App.user.lookup(v);
      console.log(dbsnp)
      if (dbsnp == undefined) lookupDbsnps.push(v);
      else haveDbsnps.push(v);
    });
    console.log(lookupDbsnps.length)
    if (lookupDbsnps.length == 0) return this.gotPhases(dbsnps, haveDbsnps, [], {});
    
    var self = this;
    $.get(
      '/lookup/linked/', 
      {population: window.App.user.population, dbsnps: lookupDbsnps.join(',')},
      function(response) {return self.gotLinked(dbsnps, haveDbsnps, response);}
    );
  },
  
  gotLinked: function(all_dbsnps, haveDbsnps, response) {
    var unimputableDbsnps = [];
    var userDbsnps = [];
    var requestDbsnps = [];
    var r_squareds = [];
    console.log(response)
    $.each(Object.keys(response), function(i, v) {
      var any = false;
      $.each(response[v], function(i, linkedSnp) {
        if (any) return;
        if (parseInt(v) != linkedSnp.dbSNP1) var linkedDbsnp = linkedSnp.dbSNP1; 
        else var linkedDbsnp = linkedSnp.dbSNP2;
        
        var userSnp = window.App.user.lookup(linkedDbsnp);
        if (userSnp != undefined) {
          requestDbsnps.push(parseInt(v));
          userDbsnps.push(linkedDbsnp);
          r_squareds.push(linkedSnp.R_square);
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
      '/lookup/impute/', {
        population: window.App.user.population,
        dbsnps: requestDbsnps.join(','), user_dbsnps: userDbsnps.join(','),
        r_squareds: r_squareds.join(',')
      }, function(response) {
        self.gotPhases(all_dbsnps, haveDbsnps, unimputableDbsnps, response);
      }
    );
  },
  
  gotPhases: function(all_dbsnps, haveDbsnps, unimputableDbsnps, response) {
    var self = this;
    console.log('Have:', haveDbsnps);
    console.log('Unimputable:', unimputableDbsnps);
    console.log('Response:', response);
    imputableSnps = {};
    $.each(response, function(requestSnp, info) {
      var userSnp = window.App.user.lookup(info.user_snp);
      imputableSnps[requestSnp] = {};
      imputableSnps[requestSnp]['genotype'] = info[userSnp.genotype[0]] + info[userSnp.genotype[1]];
      imputableSnps[requestSnp]['linked_snp'] = info.user_snp;
      imputableSnps[requestSnp]['r_squared'] = info.r_squared;
    });
    console.log('All imputable:', imputableSnps);
    $.each(all_dbsnps, function(i, v){
      print_snp = {};
      print_snp['dbsnp'] = v;
      print_snp['imputed_from'] = '';
      print_snp['r_squared'] = '';
      if ($.inArray(v, haveDbsnps) >= 0){
        print_snp['genotype'] = window.App.user.lookup(v).genotype;
      }
      else if ($.inArray(v, unimputableDbsnps) >= 0){
        print_snp['genotype'] = 'Cannot Impute';
      }else if (v in imputableSnps){
        print_snp['genotype'] = imputableSnps[v]['genotype'];
        print_snp['imputed_from'] = imputableSnps[v]['linked_snp'];
        print_snp['r_squared'] = imputableSnps[v]['r_squared'];
      }
      console.log('Going to print:', print_snp)
      self.el.find('#lookup-snps-table').append(_.template(self.lookupSnpTemplate, print_snp));
    });
    self.el.find('#lookup-snps-table').show();

  },
  });
});
