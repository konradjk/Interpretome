window.AppController = Backbone.Controller.extend({
  
  routes: {
    'start': 'start',
    'lookup': 'lookup',
    
    'warfarin': 'warfarin',
    'diabetes': 'diabetes',
    'disease': 'disease',
    
    'height': 'height',
    'gwas': 'gwas',
    'longevity': 'longevity',
    'neandertal': 'neandertal',
    
    'similarity': 'similarity',
    'pca': 'pca',
    'painting': 'painting'
  },
  
  start: function() {
    this.render_or_show(window.Start);
  },
  
  lookup: function() {
    this.render_or_show(window.Lookup);
  },
  
  warfarin: function() {
    this.render_or_show(window.Warfarin);
  },
  
  diabetes: function() {
    this.render_or_show(window.Diabetes);
  },
  
  height: function() {
    this.render_or_show(window.Height);
  },
  
  gwas: function() {
    this.render_or_show(window.Gwas);
  },
  
  similarity: function() {
    this.render_or_show(window.Similarity);
  },
  
  longevity: function() {
    this.render_or_show(window.Longevity);
  },
  
  neandertal: function() {
    this.render_or_show(window.Neandertal);
  },
  
  disease: function() {
    this.render_or_show(window.Disease);
  },
  
  pca: function() {
    this.render_or_show(window.PCA);
  },
  
  painting: function() {
    this.render_or_show(window.Painting);
  },

  render_or_show: function(controller) {
    if (controller.has_loaded) {
      $('#tabs').tabs('select', '#' + controller.el.attr('id'));
    }
    else {
      controller.render();
    }
  }
});
