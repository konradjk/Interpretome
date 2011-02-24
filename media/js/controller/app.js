window.AppController = Backbone.Controller.extend({
  routes: {
    'start': 'start',
    'lookup': 'lookup',
  },
  
  start: function() {
    $('#tabs').tabs('select', '#start');
  },
  
  lookup: function() {
    $('#tabs').tabs('select', '#lookup');
  }
});