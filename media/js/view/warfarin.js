$(function() {
window.WarfarinView = Backbone.View.extend({
  el: $('#warfarin'),
  has_loaded: false,
  hidden: false,
  final_clinical_dose: 0,
  final_genetic_dose: 0,
  extended_dose: 0,

  events: {
    'click #warfarin-dose': 'click_warfarin_dose',
    //'click #submit-doses': 'click_submit',
    'click #clear-snps' : 'clear_snps',
    //'click #confirm-submit-doses': 'click_confirm_submit'
  },

  initialize: function() {
    _.bindAll(this, 'click_warfarin_dose', 'generate_graphs',
              'check_warfarin', 'clear_snps',
      //'click_submit', 'click_confirm_submit',
      'loaded');
  },
  
  render: function() {
    $.get('/media/template/warfarin.html', this.loaded);
  },
    
  loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
    this.warfarinDoseTemplate = $('#warfarin-dose-template').html();
	  this.el.find('.submit > div').hide();
    this.el.find('#race').buttonset();
    this.el.find('#enzyme').buttonset();
    this.el.find('#amiodarone').buttonset();
    this.el.find('#weight_units').buttonset();
    this.el.find('#height_units').buttonset();
    $('#table-options').hide();
	  match_style(this.el);
    this.has_loaded = true;
  },
  
  //click_submit: function(event) {
  //  var self = this;
  //  $('#confirm-submit-doses').dialog({
  //    modal: true, resizable: false, buttons: {
  //      'Confirm' : function() {
  //        self.click_confirm_submit();
  //        $(this).dialog('close');
  //      },
  //      'Cancel': function() {$(this).dialog('close');}
  //    }
  //  });
  //},
  //
  //click_confirm_submit: function(event) {
  //  var output_doses = [this.final_clinical_dose, this.final_genetic_dose, this.extended_dose];
  //  var self = this;
  //  $.get( '/submit/submit_doses/', { doses: output_doses.join(',') }, check_submission);
  //},
  
  calculate_and_print_factor: function(feature, results, clincial_multiplier, genetic_multiplier, value) {
    results['clinical_total'] += clincial_multiplier*value;
    results['genetic_total'] += genetic_multiplier*value;
    this.print_factor(feature, clincial_multiplier, results['clinical_total'], genetic_multiplier, results['genetic_total'], value)
    return results;
  },
  
  print_factor: function(feature, clincial_multiplier, clinical_total, genetic_multiplier, genetic_total, value){
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
  
  clear_snps: function() {
    $('#warfarin-table tr').slice(1).remove();
    $('#warfarin-table').hide();
    $('#warfarin-graph-table').empty();
    $('#table-options').hide();
  },
  
  click_warfarin_dose: function(event) {
    this.clear_snps();
    var raw_age = this.el.find('#age-textarea').val();
    var raw_height = this.el.find('#height-textarea').val();
    var raw_weight = this.el.find('#weight-textarea').val();
    var raw_race = $('#race label[aria-pressed="true"]').attr('for');
    var raw_enzyme = $('#enzyme label[aria-pressed="true"]').attr('for');
    var raw_amiodarone = $('#amiodarone label[aria-pressed="true"]').attr('for');
    
    user = get_user();
    user.age = check_float(raw_age);
      
    if ($('#height_units label[aria-pressed="true"]').attr('for') == 'in'){
      user.height = check_inches(raw_height);
    } else {
      user.height = check_float(raw_height);
    }
    
    user.weight = check_float(raw_weight);
    
    if (raw_race != undefined){
      user.race = raw_race;
    }
    if (raw_enzyme != undefined){
      user.enzyme = raw_enzyme;
    }
    if (raw_amiodarone != undefined){
      user.amiodarone = raw_amiodarone;
    }
    
    if (this.check_warfarin() == false) return;
    
    var decades = Math.floor(user.age/10);
    
    if ($('#weight_units label[aria-pressed="true"]').attr('for') == 'lbs'){
      user.weight = user.weight/2.2;
    }
    var asian = 0;
    var black = 0;
    var other = 0;
    if (user.race == 'race_asian'){
      asian = 1;
    }else if (user.race == 'race_black'){
      black = 1;
    }else if (user.race == 'race_other'){
      other = 1;
    }
    
    var enzyme = 0;
    var amiodarone = 0;
    if (user.enzyme == 'enzyme_yes'){
      enzyme = 1;
    }
    if (user.amiodarone == 'amiodarone_yes'){
      amiodarone = 1;
    }
    var results = {};
    
    var vkorc1 = user.lookup('9923231');
    var cyp2c9_2 = user.lookup('1799853');
    var cyp2c9_3 = user.lookup('1057910');
    var cyp4f2 = user.lookup('2108622');
    
    results['clinical_total'] = 4.0376;
    results['genetic_total'] = 5.6044;
    
    this.el.find('#warfarin-table').show();
    results = this.calculate_and_print_factor('Age (in decades)', results, -0.2546, -0.2614, decades);
    results = this.calculate_and_print_factor('Height (in cm)', results, 0.0118, 0.0087, user.height);
    results = this.calculate_and_print_factor('Weight (in kg)', results, 0.0134, 0.0128, user.weight);
    results = this.calculate_and_print_factor('Asian', results, -0.6752, -0.1092, asian);
    results = this.calculate_and_print_factor('Black', results, 0.406, -0.276, black);
    results = this.calculate_and_print_factor('Other/Mixed', results, 0.0443, -0.1032, other);
    results = this.calculate_and_print_factor('Enzyme Inducer', results, 1.2799, 1.1816, enzyme);
    results = this.calculate_and_print_factor('Amiodarone', results, -0.5695, -0.5503, amiodarone);
    
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
    results = this.calculate_and_print_factor('VKORC (rs9923231 TT)', results, 0, -1.6974, vkorc1_tt);
    results = this.calculate_and_print_factor('VKORC (rs9923231 CT)', results, 0, -0.8677, vkorc1_ct);
    results = this.calculate_and_print_factor('VKORC (rs9923231 Unknown)', results, 0, -0.4854, vkorc1_unknown);
    
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
    results = this.calculate_and_print_factor('CYP2C9 (*1/*2)', results, 0, -0.5211, cyp12);
    results = this.calculate_and_print_factor('CYP2C9 (*1/*3)', results, 0, -0.9357, cyp13);
    results = this.calculate_and_print_factor('CYP2C9 (*2/*2)', results, 0, -1.0616, cyp22);
    results = this.calculate_and_print_factor('CYP2C9 (*2/*3)', results, 0, -1.9206, cyp23);
    results = this.calculate_and_print_factor('CYP2C9 (*3/*3)', results, 0, -2.3312, cyp33);
    results = this.calculate_and_print_factor('CYP2C9 Unknown', results, 0, -0.2188, cyp2c9_unknown);
    
    //Final Dose Manipulation (i.e. squaring it)
    this.final_clinical_dose = results['clinical_total']*results['clinical_total'];
    this.final_genetic_dose = results['genetic_total']*results['genetic_total'];
    
    this.print_factor('<b>Clinical Dose (mg/week):</b>', '', this.final_clinical_dose, '<b>PGx Dose<br>(mg/week):</b>', this.final_genetic_dose, '');
    
    // Add CYP4F2 genotype into dosing equation
    var cyp4f2_var = 0;
    this.extended_dose = -1.2948 + (1.0409 * this.final_genetic_dose)
    this.print_factor('Extended Dosing', '', '', 'Initial:', this.extended_dose, '')
    if (cyp4f2 != undefined && count_genotype(cyp4f2.genotype, 'T') > 0){
        this.extended_dose += 7.5016
        cyp4f2_var = 1
    }
    results = this.print_factor('CYP4F2 (CT)', '', '', 7.5016, this.extended_dose, cyp4f2_var);
    this.print_factor('', '', '', '<b>Extended PGx Dose<br>(mg/week):</b>', this.xtended_dose, '');
    
    this.generate_graphs();
    
    $('#table-options').show();
  },
  
  generate_graphs: function(){
    data = new google.visualization.DataTable();
    
    data.addColumn('string', 'Label');
    data.addColumn('number', 'Value');
    data.addRows(3);
    data.setValue(0, 0, 'Clinical');
    data.setValue(0, 1, parseFloat(this.final_clinical_dose.toFixed(2)));
    data.setValue(1, 0, 'Genetic');
    data.setValue(1, 1, parseFloat(this.final_genetic_dose.toFixed(2)));
    data.setValue(2, 0, 'Extended');
    data.setValue(2, 1, parseFloat(this.extended_dose.toFixed(2)));
    
    var chart = new google.visualization.Gauge(document.getElementById('warfarin-graph-table'));
    var options = {width: 900, height: 200, redFrom: 50, redTo: 80,
        min: 20, max: 70,
        yellowFrom:25, yellowTo: 50, minorTicks: 5};
    chart.draw(data, options);
  },
  
  check_warfarin: function(){
    this.el.find('.required').hide();
    if (window.App.check_genome() == false) return false;
    user = get_user();
    var works = true;
    if (user.age == null) {
      this.el.find('#please-enter-age').show('slow');
      works = false;
    }
    if (user.height == null) {
      this.el.find('#please-enter-height').show('slow');
      works = false;
    }
    if (user.weight == null) {
      this.el.find('#please-enter-weight').show('slow');
      works = false;
    }
    if (user.race == null) {
      this.el.find('#please-select-race').show('slow');
      works = false;
    }
    if (user.enzyme == null) {
      this.el.find('#please-select-enzyme').show('slow');
      works = false;
    }
    if (user.amiodarone == null) {
      this.el.find('#please-select-amiodarone').show('slow');
      works = false;
    }
    return works;
  }
  
  });
});
