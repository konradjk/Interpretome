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
    'click #delete-snps': 'click_delete_snps',
    'click #lookup-exercise': 'lookup_exercise',
    'click #submit-exercise': 'click_submit_exercise'
    
  },

  initialize: function() {
    _.bindAll(this,  
      'click_lookup_file', 'click_lookup_snps', 'click_clear_snps', 
      'click_help', 'click_submit', 'click_confirm_submit', 'click_explain', 
      'click_print',
      
      'load_dbsnp_file', 
      'loaded',
      'print_snps', 
      
      'toggle_demo', 'toggle_bed',
      
      'lookup_exercise', 'got_exercise', 'display_exercise_snps', 
      'click_submit_exercise'
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
	  this.el.find('.help-button').button({icons: {primary: 'ui-icon-help'}});
	  this.el.find('.help > div').show();
	  this.el.find('.description > div').hide();
	  this.el.find('.submit > div').hide();
	  this.el.find('.details').hide();
	  this.el.find('#lookup-accordion').accordion();
	  this.el.find('#exercises').buttonset();
	  
	  // Initialize general templates.
	  this.lookup_snp_template = $('#lookup-snp-template').html();
	  this.explain_snp_top_template = 
	    $('#explain-lookup-top-template').html();
	  this.explain_snp_bottom_template = 
	    $('#explain-lookup-bottom-template').html();
	  this.bed_file_template = $('#bed-file-template').html();
	  
	  // Initialize exercise templates.
	  this.cad_snp_template = $('#cad-snp-template').html();
	  this.ancestry_snp_template = $('#ancestry-snp-template').html();
	  this.longevity_snp_template = $('#longevity-snp-template').html();
	  this.diabetes_snp_template = $('#diabetes-snp-template').html();
	  this.pgx_snp_template = $('#pgx-snp-template').html();
	  
	  this.has_loaded = true;
  },
  
  toggle_demo: function(event) {
    this.el.find('#lookup-demo').next().toggle('normal');
  },
  
  toggle_bed: function(event) {
    this.el.find('#lookup-bed').next().toggle('normal');
  },
  
  click_print: function(event) {
    print_text($('#lookup-snps-table')[0].outerHTML);
  },
  
  
  // Submission-related logic.
  
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
        if (response != null){
          return self.thanks_for_submitting();
        } else{
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
  
  click_help: function(event) {
    var id = '#' + event.currentTarget.id + '-help';
    this.el.find('.help > div').toggle('normal');
    this.el.find('.details').toggle('normal');
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
    //Why not just all of them? -K
    var table = this.el.find('.results-table');
    $(table).find('tr').slice(1).remove();
    $(table).hide();
    if ($('#lookup-snps-table').css('display') == 'none') {
      var table = this.el.find('.results-table');
      $(table).find('tr').slice(1).remove();
      $(table).hide();
    } else {
	    this.el.find('#lookup-snps-table tr').slice(1).remove();
	    this.el.find('#lookup-snps-table').hide();
	    this.el.find('#bed-file-text').empty();
	    this.el.find('#bed-file-text').append('track name=myGenome description="Personal Genotype" visibility=3 itemRgb="On"\n');
	    this.el.find('.submit > div').hide();
    }
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
    return window.App.user.lookup_snps(self.print_snps, {}, dbsnps, dbsnp_comments);
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    var self = this;
    var dbsnps = filter_identifiers(
      this.el.find('#lookup-snps-textarea').val().split('\n')
    );
    return window.App.user.lookup_snps(self.print_snps, {}, dbsnps, {});
  },
  
  print_snps: function(args, all_dbsnps, snps_to_print) {
    var self = this;
    $.each(all_dbsnps, function(i, v) {
      var output_snp = snps_to_print[v];
      if (output_snp['imputed_from'] != ''){
        output_snp['explain'] = self.explain_string();
      }
      self.el.find('#lookup-snps-table').append(_.template(self.lookup_snp_template, output_snp));
      if (output_snp['genotype'] != 'NA'){
        self.el.find('#bed-file-text').append(_.template(self.bed_file_template, output_snp));
      }
    });
    self.el.find('#lookup-snps-table').show();
    self.el.find('.details').hide();
    self.el.find('.submit > div').show();
  },
  
  explain_string: function() {
    return "<button class='explain-snp' type='submit'>Explain</button>";
  },
  
  lookup_exercise: function() {
    if (window.App.check_all() == false) return;
    this.el.find('.help > div').hide('normal');
    this.el.find('.details').hide('normal');
    
    var exercise = $('#exercises label[aria-pressed="true"]').attr('for');
    window.App.exercise = exercise;
    
    var start_exercise = this['start_' + window.App.exercise];
    if (start_exercise != undefined) {
	    if (start_exercise() == false) return;
	  }
    
    $.get('/lookup/exercise/', {'exercise': exercise}, this.got_exercise)
  },
  
  got_exercise: function(response) {
    window.App.user.lookup_snps(
      this.display_exercise_snps, response, _.keys(response), response
    );
  },
  
  display_exercise_snps: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var table_id = '#' + window.App.exercise + '-table';
    var template = this[window.App.exercise + '_snp_template'];
    _.each(extended_dbsnps, function(v) {
      self.el.find(table_id).append(_.template(template, v))
    });
    this.el.find(table_id).show();
    this.el.find('#submit-exercise-area').show();
    
    var finish_exercise = this['finish_' + window.App.exercise];
    if (finish_exercise == undefined) return;
    finish_exercise(all_dbsnps, extended_dbsnps);
  },
  
  click_submit_exercise: function() {
    var self = this;
    $('#confirm-submit-snps').dialog({
      modal: true, resizable: false, buttons: {
        'Okay': function() {
          var ks = _.map(
            $('.results-table :visible td.key'), 
            function(v) {return $(v).text();}
          );
          var vs = _.map(
            $('.results-table :visible td.value'), 
            function(v) {return $(v).text();}
          );
          
          var submission = {'exercise': 'class_' + window.App.exercise};
          
          submission = $.extend(submission, window.App.user.serialize());
          $.each(ks, function(i, v) {
            submission[v] = vs[i];
          });
          
          $.get('/submit/', submission, self.thanks_for_submitting);
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  }
  
  });
});
