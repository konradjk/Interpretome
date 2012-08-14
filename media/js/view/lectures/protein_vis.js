$(function() {
window.GenericView = Backbone.View.extend({
  el: $('#exercise-content'),
  name:'Protein-Vis',  
  table_id: '#protein_vis_table',
  template_id: '#protein_vis_template',
  url: '/media/template/lectures/protein_vis.html',

  events: {
    'click #get_vis_info': 'start',
    'click #show_vis': 'display'
  },
  
  initialize: function() {
    _.bindAll(this, 'loaded',
      'start', 'got_all_info',
      'got_protein_info', 'more_pdb_info',
      'display',
      'finish'
    );
  },
  
  render: function() {
    $.get(this.url, this.loaded);
  },
    
  loaded: function(response) {
	  $(this.el).append(response);
	  this.table_template = $(this.template_id).html();
    $('#get_vis_info').button();
    $('#show_vis').button({disabled:true});
  },
  
  start: function(response) {
    $.get('/media/help/protein_vis.html', {}, function(response) {
      $('#help-exercise-help').html(response);
    });
    $('#pdb-options').empty();
    $('.required').hide();
    $('#protein_vis_table tr').slice(1).remove();
    $('#protein_vis_space').empty();
    user = get_user();
    var vis_snp_lookup = $('#vis_snp_lookup').val();
    if (vis_snp_lookup == undefined) return false;
    jmolInitialize('/media/js/jmol', true);
    var self = this;
    $('#loading-data').dialog('open');
    $.get(
      '/get_vis_info/', {
        dbsnp: vis_snp_lookup
      }, function(response) {
        return user.lookup_snps(
          self.got_protein_info, response, _.keys(response), {}, true
        );
      }
    );
  },
  
  got_protein_info: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    user.get_damaging_info(
      self.got_all_info, response, all_dbsnps, extended_dbsnps
    );
  },
  
  got_all_info: function(response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var this_snp = response[_.keys(response)[0]];
    _.extend(this_snp, extended_dbsnps[_.keys(response)[0]]);
    if (this_snp != undefined) {
      if (this_snp['aa_position'] == undefined) this_snp['aa_position'] = 'Non-coding'
      $(self.table_id + " > tbody").append(_.template(self.table_template, {data:this_snp}));
    }
    $(this.table_id).show();
    $(this.table_id).tablesorter();
    $('#table-options').show();
    if (this_snp['pdbs'] != undefined) {
      all_pdbs = this_snp['pdbs'].join();
      $.get('http://www.pdb.org/pdb/rest/describePDB', { structureId : all_pdbs },
        function(pdb_response) {
          return self.more_pdb_info(pdb_response, response, _.keys(response), {});
        }
      );
    } else {
      self.more_pdb_info(undefined, response, _.keys(response), {});
    }
  },
  
  more_pdb_info: function(pdb_response, response, all_dbsnps, extended_dbsnps) {
    var self = this;
    var this_snp = response[_.keys(response)[0]];
    if (pdb_response != undefined) {
      $.each(pdb_response.firstChild.getElementsByTagName('PDB'), function(i, v) {
        out_string = v.getAttribute('structureId') + ' (' + v.getAttribute('expMethod') + ' - ' + v.getAttribute('resolution') + 'A)';
        $('#pdb-options').append($("<option />").val(v.getAttribute('structureId')).text(out_string));
      });
      $('#pdb-chooser').show();
      $("#show_vis").button( "option", "disabled", false );
    }
    $('#loading-data').dialog('close');
  },
  
  display: function() {
    var self = this;
    pdb = $('#pdb-options option:selected').val();
    position = $('#protein_vis_table > tbody > tr > td.aa_position')[0].innerText;
    jmolSetDocument(0);
    var x = jmolApplet([800,600], 'load =' + pdb + "; wireframe 0; spacefill 0; cartoons; color structure; select " + position + "; color blue;");
    $('#protein_vis_space').html(x);
    $('#protein_vis_space').append(jmolBr());
    $('#protein_vis_space').append('Color Scheme: ' + jmolRadioGroup([
      ["select protein; color structure; select " + position + "; color blue;", "structure (default)", "checked"],
      ["select protein; color group; select " + position + "; color blue;", "group"],
      ["select protein; color temperature; select " + position + "; color blue;", "temperature"],
      ["select protein; color amino;", "amino"]
    ]));
    $('#protein_vis_space').append(jmolBr());
    $('#protein_vis_space').append('Variant Position: ' + jmolRadioGroup([
      ["select " + position + "; wireframe 0; spacefill 0;", "default", "checked"],
      ["select " + position + "; spacefill 300;", "spacefill"]
    ]));
    //this.finish(all_dbsnps, extended_dbsnps);
  },
  
  finish: function(all_dbsnps, extended_dbsnps) {

  }
});
});
