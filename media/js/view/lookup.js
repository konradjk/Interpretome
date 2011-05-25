$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),
  has_loaded: false,
  hidden: false,

  events: {
    'click #lookup-snps': 'click_lookup_snps',
    'click #lookup-by-file': 'click_lookup_file',
    'click #clear-snps': 'click_clear_snps',
    'click .explain-snp': 'click_explain',
    'click #lookup-demo': 'toggle_demo',
    'click #lookup-bed': 'toggle_bed',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #delete-snps': 'click_delete_snps',
    'click #toggle-unknown-genotypes': 'toggle_unknown_genotypes'
    
  },

  initialize: function() {
    _.bindAll(this,  
      'click_lookup_file', 'click_lookup_snps', 'click_clear_snps', 
      'click_submit', 'click_confirm_submit', 'click_explain', 
      
      'load_dbsnp_file', 
      'loaded',
      
      'toggle_demo', 'toggle_bed',
      
      'toggle_unknown_genotypes',
      'print_snps'
    );
  },
  
  render: function() {
    $.get('/media/template/lookup.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#lookup');
	  this.el.append(response);
    
	  // Widget initialization.
	  this.el.find('button').button();
	  this.el.find('#exercises label').css('width', '50%');
	  this.el.find('#table-options').hide();
	  
	  this.el.find('.submit > div').hide();
	  this.el.find('.details').hide();
	  this.el.find('.description').hide();
	  
	  // Initialize general templates.
	  this.lookup_snp_template = $('#lookup-snp-template').html();
	  this.explain_snp_top_template = 
	    $('#explain-lookup-top-template').html();
	  this.explain_snp_bottom_template = 
	    $('#explain-lookup-bottom-template').html();
	  this.bed_file_template = $('#bed-file-template').html();
	  
    
    $('#too-many-snps').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Okay!': function() {$(this).dialog('close');}
      }
    });
	  
	  this.has_loaded = true;
  },
  
  toggle_demo: function(event) {
    this.el.find('#lookup-demo').next().toggle('normal');
  },
  
  toggle_bed: function(event) {
    this.el.find('#lookup-bed').next().toggle('normal');
  },
  
  // Submission-related logic.
  
  click_submit: function(event) {
    var self = this;
    $('#confirm-submit-exercise').dialog({
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
	  var ks = _.map(
	    $('#lookup-snps-table td.key'), 
	    function(v) {return $(v).text();}
	  );
	  var vs = _.map(
	    $('#lookup-snps-table td.value'), 
	    function(v) {return $(v).text();}
	  );
	  submission = window.App.user.serialize();
	  $.each(ks, function(i, v) {
	    submission[v] = vs[i];
	  });
          
    $.get('/submit/submit_snps/', submission, check_submission);
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
    
    var self = this;
    this.el.find('#explain-lookup-top').empty();
    this.el.find('#explain-lookup-bottom').empty();
    this.el.find('.description > div').hide().show('normal');
    this.el.find('#explain-lookup-top').append(_.template(self.explain_snp_top_template, output));
    this.el.find('#explain-lookup-bottom').append(_.template(self.explain_snp_bottom_template, output_2));
  },
  
  click_delete_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = filter_identifiers(
      this.el.find('#delete-snps-textarea').val().split('\n')
    );
    var self = this;
    $.each(dbsnps, function(i, v) {
      if (window.App.user.lookup(v) != undefined){
        var print_snp = window.App.user.blank_extended_snp(v);
        print_snp['imputed_from'] = 'DELETED';
        print_snp['genotype'] = 'Was: ' + window.App.user.lookup(v).genotype;
        self.el.find('#lookup-snps-table').append(
          _.template(self.lookup_snp_template, print_snp)
        );
        window.App.user.delete_snp(v);
      }
    });
    this.el.find('#lookup-snps-table').show();
    this.el.find('.submit > div').show();
  },
  
  // Clear general lookup table or exercise-specific one.
  click_clear_snps: function(event) {
    $('#table-options').hide();
    this.el.find('#lookup-snps-table tr').slice(1).remove();
    this.el.find('#lookup-snps-table').hide();
    this.el.find('#bed-file-text').empty();
    this.el.find('#bed-file-text').append('track name=myGenome description="Personal Genotype" visibility=3 itemRgb="On"\n');
    this.el.find('.submit > div').hide();
  },
  
  // Reads a file of SNPs.
  click_lookup_file: function(event) {
    var reader = new FileReader();
    reader.onloadend = this.load_dbsnp_file;
    reader.readAsText(this.el.find('#lookup-file').attr('files')[0]);
  },
  
  // Callback when loading of file is completed.
  load_dbsnp_file: function(event) {
    var self = this;
    var input_dbsnps = [];
    var dbsnp_comments = {};
    $.each(event.target.result.split('\n'), function (i, v){
      var line = v.split(/\s/g);
      var rsid = line.shift();
      dbsnp_comments[filter_identifiers(rsid)] = line.join(' ');
      input_dbsnps.push(rsid);
    });
    
    var dbsnps = filter_identifiers(input_dbsnps);
    if (dbsnps.length <= 1000)
      setTimeout(window.App.user.lookup_snps(self.print_snps, {}, dbsnps, dbsnp_comments), 0);
    else
      $('#too-many-snps').dialog('open');
    
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    $('#table-options').show();
    var self = this;
    var dbsnps = filter_identifiers(
      this.el.find('#lookup-snps-textarea').val().split('\n')
    );
    setTimeout(window.App.user.lookup_snps(self.print_snps, {}, dbsnps, {}), 0);
  },
  
  print_snps: function(args, all_dbsnps, snps_to_print) {
    var self = this;
    $.each(all_dbsnps, function(i, v) {
      var output_snp = snps_to_print[v];
      if (output_snp['imputed_from'] != ''){
        output_snp['explain'] = self.explain_string();
      }
      self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, output_snp));
      self.el.find('#bed-file-text').append(_.template(self.bed_file_template, output_snp));
    });
    $('#imputing-lots').dialog('close');
    self.el.find('#lookup-snps-table').show();
    self.el.find('.details').hide();
    self.el.find('.submit > div').show();
  },
  
  explain_string: function() {
    return "<button class='explain-snp' type='submit'>Explain</button>";
  },
  
  toggle_unknown_genotypes: function() {
    this.el.find('.results-table:visible td:nth-child(2):contains("??")').parent().toggle();
    if (this.el.find('.results-table:visible tr:hidden').length != 0)
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Show unknown genotypes');
    else 
      this.el.find('#toggle-unknown-genotypes').button('option', 'label', 'Hide unknown genotypes');
  }
  
  });
});
