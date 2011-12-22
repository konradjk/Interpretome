$(function() {
window.PharmacogenomicsView = Backbone.View.extend({
  has_loaded: false,
  el: $('#pharmacogenomics'),

  events: { 'click #get-common-pgx': 'click_common_pgx',
  'click #get-rare-pgx': 'click_rare_pgx' },

  initialize: function() {
    _.bindAll(this, 'click_common_pgx', 'got_common_pgx',
      'click_rare_pgx', 'got_rare_pgx', 'display_rare_pgx',
      'got_rare_variants', 'clear_tables', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/pharmacogenomics.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  match_style(this.el);
    $('#common_rare').accordion();
    $('#common-pgx-table').hide();
	  this.common_pgx_template = $('#common-pgx-template').html();
	  this.rare_pgx_template = $('#rare-pgx-template').html();
    
    $('#frequency-cutoff-slider').slider({
      min: 0.5, max: 10, step: 0.5, value: 5, range: 'min',
      slide: function(event, ui) { document.getElementById('frequency-cutoff-threshold').innerText = ui.value; }
    });
    document.getElementById('frequency-cutoff-threshold').innerText = $("#frequency-cutoff-slider").slider("value");
    
    $("#common-pgx-table").tablesorter();
    $("#rare-pgx-table").tablesorter();
    this.has_loaded = true;
  },
  
  clear_tables: function() {
    clear_table('common-pgx-table');
    clear_table('rare-pgx-table');
  },
  
  click_rare_pgx: function(response) {
    this.clear_tables();
    if (window.App.check_all() == false) return;
    $('#looking-up').dialog('open');
    cutoff = parseFloat($("#frequency-cutoff-slider").slider("value"))/100.0;
    $.get('/get_rare_variants/', {population: get_user().population, cutoff: cutoff}, this.got_rare_variants);
  },
  
  got_rare_variants: function(response) {
    var self = this;
    rare_variants = {};
    user = get_user();
    $.each(response, function(i, v) {
      var dbsnp = user.lookup(v['rsid']);
      if (dbsnp != undefined && count_genotype(dbsnp.genotype, v['otherallele']) > 0) {
        rare_variants[v['rsid']] = _.extend(v, dbsnp);
      }
    });
    $.post('/get_drug_targets/', {}, function(response) { self.got_rare_pgx(response, rare_variants) });
  },
  
  got_rare_pgx: function(response, rare_variants) {
    var self = this;
    rare_variants_targets = {};
    $.each(response, function(i, v) {
      if (rare_variants[v['dbSNP']] != undefined) {
        rare_variants_targets[v['dbSNP']] = _.extend(v, rare_variants[v['dbSNP']]);
      }
    });
    $.post('/get_polyphen_scores/', {}, function(response) { self.display_rare_pgx(response, rare_variants_targets) });
  },
  
  display_rare_pgx: function(response, rare_variants_targets) {
    var self = this;
    $('#looking-up').dialog('close');
    $.each(response, function(i, v) {
      if (rare_variants_targets[v['dbSNP']] != undefined){
        output = _.extend(v, rare_variants_targets[v['dbSNP']]);
        output['dbsnp'] = v['dbSNP'];
        $('#rare-pgx-table > tbody').append(_.template(self.rare_pgx_template, output));
      }
    });
    $('#rare-pgx-table').show();
    $("#rare-pgx-table").trigger("update");
  },
  
  got_common_pgx: function(response) {
    var self = this;
    user = get_user();
    $.each(response, function(i, v) {
      var dbsnp = user.lookup(v['dbsnp']);
      if (dbsnp != undefined && v['genotype'] == dbsnp.genotype) {
        v['genotype'] = dbsnp.genotype;
        $('#common-pgx-table > tbody').append(_.template(self.common_pgx_template, v));
      }
    });
    self.el.find('#common-pgx-table').show();
    $("#common-pgx-table").trigger("update");
  },
  
  click_common_pgx: function(event) {
    this.clear_tables();
    if (window.App.check_genome() == false) return;
    
    $.get('get_pharmacogenomics_snps', {}, this.got_common_pgx);
  }
  });
});
