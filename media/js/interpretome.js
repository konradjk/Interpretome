// Later, we can load these on-demand if we want.
$(function() {
  console.log('Starting.');
  window.Start = new StartView();
  window.Lookup = new LookupView();
  window.Warfarin = new WarfarinView();
  window.Diabetes = new DiabetesView();
  window.Height = new HeightView();
  window.App = new AppView();
  window.App.user = new User();
  
  window.App.render();
  
  window.Controller = new AppController();
  Backbone.history.start();
});

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
  
  if (ids.length == 1) {
    if (replaced_ids.length == 1) {
      return replaced_ids[0];
    }
    return null;
  }
  return replaced_ids;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}


