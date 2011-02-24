$(function() {
  console.log('Starting.');
  window.Start = new StartView();
  window.Lookup = new LookupView();
  window.App = new AppView();
  window.App.user = new User();
  
  window.Start.render();
  window.Lookup.render();
  window.App.render();
  
  window.Controller = new AppController();
  Backbone.history.start();
});