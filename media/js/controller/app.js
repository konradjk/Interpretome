window.AppController = Backbone.Controller.extend({
  routes: {
    'start': 'start',
    'lookup': 'lookup',
    'warfarin': 'warfarin',
    'diabetes': 'diabetes',
    'height': 'height',
    'ancestry': 'ancestry',
    'gwas': 'gwas',
    'similarity': 'similarity',
    'longevity': 'longevity',
    'pca': 'pca'
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
  
  ancestry: function() {
    this.render_or_show(window.Ancestry);
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
  
  pca: function() {
    this.render_or_show(window.PCA);
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
