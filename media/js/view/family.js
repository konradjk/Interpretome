$(function() {
window.FamilyView = Backbone.View.extend({
  has_loaded: false,
  el: $('#family'),

  events: {
    'click #set_inheritance': 'click_set_inheritance',
    'change #Mother-file': 'change_any_parent',
    'change #Father-file': 'change_any_parent',
    'change #Parent-file': 'change_any_parent',
    'click #compute_inheritance': 'compute_inheritance'
    },

  initialize: function() {
    _.bindAll(this, 'click_set_inheritance', 'loaded',
      'one_parent', 'two_parents', 'add_parent_loader',
      'change_any_parent', 'check_no_error',
      'compute_inheritance'
    );
  },
  
  render: function() {
    $.get('/media/template/family.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  this.el.find('button').button();
    $('#compute_inheritance').hide();
    match_style(this.el);
    this.has_loaded = true;
  },
  
  click_set_inheritance: function(event) {
    var family_size = $('#family-size option:selected').val();
    if (window.App.check_genome() == false) return;
    $('#parent_init').empty();
    if (family_size == 2) {
      this.one_parent();
    } else {
      this.two_parents();
    }
  },
  
  add_parent_loader: function(name) {
    $('#parent_init').append("<div id=" + name + ">" + name + ": <input id='" + name + "-file' type='file' name='file' /></div><br/>");
  },
  
  one_parent: function() {
    window.App.Parent = new User();
    this.add_parent_loader('Parent');
  },
  
  two_parents: function() {
    window.App.Mother = new User();
    this.add_parent_loader('Mother');
    window.App.Father = new User();
    this.add_parent_loader('Father');
  },
  
  change_any_parent: function(event) {
    $('#loading-genome').dialog('open');
    var parent_name = event.srcElement.id.replace('-file','');
    console.log(parent_name);
    this.el.find('.progress-bar').progressbar({value: 0});
    this.el.find('.progress-bar > div').css('background', get_secondary_color());
    
    var reader = new FileReader();
    
    var self = this;
    reader.onprogress = function(event) {
      if (event.lengthComputable) {
        var percent = Math.round((event.loaded / event.total) * 100);
        if (percent < 100) {
          self.el.find('#loading-bar').progressbar('option', 'value', percent);
        }
      }
    };
    
    reader.onloadend = function(event) {
      $('#loading-bar').progressbar('option', 'value', 100);
      $('#' + parent_name + ' label, #' + parent_name +' input').hide();
      $('#' + parent_name).append('Loaded');
      window.App[parent_name].parse_genome(event.target.result.split('\n'));
    };
    reader.readAsText(event.target.files[0]);
    
    $('#compute_inheritance').show();
  },
  
  compute_inheritance: function() {
    var family_size = $('#family-size option:selected').val();
    var self = this;
    if (family_size == 3) {
      if (!(window.App.check_any_genome('Mother') || window.App.check_any_genome('Father'))) {
        return;
      }
      var errors = 0;
      var total = 0;
      $.each(window.App.user.snps, function(i, v) {
        var user_snp = v;
        var mother_snp = window.App.Mother.lookup(i);
        var father_snp = window.App.Father.lookup(i);
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
    }
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
