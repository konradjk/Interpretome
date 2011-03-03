$(function() {
window.StartView = Backbone.View.extend({
	el: jQuery('#start'),
	
	initialize: function() {
	  _.bindAll(this, 'loaded');
	},
	
	render: function() {
	  $.get('/media/template/start.html', this.loaded);
	},
	
	loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
	}
});
});