$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),
  has_loaded: false,
  hidden: false,

  events: {
    'click #lookup-snps': 'click_lookup_snps',
    'click #lookup-by-file': 'click_lookup_file',
    'click #clear-snps': 'click_clear_snps',
    'click .help-button': 'click_help',
    'click #lookup-demo': 'toggle_demo',
    'click #lookup-bed': 'toggle_bed',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #delete-snps': 'click_delete_snps'
  },

  initialize: function() {
    _.bindAll(this,  'click_lookup_file',
      'click_lookup_snps', 'click_clear_snps', 'click_help',
      'click_submit', 'click_confirm_submit',
      'load_dbsnp_file', 'toggle_demo', 'toggle_bed',
      'get_reference_alleles', 'get_allele_frequencies',
      'print_snps',
      'loaded', 'got_linked', 'got_phases', 'blank_print_snp'
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
	  this.bed_file_template = $('#bed-file-template').html();
	  this.el.find('.help > div').show();
	  this.el.find('.description > div').hide();
	  this.el.find('.submit > div').hide();
	  this.el.find('.details').hide();
	  this.el.find('#lookup-accordion').accordion();
	  this.has_loaded = true;
  },
  
  toggle_demo: function(event) {
    this.el.find('#lookup-demo').next().toggle('normal');
  },
  
  toggle_bed: function(event) {
    this.el.find('#lookup-bed').next().toggle('normal');
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
    var output_dbsnps = [];
    var output_genotypes = [];
    var self = this;
    this.el.find('#lookup-snps-table tr').each( function() {
      dbsnp = $(this).find('.dbsnp').html();
      genotype = $(this).find('.genotype').html();
      if (dbsnp != null && genotype != 'Cannot Impute'){
        output_dbsnps.push(dbsnp);
        output_genotypes.push(genotype);
      }
    })
    $.get(
      '/submit/submit_snps/', {
        dbsnps: output_dbsnps.join(','),
        genotypes: output_genotypes.join(',')
      }, function(response) {
        //console.log(response);
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
    this.el.find('.help > div').toggle('normal');
    this.el.find('.details').toggle('normal');
  },
  
  click_delete_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = this.filter_identifiers(
      this.el.find('#delete-snps-textarea').val().split('\n')
    );
    self = this;
    $.each(dbsnps, function(i, v) {
      if (window.App.user.lookup(v) != undefined){
        var print_snp = self.blank_print_snp(v);
        print_snp['imputed_from'] = 'DELETED';
        print_snp['genotype'] = 'Was: ' + window.App.user.lookup(v).genotype;
        self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, print_snp));
        window.App.user.delete_snp(v);
      }
    });
    self.el.find('#lookup-snps-table').show();
    self.el.find('.submit > div').show();
  },
  
  click_clear_snps: function(event) {
    this.el.find('#lookup-snps-table tr').slice(1).remove();
    this.el.find('#lookup-snps-table').hide();
    this.el.find('.submit > div').hide();
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
      dbsnp_comments[filter_identifier(rsid)] = line.join(' ');
      input_dbsnps.push(rsid);
    });
    var dbsnps = filter_identifier(input_dbsnps);
    //console.log(dbsnps);
    return this.lookup_snps(dbsnps, dbsnp_comments);
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = this.filter_identifiers(
      this.el.find('#lookup-snps-textarea').val().split('\n')
    );
    return this.lookup_snps(dbsnps);
  },
  
  lookup_snps: function(dbsnps, comments) {
    var have_dbsnps = [];
    var lookup_dbsnps = [];
    $.each(dbsnps, function(i, v) {
      var dbsnp = window.App.user.lookup(v);
      //console.log(dbsnp);
      if (dbsnp == undefined) 
        lookup_dbsnps.push(v);
      else 
        have_dbsnps.push(v);
    });
    //console.log(lookup_dbsnps.length)
    
    if (lookup_dbsnps.length == 0) return this.got_phases(dbsnps, have_dbsnps, [], comments, {});
    
    var self = this;
    $.get(
      '/lookup/linked/', {
        population: window.App.user.population, 
        dbsnps: lookup_dbsnps.join(',')
      }, function(response) {
        return self.got_linked(dbsnps, have_dbsnps, comments, response);
      }
    );
  },
  
  got_linked: function(all_dbsnps, have_dbsnps, comments, response) {
    var unimputable_dbsnps = [];
    var user_dbsnps = [];
    var request_dbsnps = [];
    var r_squareds = [];
    
    $.each(response, function(v, i) {
      var any = false;
      $.each(i, function(k, linked_snp) {
        if (any) return;
        if (parseInt(v) != linked_snp.dbSNP1) var linked_dbsnp = linked_snp.dbSNP1; 
        else var linked_dbsnp = linked_snp.dbSNP2;
        
        if (window.App.user.lookup(linked_dbsnp) != undefined) {
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
    
    if (request_dbsnps.length == 0) return this.got_phases(all_dbsnps, have_dbsnps, unimputable_dbsnps, comments, {})
    var self = this;
    $.get(
      '/lookup/impute/', {
        population: window.App.user.population,
        dbsnps: request_dbsnps.join(','), user_dbsnps: user_dbsnps.join(','),
        r_squareds: r_squareds.join(',')
      }, function(response) {
        self.got_phases(all_dbsnps, have_dbsnps, unimputable_dbsnps, comments, response);
      }
    );
  },
  
  got_phases: function(all_dbsnps, have_dbsnps, unimputable_dbsnps, comments, response) {
    var self = this;
    
    imputable_dbsnps = {};
    $.each(response, function(request_snp, info) {
      var user_snp = window.App.user.lookup(info.user_snp);
      imputable_dbsnps[request_snp] = {};
      imputable_dbsnps[request_snp]['genotype'] = info[user_snp.genotype[0]] + info[user_snp.genotype[1]];
      imputable_dbsnps[request_snp]['linked_snp'] = info.user_snp;
      imputable_dbsnps[request_snp]['r_squared'] = info.r_squared;
    });
    
    var snps_to_print = {};
    $.each(all_dbsnps, function(i, v){
      var print_snp = self.blank_print_snp(v);
      
      if (_.include(have_dbsnps, v)) {
        print_snp['genotype'] = window.App.user.lookup(v).genotype;
      } 
      else if (_.include(unimputable_dbsnps, v)) {
        print_snp['genotype'] = 'Cannot Impute';
      } 
      else if (v in imputable_dbsnps) {
        print_snp['genotype'] = imputable_dbsnps[v]['genotype'];
        print_snp['imputed_from'] = imputable_dbsnps[v]['linked_snp'] + ' ' + self.format_explain_string(window.App.user.lookup(imputable_dbsnps[v]['linked_snp']).genotype, imputable_dbsnps[v]['linked_snp'], imputable_dbsnps[v]['r_squared']);
        print_snp['r_squared'] = imputable_dbsnps[v]['r_squared'];
      } else {
        return; //Because this doesn't make any sense
      }
      if (comments != undefined && v in comments){
        print_snp['comments'] = comments[v];
      }
      snps_to_print[v] = print_snp;
    });
    return self.get_reference_alleles(all_dbsnps, snps_to_print);
  },
  
  print_snps: function(all_dbsnps, snps_to_print){
    var self = this;
    $.each(all_dbsnps, function(i, v){
      console.log(v);
      var output_snp = snps_to_print[v];
      console.log(output_snp);
      self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, output_snp));
      self.el.find('#bed-file-text').append(_.template(self.bed_file_template, output_snp));
    });
    self.el.find('#lookup-snps-table').show();
    self.el.find('.details').hide();
    self.el.find('.submit > div').show();
  },
  
  get_chrom_pos: function(all_dbsnps, snps_to_print){
    var self = this;
    $.get(
      '/lookup/get_chrom_pos/', {
        snps: all_dbsnps.join(',')
      }, function(response){
        $.each(response, function(i, v){
          snps_to_print[i]['chrom'] = v['chrom'];
          snps_to_print[i]['start'] = v['chromstart'];
          snps_to_print[i]['end'] = v['chromend'];
        });
        return self.print_snps(all_dbsnps, snps_to_print);
      }
    );
  },
  
  get_allele_frequencies: function(all_dbsnps, snps_to_print) {
    var self = this;
    $.get(
      '/lookup/get_allele_frequencies/', {
        snps: all_dbsnps.join(','),
        population: window.App.user.population
      }, function(response){
        $.each(response, function(i, v){
          snps_to_print[i]['refallele_freq'] = v['refallele_freq'];
          snps_to_print[i]['otherallele'] = v['otherallele'];
          snps_to_print[i]['otherallele_freq'] = v['otherallele_freq'];
        });
        return self.get_chrom_pos(all_dbsnps, snps_to_print);
      }
    );
  },
  
  get_reference_alleles: function(all_dbsnps, snps_to_print) {
    var self = this;
    console.log(all_dbsnps)
    $.get(
      '/lookup/get_reference_alleles/', {
        snps: all_dbsnps.join(',')
      }, function(response) {
        $.each(response, function(i, v){
          snps_to_print[i]['reference'] = v;
          var zygosity = count_genotype(snps_to_print[i]['genotype'], v);
          if (zygosity == 2){
            snps_to_print[i]['color'] = '1,1,1';
          }else if (zygosity == 1){
            snps_to_print[i]['color'] = '0,0,255';
          }else{
            snps_to_print[i]['color'] = '255,0,0';
          }
        });
        return self.get_allele_frequencies(all_dbsnps, snps_to_print);
      }
    );
  },
  
  format_explain_string: function(genotype, linked_snp, r_squared) {
    return '(' + genotype + ')' + '';
  },
  
  blank_print_snp: function(v) {
    print_snp = {};
    print_snp['dbsnp'] = v;
    print_snp['imputed_from'] = '';
    print_snp['r_squared'] = '';
    print_snp['comments'] = '';
    print_snp['reference'] = '';
    print_snp['explain'] = '';
    print_snp['refallele_freq'] = '';
    print_snp['otherallele'] = '';
    print_snp['otherallele_freq'] = '';
    print_snp['chrom'] = '';
    print_snp['start'] = '';
    print_snp['end'] = '';
    print_snp['color'] = '';
    return print_snp;
  }
  });
});
