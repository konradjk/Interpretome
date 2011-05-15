$(function() {
window.StartView = Backbone.View.extend({
	el: $('#start'),
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
    if (window.File && window.FileReader) {
      $('#compatible').show();
    } else {
      $('#not-compatible').show();
    }
    this.has_loaded = true;
	}
});
});