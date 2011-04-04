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
  
  window.App = new AppView();
  window.App.user = new User();
  
  window.App.render();
  window.Start.render();
  
  window.Controller = new AppController();
  Backbone.history.start();
  
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
  if (!_.isNaN(parseFloat(value))){
    return parseFloat(value)*2.54;
  }
  return null;
}

function filter_identifier(ids) {
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

function match_style(el) {
  $('.secondary-color').css('color', $('.ui-button-text').css('color'));
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}


