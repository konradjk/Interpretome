$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),
  has_loaded: false,

  events: {
    'click #lookup-snps': 'click_lookup_snps',
    'click #lookup-by-file': 'click_lookup_file',
    'click #clear-snps': 'click_clear_snps',
    'click .help-button': 'click_help'
  },

  initialize: function() {
    _.bindAll(this,  'click_lookup_file',
      'click_lookup_snps', 'click_clear_snps', 'click_help', 
      'loaded', 'got_linked', 'got_phases'
    );
  },
  
  render: function() {
    $.get('/media/template/lookup.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#lookup');
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.lookup_snp_template = $('#lookup-snp-template').html();
	  this.el.find('.help > div').hide();
	  this.el.find('#lookup-accordion').accordion();
	  this.has_loaded = true;
  },
  
  filter_identifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
  },
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    console.log(id);
    this.el.find('.help > div').hide().parent().find(id).show('normal');
  },
  
  click_clear_snps: function(event) {
    this.el.find('#lookup-snps-table tr').slice(1).remove();
    this.el.find('#lookup-snps-table').hide();
  },
  
  click_lookup_file: function(event) {
    var reader = new FileReader();
    reader.onloadend = this.load_dbsnp_file;
    reader.readAsText(this.el.find('#lookup-file').attr('files')[0]);
  },
  
  load_dbsnp_file: function(event) {
    var input_dbsnps = [];
    var dbsnp_comments = {};
    $.each(event.target.result.split('\n'), function (i, v){
      var line = v.split(/\s/g);
      var rsid = line.shift();
      dbsnp_comments[rsid] = line.join(' ');
      input_dbsnps.push(rsid);
    });
    var dbsnps = filter_identifier(input_dbsnps);
    console.log(dbsnps);
    return [dbsnps, dbsnp_comments];
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = this.filter_identifiers(
      this.el.find('#lookup-snps-textarea').val().split('\n')
    );
    return this.lookup_snps(dbsnps);
  },
  
  lookup_snps: function(dbsnps) {
    var have_dbsnps = [];
    var lookup_dbsnps = [];
    $.each(dbsnps, function(i, v) {
      var dbsnp = window.App.user.lookup(v);
      console.log(dbsnp)
      if (dbsnp == undefined) 
        lookup_dbsnps.push(v);
      else 
        have_dbsnps.push(v);
    });
    console.log(lookup_dbsnps.length)
    
    if (lookup_dbsnps.length == 0) 
      return this.got_phases(dbsnps, have_dbsnps, [], {});
    
    var self = this;
    $.get(
      '/lookup/linked/', {
        population: window.App.user.population, 
        dbsnps: lookup_dbsnps.join(',')
      }, function(response) {
        return self.got_linked(dbsnps, have_dbsnps, response);
      }
    );
  },
  
  got_linked: function(all_dbsnps, have_dbsnps, response) {
    var unimputable_dbsnps = [];
    var user_dbsnps = [];
    var request_dbsnps = [];
    var r_squareds = [];
    console.log(response)
    $.each(Object.keys(response), function(i, v) {
      var any = false;
      $.each(response[v], function(i, linked_snp) {
        if (any) return;
        if (parseInt(v) != linked_snp.dbSNP1) var linked_dbsnp = linked_snp.dbSNP1; 
        else var linked_dbsnp = linked_snp.dbSNP2;
        
        var user_snp = window.App.user.lookup(linked_dbsnp);
        if (user_snp != undefined) {
          request_dbsnps.push(parseInt(v));
          user_dbsnps.push(linked_dbsnp);
          r_squareds.push(linked_snp.R_square);
          any = true;
          return;
        }
      });
      if (!any) {
        unimputable_dbsnps.push(parseInt(v));
      }
    });
    console.log('Requesting:', request_dbsnps);
    var self = this;
    $.get(
      '/lookup/impute/', {
        population: window.App.user.population,
        dbsnps: request_dbsnps.join(','), user_dbsnps: user_dbsnps.join(','),
        r_squareds: r_squareds.join(',')
      }, function(response) {
        self.got_phases(all_dbsnps, have_dbsnps, unimputable_dbsnps, response);
      }
    );
  },
  
  got_phases: function(all_dbsnps, have_dbsnps, unimputable_dbsnps, response) {
    var self = this;
    console.log('Have:', have_dbsnps);
    console.log('Unimputable:', unimputable_dbsnps);
    console.log('Response:', response);
    imputable_dbsnps = {};
    $.each(response, function(request_snp, info) {
      var user_snp = window.App.user.lookup(info.user_snp);
      imputable_dbsnps[request_snp] = {};
      imputable_dbsnps[request_snp]['genotype'] = info[user_snp.genotype[0]] + info[user_snp.genotype[1]];
      imputable_dbsnps[request_snp]['linked_snp'] = info.user_snp;
      imputable_dbsnps[request_snp]['r_squared'] = info.r_squared;
    });
    console.log('All imputable:', imputable_dbsnps);
    $.each(all_dbsnps, function(i, v){
      print_snp = {};
      print_snp['dbsnp'] = v;
      print_snp['imputed_from'] = '';
      print_snp['r_squared'] = '';
      console.log(v)
      console.log(imputable_dbsnps[v])
      // Careful with in... it's not always going to do what you think. Use _.include to test
      // whether a collection includes an element.
      if (_.include(have_dbsnps, v)) {
        print_snp['genotype'] = window.App.user.lookup(v).genotype;
      } 
      else if (_.include(unimputable_dbsnps, v)) {
        print_snp['genotype'] = 'Cannot Impute';
      } 
      else if (v in imputable_dbsnps) {
        print_snp['genotype'] = imputable_dbsnps[v]['genotype'];
        print_snp['imputed_from'] = imputable_dbsnps[v]['linked_snp'];
        print_snp['r_squared'] = imputable_dbsnps[v]['r_squared'];
      } else {
        return; //Because this doesn't make any sense
      }
      console.log('Going to print:', print_snp)
      self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, print_snp));
    });
    self.el.find('#lookup-snps-table').show();

  },
  });
});
