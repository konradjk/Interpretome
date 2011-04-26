// Later, we can load these on-demand if we want.
$(function() {
  //console.log('Starting.');
  window.Start = new StartView();
  window.Lookup = new LookupView();
  window.Gwas = new GwasView();
  window.Warfarin = new WarfarinView();
  window.Diabetes = new DiabetesView();
  window.Height = new HeightView();
  window.Ancestry = new AncestryView();
  window.Similarity = new SimilarityView();
  window.Longevity = new LongevityView();
  window.PCA = new PCAView();
  
  window.App = new AppView();
  window.App.user = new User();
  
  window.App.render();
  window.Start.render();
  
  window.Controller = new AppController();
  Backbone.history.start();
  
  var isCtrl = false;
  $(document).keyup(function (e) {
    if(e.which == 17) isCtrl=false;
    }).keydown(function (e) {
      if(e.which == 17) isCtrl=true;
      if(e.which == 76 && isCtrl == true) {
        $("#genome-file").trigger('click');
        alert('w00t');
        return false;
     }
  });
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


function print_text(text_to_print) {
  console.log(text_to_print);
  var win = window.open();
  self.focus();
  win.document.open();
  win.document.write("<html><head><link rel='stylesheet' type='text/css' href='/media/css/interpretome.css'></head><body>");
  win.document.write("<h2>Analyze Me - Results</h2>");
  win.document.write(text_to_print);
  win.document.write('</body></html>');
  win.document.close();
  win.print();
  win.close();
}

function count_genotype(value, allele) {
  return _.select(value, function(v) {return v == allele;}).length;
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

function check_inches(value) {
  var split_height = value.split(/\'/g);
  var feet = '';
  var inches = '';
  if (split_height.length > 1){
    feet = parseFloat(split_height[0]);
    inches = parseFloat(split_height[1]);
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
  return $('#clear-snps .ui-button-text').css('color');
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


