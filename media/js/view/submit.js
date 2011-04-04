$(function() {
window.SubmitView = Backbone.View.extend({
	el: $('#submit'),
	has_loaded: false,
  
  events: {
    'click #submit-information': 'click_submit'
  },

  initialize: function() {
    _.bindAll(this, 'click_submit', 'loaded');
  },
  
  render: function() {
    $.get('/media/template/submit.html', this.loaded);
  },
    
  loaded: function(response) {
    this.el.append(response);
    this.el.find('button').button();
    this.el.find('.help-button').button({
      icons: {primary: 'ui-icon-help'}	    
    });
    this.has_loaded = true;
  },
  
  click_submit: function() {
    var raw_input = this.el.find('#submit-textarea').val();
    input = this.sanitize_input(raw_input);
    console.log(input);
    //$.get(
    //  '/submit/submit_snp/', {
    //    input: input
    //  }, function(response) {
    //    return;
    //  }
    //);
  },
  
  sanitize_input: function(input) {
    output = input.replace(/'/g, '');
    return output;
  }
});
});