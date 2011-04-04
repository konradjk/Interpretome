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
    'click .explain-snp': 'click_explain',
    'click #lookup-demo': 'toggle_demo',
    'click #lookup-bed': 'toggle_bed',
    'click #submit-snps': 'click_submit',
    'click #print-snps': 'click_print',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #delete-snps': 'click_delete_snps'
  },

  initialize: function() {
    _.bindAll(this,  'click_lookup_file',
      'click_lookup_snps', 'click_clear_snps', 'click_help',
      'click_submit', 'click_confirm_submit', 'click_explain',
      'load_dbsnp_file', 'toggle_demo', 'toggle_bed',
      'print_snps', 'loaded', 'click_print'
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
	  this.explain_snp_top_template = $('#explain-lookup-top-template').html();
	  this.explain_snp_bottom_template = $('#explain-lookup-bottom-template').html();
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
  
  click_print: function(event) {
    console.log($('#lookup-snps-table')[0].outerHTML);
    print_text($('#lookup-snps-table')[0].outerHTML);
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
  
  click_explain: function(event) {
    output = {};
    output_2 = {};
    output['dbsnp'] = event.target.parentElement.parentElement.childNodes[1].innerHTML;
    var genotypes = event.target.parentElement.parentElement.childNodes[3].innerHTML.split('');
    output['genotype_0'] = genotypes[0];
    output_2['genotype_1'] = genotypes[1];
    var imputed = event.target.parentElement.parentElement.childNodes[17].innerHTML.split(' ');
    output['imp_dbsnp'] = imputed[0];
    output['imp_0'] = imputed[1].substr(1,1);
    output_2['imp_1'] = imputed[1].substr(2,1);
    //console.log(output);
    
    var self = this;
    self.el.find('#explain-lookup-top').empty();
    self.el.find('#explain-lookup-bottom').empty();
    this.el.find('.description > div').hide().show('normal');
    self.el.find('#explain-lookup-top').append(_.template(self.explain_snp_top_template, output));
    self.el.find('#explain-lookup-bottom').append(_.template(self.explain_snp_bottom_template, output_2));
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
        var print_snp = window.App.user.blank_extended_snp(v);
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
    this.el.find('#bed-file-text').empty();
    this.el.find('#bed-file-text').append('track name=myGenome description="Personal Genotype" visibility=3 itemRgb="On"\n');
    this.el.find('.submit > div').hide();
  },
  
  click_lookup_file: function(event) {
    var reader = new FileReader();
    reader.onloadend = this.load_dbsnp_file;
    reader.readAsText(this.el.find('#lookup-file').attr('files')[0]);
  },
  
  load_dbsnp_file: function(event) {
    var self = this;
    var input_dbsnps = [];
    var dbsnp_comments = {};
    $.each(event.target.result.split('\n'), function (i, v){
      var line = v.split(/\s/g);
      var rsid = line.shift();
      dbsnp_comments[filter_identifier(rsid)] = line.join(' ');
      input_dbsnps.push(rsid);
    });
    var dbsnps = filter_identifier(input_dbsnps);
    return window.App.user.lookup_snps(self.print_snps, {}, dbsnps, dbsnp_comments);
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    var self = this;
    var dbsnps = filter_identifier(
      this.el.find('#lookup-snps-textarea').val().split('\n')
    );
    return window.App.user.lookup_snps(self.print_snps, {}, dbsnps, {});
  },
  
  print_snps: function(args, all_dbsnps, snps_to_print){
    var self = this;
    $.each(all_dbsnps, function(i, v){
      var output_snp = snps_to_print[v];
      if (output_snp['imputed_from'] != ''){
        output_snp['explain'] = self.explain_string();
      }
      self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, output_snp));
      if (output_snp['genotype'] != 'NA'){
        self.el.find('#bed-file-text').append(_.template(self.bed_file_template, output_snp));
      }
    });
    //self.el.find('.explain-snp').button();
    self.el.find('#lookup-snps-table').show();
    self.el.find('.details').hide();
    self.el.find('.submit > div').show();
  },
  
  explain_string: function() {
    return "<button class='explain-snp' type='submit'>Explain</button>";
  },
  
  });
});
