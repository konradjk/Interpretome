$(function() {
window.NeandertalView = Backbone.View.extend({
  el: $('#neandertal'),

  events: {
    'click #neandertal': 'click_neandertal',
    'click .help-button': 'click_help'
  },

  initialize: function() {
    _.bindAll(this, 'click_neandertal', 'click_help', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/neandertal.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
	  this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
	  });
	  this.neandertal_template = $('#neandertal-template').html();
	  this.el.find('.help > div').hide();
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
  
  count_genotype: function(value, allele) {
    result = _.select(value, function(v) {return v == allele;}).length;
  },
  
  display_factor: function(feature, clincial_multiplier, clinical_total, genetic_multiplier, genetic_total, value){
    var output = {};
    
    this.el.find('#neandertal-table').append(_.template(this.warfarin_dose_tempplate, output));
  },
  
  click_neandertal: function(event) {
    this.el.find('#neandertal-table tr').slice(1).remove();
    this.el.find('#neandertal-table').hide();
    if (this.check_neandertal() == false) return;
    
    
  },
  
  // I assume this is a stub - otherwise just use check_genome().
  check_neandertal: function(){
    if (window.App.check_genome() == false) return false;
    
    return true;
  }
  
  });
});
