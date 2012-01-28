// Later, we can load these on-demand if we CustomExercise.
$(function() {
  window.Start = new StartView();
  window.Lookup = new LookupView();
  window.Explore = new ExploreView();
 
  window.Diabetes = new DiabetesView(); 
  window.Disease = new DiseaseView();
  window.Warfarin = new WarfarinView();
  window.Pharmacogenomics = new PharmacogenomicsView();
  
  window.Similarity = new SimilarityView();
  window.PCA = new PCAView();
  window.Painting = new PaintingView();
  window.Family = new FamilyView();
  
  window.App = new AppView();
  window.App.custom_exercise = new CustomExercise();
  //window.App.user_db = window.openDatabase("interpretome-genomes-2", "1.0", "Genomes", 100000000);
  window.App.users = {};
  
  window.App.render();
  window.Start.render();
  
  window.Controller = new AppController();
  Backbone.history.start();
  
  $('#open-confirm-dialog').button();
  $('#open-load-genome-dialog').button();
  
  $('#confirm-dialog').dialog({modal: true, resizable: false, autoOpen: false,
                              width: "60%", buttons: {
                                "Close": function() {$(this).dialog("close");}
                              }});
  $('#load-genome-dialog').dialog({modal: true, resizable: false, autoOpen: false,
                              width: "60%", buttons: {
                                "Close": function() {$(this).dialog("close");}
                              }});
  
  $('#loading-genome').dialog({modal: true, resizable: false, autoOpen: false});
  
  $('#looking-up').dialog({modal: true, resizable: false, autoOpen: false});
  $('#imputing-lots').dialog({modal: true, resizable: false, autoOpen: false});
  $('#confirm-submit-snps').dialog({modal: true, resizable: false, autoOpen: false});
  $('#thank-you').dialog(
    {modal: true, resizable: false, autoOpen: false,
    buttons: { 'Woohoo!' : function() { $(this).dialog('close'); } }
  });
  $('#nothing').dialog(
    {modal: true, resizable: false, autoOpen: false,
    buttons: { 'Okay' : function() { $(this).dialog('close'); } }
  });
  $('#login-dialog').dialog({modal: true, resizable: false, autoOpen: false});
  $('#settings').dialog(
    {modal: true, resizable: false, autoOpen: false,
    minWidth: '600', minHeight: '600',
    buttons: { 'Okay' : function() { $(this).dialog('close'); } }
  });
  $("#ld-slider").slider({
    range: 'min',
    min: 0.3, max: 1.0, step: 0.05, value: 0.7,
    slide: function(event, ui) { 
      document.getElementById('ld-cutoff-amount').innerText = ui.value; 
    }
  });
  $('#login-link').click(function() {
     $('#login-dialog').dialog("open");
   });
  
  $('#ld-cutoff-amount').html($("#ld-slider").slider("value"));
  
  $('#ThemeRoller').themeswitcher();
  $(".results-table").addClass("tablesorter");
  
  var isCtrl = false;
  $(document).keyup(function (e) {
    if(e.which == 17) isCtrl=false;
    }).keydown(function (e) {
      if(e.which == 17) isCtrl=true;
      if(e.which == 69 && isCtrl == true) {
        window.App.change_population('CEU');
      return false;
     }
  });
});

function count_genotype(value, allele) {
  if (_.isString(value)) value = value.split('');
  return _.select(value, function(v) {return v == allele;}).length;
}

function clear_table(table_name) {
  $('#' + table_name + ' tbody tr').remove();
  $('#' + table_name).hide();
  $("#" + table_name).trigger("update");
}

function check_float(value) {
  if (!_.isNaN(parseFloat(value))){
    return parseFloat(value);
  }
  return null;
}

function compute_odds(probability) {
  return probability/ (1 - probability);
}
function compute_probability(odds) {
  return odds / (1 + odds);
}
function add_commas(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

function raw_string_to_buffer(str) {
  var idx, len = str.length, arr = new Array( len );
  for (idx = 0 ; idx<len ; ++idx) {
      arr[idx] = str.charCodeAt(idx) & 0xFF;
  }
  return new Uint8Array(arr).buffer;
}

function check_inches(value) {
  var split_height = value.split(/\'/g);
  var feet = '';
  var inches = '';
  if (split_height.length > 1){
    feet = parseFloat(split_height[0]);
    if (split_height[1] == ''){
      inches = 0;
    }else{
      inches = parseFloat(split_height[1]);
    }
  }
  if (!_.isNaN(parseFloat(feet)) && !_.isNaN(parseFloat(inches))){
    return (feet*12 + inches)*2.54;
  }
  if (!_.isNaN(parseFloat(value))) {
    return parseFloat(value)*2.54;
  }
  return null;
}

function filter_identifiers(ids) {
  var replace_letters_regex = /^rs/;
  if (!_.isArray(ids)) ids = [ids];
  
  var replaced_ids = _.select(
    _.map(ids, function(v) {
      if (_.isNumber(v)) return v;
      return parseInt(v.replace(replace_letters_regex, ''));
    }),
    function(v) {
      return !_.isNaN(v);
    }
  )
  return replaced_ids;
}
var filter_identifier = filter_identifiers;

function get_secondary_color() {
  return $('#clear-genome .ui-button-text').css('color');
}

function sort_genotype(genotype) {
  return genotype.split('').sort().join('');
}

function check_submission(response){
  if (response != null){
    $('#thank-you').dialog('open');
  }else{
    $('#nothing').dialog('open');
  }
}

function match_style(el) {
  $('.secondary-color').css('color', get_secondary_color());
  el.find('.ui-button-text').addClass('small-button');
}

function compare_arrays(a1, a2) {
  if (a1.length != a2.length) return false;
  a1 = a1.sort();
  a2 = a2.sort();
  
  for (var i = 0; a2[i]; i++) {
    if (a1[i] != a2[i]) return false;
  }
  
  return true;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

function flip_genotype(genotype) {
  var base_map = {A: 'T', T: 'A', C: 'G', G: 'C'};
  return _.map(genotype.split(''), function(v) {return base_map[v]}).join('');
}

function get_user() {
  return window.App.users[$('#genome-analysis option:selected').val()];
}

function get_ld_cutoff() {
  return check_float($("#ld-slider").slider("value"));
}
