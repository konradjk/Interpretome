$(function() {
window.WarfarinView = Backbone.View.extend({
  el: $('#warfarin'),
  has_loaded: false,
  hidden: false,
  final_clinical_dose: 0,
  final_genetic_dose: 0,
  extended_dose: 0,

  events: {
    'click #warfarin-dose': 'clickWarfarinDose',
    'click #submit-doses': 'click_submit',
    'click #confirm-submit-doses': 'click_confirm_submit'
  },

  initialize: function() {
    _.bindAll(this, 'clickWarfarinDose',
      'click_submit', 'click_confirm_submit', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/warfarin.html', this.loaded);
  },
    
  loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
    this.warfarinDoseTemplate = $('#warfarin-dose-template').html();
    this.warfarinGraphTemplate = $('#warfarin-graph-template').html();
	  this.el.find('.submit > div').hide();
    this.el.find('#race').buttonset();
    this.el.find('#enzyme').buttonset();
    this.el.find('#amiodarone').buttonset();
    this.el.find('#weight_units').buttonset();
    this.el.find('#height_units').buttonset();
	  match_style(this.el);
    this.has_loaded = true;
  },
  
  filterIdentifiers: function(ids) {
    return _.select(
      _.map(ids, function(v) {return parseInt(v);}), 
      function(v) {return !_.isNaN(v)}
    );
  },
  
  click_submit: function(event) {
    var self = this;
    $('#confirm-submit-doses').dialog({
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
    var output_doses = [this.final_clinical_dose, this.final_genetic_dose, this.extended_dose];
    var self = this;
    $.get( '/submit/submit_doses/', { doses: output_doses.join(',') }, check_submission);
  },
  
  calculateAndPrintFactor: function(feature, results, clincial_multiplier, genetic_multiplier, value) {
    results['clinical_total'] += clincial_multiplier*value;
    results['genetic_total'] += genetic_multiplier*value;
    this.printFactor(feature, clincial_multiplier, results['clinical_total'], genetic_multiplier, results['genetic_total'], value)
    return results;
  },
  
  printFactor: function(feature, clincial_multiplier, clinical_total, genetic_multiplier, genetic_total, value){
    var output = {};
    if (check_float(clinical_total) != null){
      output['clinical_total'] = clinical_total.toFixed(4);
    }else{
      output['clinical_total'] = clinical_total
    }
    if (check_float(genetic_total) != null){
      output['genetic_total'] = genetic_total.toFixed(4);
    }else{
      output['genetic_total'] = genetic_total
    }
    if (!_.isNaN(parseFloat(value)) && parseFloat(value).toFixed(2) != parseFloat(value)){
      value = parseFloat(value).toFixed(2);
    }
    if (clincial_multiplier != 0){
      output['clinical_multiplier'] = clincial_multiplier;
      output['clinical_value'] = value;
    }else{
      output['clinical_multiplier'] = '';
      output['clinical_value'] = '';
    }
    output['genetic_multiplier'] = genetic_multiplier;
    output['genetic_value'] = value;
    output['feature'] = feature;
    this.el.find('#warfarin-table').append(_.template(this.warfarinDoseTemplate, output));
  },
  
  showGraph: function(clinical_total, genetic_total, extended_total) {
    var output = {}
    output['clinical'] = clinical_total.toFixed(2) + ' mg/week';
    output['genetic'] = genetic_total.toFixed(2) + ' mg/week';
    output['extended'] = extended_total.toFixed(2) + ' mg/week';
    this.el.find('#warfarin-graph-table').append(_.template(this.warfarinGraphTemplate, output));
    
    output['clinical'] = this.generateGraph(clinical_total);
    output['genetic'] = this.generateGraph(genetic_total);
    output['extended'] = this.generateGraph(extended_total);
    this.el.find('#warfarin-graph-table').append(_.template(this.warfarinGraphTemplate, output));
    this.el.find('#warfarin-graph-table').show('normal');
  },
  
  generateGraph: function(dose){
    var url = 'http://chart.apis.google.com/chart?';
    var options = {}
    options['chxl'] = '0:|Low|High';
    options['chxp'] = '0,21,49';
    options['chxr'] = '0,15,60';
    options['chxs'] = '0,676767,14.5,0,l,676767';
    options['chxt'] = 'y';
    options['chs'] = '300x130';
    options['cht'] = 'gm';
    options['chco'] = '000000,00FF00|FFFF00|FF0000';
    options['chd'] = 't:' + dose;
    options['chts'] = '676767,16';
    $.each(options, function(k, v){
      url += k + '=' + v + '&';
    });
    return '<img src="' + url + '">';
  },
  
  clickWarfarinDose: function(event) {
    this.el.find('#warfarin-table tr').slice(1).remove();
    this.el.find('#warfarin-table').hide();
    
    this.el.find('#warfarin-graph-table tr').slice(1).remove();
    this.el.find('#warfarin-graph-table').hide();
    
    var raw_age = this.el.find('#age-textarea').val();
    var raw_height = this.el.find('#height-textarea').val();
    var raw_weight = this.el.find('#weight-textarea').val();
    var raw_race = $('#race label[aria-pressed="true"]').attr('for');
    var raw_enzyme = $('#enzyme label[aria-pressed="true"]').attr('for');
    var raw_amiodarone = $('#amiodarone label[aria-pressed="true"]').attr('for');
    
    window.App.user.age = check_float(raw_age);
      
    if ($('#height_units label[aria-pressed="true"]').attr('for') == 'in'){
      window.App.user.height = check_inches(raw_height);
    } else {
      window.App.user.height = check_float(raw_height);
    }
    
    window.App.user.weight = check_float(raw_weight);
    
    if (raw_race != undefined){
      window.App.user.race = raw_race;
    }
    if (raw_enzyme != undefined){
      window.App.user.enzyme = raw_enzyme;
    }
    if (raw_amiodarone != undefined){
      window.App.user.amiodarone = raw_amiodarone;
    }
    
    if (this.checkWarfarin() == false) return;
    
    var decades = Math.floor(window.App.user.age/10);
    
    if ($('#weight_units label[aria-pressed="true"]').attr('for') == 'lbs'){
      window.App.user.weight = window.App.user.weight/2.2;
    }
    var asian = 0;
    var black = 0;
    var other = 0;
    if (window.App.user.race == 'race_asian'){
      asian = 1;
    }else if (window.App.user.race == 'race_black'){
      black = 1;
    }else if (window.App.user.race == 'race_other'){
      other = 1;
    }
    
    var enzyme = 0;
    var amiodarone = 0;
    if (window.App.user.enzyme == 'yes'){
      enzyme = 1;
    }
    if (window.App.user.amiodarone == 'yes'){
      amiodarone = 1;
    }
    var results = {};
    
    var vkorc1 = window.App.user.lookup('9923231');
    var cyp2c9_2 = window.App.user.lookup('1799853');
    var cyp2c9_3 = window.App.user.lookup('1057910');
    var cyp4f2 = window.App.user.lookup('2108622');
    
    results['clinical_total'] = 4.0376;
    results['genetic_total'] = 5.6044;
    
    this.el.find('#warfarin-table').show();
    results = this.calculateAndPrintFactor('Age (in decades)', results, -0.2546, -0.2614, decades);
    results = this.calculateAndPrintFactor('Height (in cm)', results, 0.0118, 0.0087, window.App.user.height);
    results = this.calculateAndPrintFactor('Weight (in kg)', results, 0.0134, 0.0128, window.App.user.weight);
    results = this.calculateAndPrintFactor('Asian', results, -0.6752, -0.1092, asian);
    results = this.calculateAndPrintFactor('Black', results, 0.406, -0.276, black);
    results = this.calculateAndPrintFactor('Other/Mixed', results, 0.0443, -0.1032, other);
    results = this.calculateAndPrintFactor('Enzyme Inducer', results, 1.2799, 1.1816, enzyme);
    results = this.calculateAndPrintFactor('Amiodarone', results, -0.5695, -0.5503, amiodarone);
    
    var vkorc1_tt = 0;
    var vkorc1_ct = 0;
    var vkorc1_unknown = 0;
    if (vkorc1 == undefined){
      vkorc1_unknown = 1;
    }else{
      vkorc1_genotype = vkorc1.genotype;
      if (vkorc1_genotype == 'TT'){
        vkorc1_tt = 1;
      }if (vkorc1_genotype == 'CT' || vkorc1_genotype == 'TC'){
        vkorc1_ct = 1;
      }
    }
    results = this.calculateAndPrintFactor('VKORC (rs9923231 TT)', results, 0, -1.6974, vkorc1_tt);
    results = this.calculateAndPrintFactor('VKORC (rs9923231 CT)', results, 0, -0.8677, vkorc1_ct);
    results = this.calculateAndPrintFactor('VKORC (rs9923231 Unknown)', results, 0, -0.4854, vkorc1_unknown);
    
    var cyp12 = 0;
    var cyp13 = 0;
    var cyp22 = 0;
    var cyp23 = 0;
    var cyp33 = 0;
    var cyp2c9_unknown = 0;
    if (cyp2c9_2 == undefined || cyp2c9_3 == undefined){
        cyp2c9_unknown = 1;
    }else{
      cyp2c9_genotype_2 = cyp2c9_2.genotype;
      cyp2c9_genotype_3 = cyp2c9_3.genotype;
      if (count_genotype(cyp2c9_genotype_2, 'T') == 0){
          if (count_genotype(cyp2c9_genotype_3, 'C') == 1){
              cyp13 = 1;
          }if (count_genotype(cyp2c9_genotype_3, 'C') == 2){
              cyp33 = 1;
          }
      }else if (count_genotype(cyp2c9_genotype_2, 'T') == 1){
          if (count_genotype(cyp2c9_genotype_3, 'C') == 1){
              cyp23 = 1;
          }else{
              cyp12 = 1;
          }
      }else if (count_genotype(cyp2c9_genotype_2, 'T') == 2){
          cyp22 = 1;
      }
    }
    results = this.calculateAndPrintFactor('CYP2C9 (*1/*2)', results, 0, -0.5211, cyp12);
    results = this.calculateAndPrintFactor('CYP2C9 (*1/*3)', results, 0, -0.9357, cyp13);
    results = this.calculateAndPrintFactor('CYP2C9 (*2/*2)', results, 0, -1.0616, cyp22);
    results = this.calculateAndPrintFactor('CYP2C9 (*2/*3)', results, 0, -1.9206, cyp23);
    results = this.calculateAndPrintFactor('CYP2C9 (*3/*3)', results, 0, -2.3312, cyp33);
    results = this.calculateAndPrintFactor('CYP2C9 Unknown', results, 0, -0.2188, cyp2c9_unknown);
    
    //Final Dose Manipulation (i.e. squaring it)
    this.final_clinical_dose = results['clinical_total']*results['clinical_total'];
    this.final_genetic_dose = results['genetic_total']*results['genetic_total'];
    
    this.printFactor('<b>Clinical Dose (mg/week):</b>', '', this.final_clinical_dose, '<b>PGx Dose<br>(mg/week):</b>', this.final_genetic_dose, '');
    
    // Add CYP4F2 genotype into dosing equation
    var cyp4f2_var = 0;
    this.extended_dose = -1.2948 + (1.0409 * this.final_genetic_dose)
    this.printFactor('Extended Dosing', '', '', 'Initial:', this.extended_dose, '')
    if (cyp4f2 != undefined && count_genotype(cyp4f2.genotype, 'T') > 0){
        extended_dose += 7.5016
        cyp4f2_var = 1
    }
    results = this.printFactor('CYP4F2 (CT)', '', '', 7.5016, this.extended_dose, cyp4f2_var);
    this.printFactor('', '', '', '<b>Extended PGx Dose<br>(mg/week):</b>', this.xtended_dose, '');
    this.showGraph(this.final_clinical_dose, this.final_genetic_dose, this.extended_dose);
    
    this.el.find('.submit > div').show();
  },
  
  checkWarfarin: function(){
    this.el.find('.required').hide();
    if (window.App.check_genome() == false) return false;
    if (window.App.user.age == null) {
      this.el.find('#please-enter-age').show('slow');
      return false;
    }
    if (window.App.user.height == null) {
      this.el.find('#please-enter-height').show('slow');
      return false;
    }
    if (window.App.user.weight == null) {
      this.el.find('#please-enter-weight').show('slow');
      return false;
    }
    if (window.App.user.race == null) {
      this.el.find('#please-select-race').show('slow');
      return false;
    }
    if (window.App.user.enzyme == null) {
      this.el.find('#please-select-enzyme').show('slow');
      return false;
    }
    if (window.App.user.amiodarone == null) {
      this.el.find('#please-select-amiodarone').show('slow');
      return false;
    }
    
    return true;
  }
  
  });
});
