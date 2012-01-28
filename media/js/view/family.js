$(function() {
window.FamilyView = Backbone.View.extend({
  has_loaded: false,
  el: $('#family'),

  events: {
    'click #refresh-boxes': 'refresh_boxes',
    'click #compute_mie': 'compute_mie'
  },

  initialize: function() {
    _.bindAll(this, 'loaded', 'refresh_box',
      'refresh_boxes', 'compute_mie'
    );
  },
  
  render: function() {
    $.get('/media/template/family.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
    match_style(this.el);
    this.has_loaded = true;
  },
  
  refresh_boxes: function() {
    this.refresh_box('mother-select');
    this.refresh_box('father-select');
    this.refresh_box('child-select');
  },
  
  refresh_box: function(box) {
    $('#' + box + ' option').replaceWith($('#genome-analysis option').clone());
    $('#' + box).prepend('<option value="null">Not selected</option>');
  },
  
  compute_mie: function() {
    var self = this;
    mother = window.App.users[$('#mother-select option:selected').val()];
    father = window.App.users[$('#father-select option:selected').val()];
    child = window.App.users[$('#child-select option:selected').val()]
    
    if (mother == null || father == null || child == null) {
      console.log('w00t');
      return;
    }
    var errors = 0;
    var total = 0;
    
    $.each(child.snps, function(i, v) {
      var user_snp = v;
      var mother_snp = mother.lookup(i);
      var father_snp = father.lookup(i);
      if (mother_snp != undefined && father_snp != undefined) {
        if (mother_snp.genotype.length == 2 && father_snp.genotype.length == 2) {
          if (!(self.check_no_error(user_snp.genotype, mother_snp.genotype, father_snp.genotype))) {
            errors += 1;
          }
          total += 1;
        }
      }
    });
    $('#mie_results').html('Mendelian Errors: ' + errors + ' out of ' + total);
  },
  
  check_no_error: function(user, mother, father) {
    alleles = user.split('');
    if (count_genotype(mother, alleles[0]) > 0 && count_genotype(father, alleles[1]) > 0) {
      return true;
    } else if (count_genotype(mother, alleles[1]) > 0 && count_genotype(father, alleles[0]) > 0) {
      return true;
    } else {
      return false;
    }
  }
  
  });
});
