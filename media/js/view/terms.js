$(function() {
window.TermsView = Backbone.View.extend({
	el: $('#terms'),
	has_loaded: false,
  
	initialize: function() {
	  _.bindAll(this, 'loaded');
	},
	
	render: function() {
	  $.get('/media/template/terms.html', this.loaded);
	},
	
	loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
    this.has_loaded = true;
	}
});
});