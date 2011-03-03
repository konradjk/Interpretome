window.AppController = Backbone.Controller.extend({
  routes: {
    'start': 'start',
    'lookup': 'lookup',
    'warfarin': 'warfarin'
  },
  
  start: function() {
    $('#tabs').tabs('select', '#start');
  },
  
  lookup: function() {
    $('#tabs').tabs('select', '#lookup');
  },
  
  warfarin: function() {
    $('#tabs').tabs('select', '#warfarin');
  }
});