$(function() {
window.StartView = Backbone.View.extend({
  // I think we can use $ instead of jQuery here.
	el: jQuery('#start'),
	has_loaded: false,
	
	initialize: function() {
	  _.bindAll(this, 'loaded');
	},
	
	render: function() {
	  $.get('/media/template/start.html', this.loaded);
	},
	
	loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
    this.has_loaded = true;
	}
});
});