window.AppController = Backbone.Controller.extend({
  
  routes: {
    'start': 'start',
    'lookup': 'lookup',
    'explore': 'explore',
    
    'warfarin': 'warfarin',
    'diabetes': 'diabetes',
    'disease': 'disease',
    'pharmacogenomics': 'pharmacogenomics',
    
    'similarity': 'similarity',
    'pca': 'pca',
    'painting': 'painting',
    'family': 'family'
  },
  
  start: function() {
    this.render_or_show(window.Start);
  },
  
  lookup: function() {
    this.render_or_show(window.Lookup);
  },
  
  explore: function() {
    this.render_or_show(window.Explore);
  },
  
  diabetes: function() {
    this.render_or_show(window.Diabetes);
  },
  disease: function() {
    this.render_or_show(window.Disease);
  },
  warfarin: function() {
    this.render_or_show(window.Warfarin);
  },
  pharmacogenomics: function() {
    this.render_or_show(window.Pharmacogenomics);
  },
  
  similarity: function() {
    this.render_or_show(window.Similarity);
  },
  pca: function() {
    this.render_or_show(window.PCA);
  },
  painting: function() {
    this.render_or_show(window.Painting);
  },
  family: function() {
    this.render_or_show(window.Family);
  },

  render_or_show: function(controller) {
    if (controller.has_loaded) {
      $('#tabs').tabs('select', '#' + controller.el.attr('id'));
    } else {
      controller.render();
    }
  }
});
