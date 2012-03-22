$(function() {
window.StartView = Backbone.View.extend({
	el: $('#start'),
	has_loaded: false,
  
	initialize: function() {
	  _.bindAll(this, 'loaded');
	},
	
	render: function() {
	  $.get('/media/template/start.html', this.loaded);
    this.has_loaded = true;
	},
	
	loaded: function(response) {
    $(this.el).append(response);
    $('button').button();
    if (window.File && window.FileReader) {
      //$('#compatible').show();
    } else {
      $('#not-compatible').show();
      $('#global-settings').hide();
    }
	}
});
});