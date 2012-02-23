$(function() {
window.LookupView = Backbone.View.extend({
  el: $('#lookup'),
  has_loaded: false,
  hidden: false,

  events: {
    'click #lookup-snps': 'click_lookup_snps',
    'click #clear-snps': 'click_clear_snps',
    'click .explain-snp': 'click_explain',
    'click .map-snp': 'click_map',
    'click #lookup-demo': 'toggle_demo',
    'click #lookup-bed': 'toggle_bed',
    'click #submit-snps': 'click_submit',
    'click #confirm-submit-snps': 'click_confirm_submit',
    'click #delete-snps': 'click_delete_snps',
    'click #toggle-unknown-genotypes': 'toggle_unknown_genotypes'
  },

  initialize: function() {
    _.bindAll(this,  
      'click_lookup_snps', 'click_clear_snps', 
      'click_submit', 'click_confirm_submit', 'click_explain', 
      'click_map',
      'get_more_info', 'load_map',
      'loaded',
      'create_pie_chart',
      'toggle_demo', 'toggle_bed',
      'get_map_strings',
      'toggle_unknown_genotypes',
      'print_snps'
    );
  },
  
  render: function() {
    $.get('/media/template/lookup.html', this.loaded);
  },
    
  loaded: function(response) {
    $('#tabs').tabs('select', '#lookup');
	  $(this.el).append(response);
    
	  // Widget initialization.
	  $('button').button();
	  $('#table-options').hide();
	  $('.description').hide();
	  
	  // Initialize general templates.
	  this.lookup_snp_template = $('#lookup-snp-template').html();
	  this.explain_snp_top_template = 
	    $('#explain-lookup-top-template').html();
	  this.explain_snp_bottom_template = 
	    $('#explain-lookup-bottom-template').html();
	  this.bed_file_template = $('#bed-file-template').html();
	  
    $('#too-many-snps').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Okay!': function() {$(this).dialog('close');}
      }
    });
    $('#lookup-snps-table').tablesorter();
	  
	  this.has_loaded = true;
  },
  
  toggle_demo: function(event) {
    $('#lookup-demo').next().toggle('normal');
  },
  
  toggle_bed: function(event) {
    $('#lookup-bed').next().toggle('normal');
  },
  
  // Submission-related logic.
  click_submit: function(event) {
    var self = this;
    $('#confirm-submit-exercise').dialog({
      modal: true, resizable: false, buttons: {
        'Confirm' : function() {
          self.click_confirm_submit();
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
  },
  
  click_confirm_submit: function(event) {
	  var ks = _.map(
	    $('#lookup-snps-table td.key'), 
	    function(v) {return $(v).text();}
	  );
	  var vs = _.map(
	    $('#lookup-snps-table td.value'), 
	    function(v) {return $(v).text();}
	  );
	  submission = get_user.serialize();
	  $.each(ks, function(i, v) {
	    submission[v] = vs[i];
	  });
          
    $.get('/submit/submit_snps/', submission, check_submission);
  },
  click_explain: function(event) {
    output = {};
    output_2 = {};
    output['dbsnp'] = event.target.parentElement.parentElement.childNodes[1].innerHTML;
    var genotypes = event.target.parentElement.parentElement.childNodes[3].innerHTML.split('');
    output['genotype_0'] = genotypes[0];
    output_2['genotype_1'] = genotypes[1];
    var imputed = event.target.parentElement.parentElement.childNodes[17].innerHTML.split(' ');
    output['imp_dbsnp'] = imputed[0];
    output['imp_0'] = imputed[1].substr(1,1);
    output_2['imp_1'] = imputed[1].substr(2,1);
    
    var self = this;
    $('#explain-lookup-top').empty();
    $('#explain-lookup-bottom').empty();
    $('.description > div').hide().show('normal');
    $('#explain-lookup-top').append(_.template(self.explain_snp_top_template, output));
    $('#explain-lookup-bottom').append(_.template(self.explain_snp_bottom_template, output_2));
  },
  
  click_map: function(event) {
    var self = this;
    $('#google-map').hide();
    var table = event.target.parentElement.parentElement.parentElement;
    output = {};
    output['dbsnp'] = table.getElementsByClassName('dbsnp')[0].innerHTML;
    output['reference'] = table.getElementsByClassName('reference')[0].innerHTML;
    output['alternate'] = table.getElementsByClassName('other')[0].innerHTML;
    ref_color = '<font color="071871">';
    alt_color = '<font color="A30008">';
    
    genotype_string = '';
    genotype_1 = table.getElementsByClassName('genotype')[0].innerHTML[0];
    if (genotype_1 == output['alternate']) {
      genotype_string += alt_color + genotype_1 + '</font>';
    } else {
      genotype_string += ref_color + genotype_1 + '</font>';
    }
    genotype_2 = table.getElementsByClassName('genotype')[0].innerHTML[0];
    if (genotype_2 == output['alternate']) {
      genotype_string += alt_color + genotype_2 + '</font>';
    } else {
      genotype_string += ref_color + genotype_2 + '</font>';
    }
    
    $('#google-map-intro').html('rs' + output['dbsnp']
                                + '<br/>Your genotype: ' + genotype_string
                                + '<br/>' + ref_color + 'Reference: ' + output['reference'] + '</font>'
                                + '<br/>' + alt_color + 'Alternate: ' + output['alternate'] + '</font>');
    $.get('/get_hgdp_allele_frequencies/', output, function(response) {
      google.load('maps', '2', {"callback" : function(inner_response) {
        self.load_map(inner_response, response)
      }, other_params: "sensor=false"})
    });
  },
  
  load_map: function(inner_response, response) {
    var self = this;
    $('#google-map').show();
    var map = new GMap2(document.getElementById("google-map"));
    map.setUIToDefault();
    map.setCenter(new GLatLng(20, 0), 2);
    map.setMapType(G_SATELLITE_MAP);
    $.each(response, function(i, v) {
      minlon = parseInt(v['minlon'].slice(0,-1));
      minlat = parseInt(v['minlat'].slice(0,-1));
      if (v['minlon'].slice(-1) == 'W') { minlon *= -1; }
      if (v['minlat'].slice(-1) == 'S') { minlat *= -1; }
      maxlon = parseInt(v['maxlon'].slice(0,-1));
      maxlat = parseInt(v['maxlat'].slice(0,-1));
      if (v['maxlon'].slice(-1) == 'W') { maxlon *= -1; }
      if (v['maxlat'].slice(-1) == 'S') { maxlat *= -1; }
      if (maxlon - minlon < 180) {
        lon = (maxlon + minlon) / 2.0;
      } else {
        lon = (maxlon - minlon) / 2.0;
      }
      if (maxlat - minlat < 180) {
        lat = (maxlat + minlat) / 2.0;
      } else {
        lat = (maxlat - minlat) / 2.0;
      }
      point = self.create_pie_chart(new GLatLng(lat, lon), v['frequency'], v['pop_name']);
      map.addOverlay(point);
    });
  },
  
  create_pie_chart: function(marker_loc, frequency, pop_name) {
    pie_chart = new GIcon(G_DEFAULT_ICON);
    other_freq = 1.0 - frequency;
    pie_chart.iconSize = new GSize(30, 30);
    pie_chart.shadowSize = new GSize(0, 0);
    pie_chart.image = 'https://chart.googleapis.com/chart?cht=p&chd=t:' + frequency + ',' + other_freq + '&chs=100x100&chco=071871|A30008&chf=bg,s,00000000'
    var marker = new GMarker(marker_loc, { icon:pie_chart });
  
    GEvent.addListener(marker, "click", function() {
      marker.openInfoWindowHtml(pop_name);
    });
    return marker;
  },
  
  click_delete_snps: function(event) {
    if (window.App.check_all() == false) return;
    
    var dbsnps = filter_identifiers(
      $('#delete-snps-textarea').val().split('\n')
    );
    var self = this;
    user = get_user();
    $.each(dbsnps, function(i, v) {
      if (user.lookup(v) != undefined){
        var print_snp = user.blank_extended_snp(v);
        print_snp['imputed_from'] = 'DELETED';
        print_snp['genotype'] = 'Was: ' + user.lookup(v).genotype;
        $('#lookup-snps-table').append(
          _.template(self.lookup_snp_template, print_snp)
        );
        user.delete_snp(v);
      }
    });
    $('#lookup-snps-table').show();
    $('.submit > div').show();
  },
  
  // Clear general lookup table or exercise-specific one.
  click_clear_snps: function(event) {
    $('#table-options').hide();
    clear_table('lookup-snps-table');
    $('#bed-file-text').empty();
    $('#bed-file-text').append('track name=myGenome description="Personal Genotype" visibility=3 itemRgb="On"\n');
    $('.submit > div').hide();
  },
  
  click_lookup_snps: function(event) {
    if (window.App.check_all() == false) return;
    $('#looking-up').dialog('open');
    $('#table-options').show();
    var self = this;
    var dbsnps = filter_identifiers(
      $('#lookup-snps-textarea').val().split('\n')
    );
    get_user().lookup_snps(self.get_more_info, {}, dbsnps, {});
  },
  
  get_more_info: function(args, all_dbsnps, extended_dbsnps) {
    get_user().get_reference_alleles(this.get_map_strings, {}, all_dbsnps, extended_dbsnps);
  },
  
  get_map_strings: function(args, all_dbsnps, extended_dbsnps) {
    var self = this;
    $.get(
      '/get_snps_on_map/', {
        dbsnps: all_dbsnps.join(',')
      }, function(response){
        $.each(response, function(i, v){
          extended_dbsnps[i]['map'] = (v != 0) ? "<button class='map-snp' type='submit'>Map</button>" : '';
        });
        return self.print_snps(args, all_dbsnps, extended_dbsnps);
      }
    );
  },
  
  print_snps: function(args, all_dbsnps, snps_to_print) {
    var self = this;
    $.each(all_dbsnps, function(i, v) {
      var output_snp = snps_to_print[v];
      _.extend(output_snp, args[v]);
      if (output_snp['imputed_from'] != ''){
        output_snp['explain'] = self.explain_string();
      }
      $('#lookup-snps-table > tbody').append(_.template(self.lookup_snp_template, output_snp));
      $('#bed-file-text').append(_.template(self.bed_file_template, output_snp));
    });
    $('.map-snp').button();
    $('#looking-up').dialog('close');
    $('#imputing-lots').dialog('close');
    $('#table-options').show();
    $('#lookup-snps-table').show();
    $('#lookup-snps-table').trigger('update');
  },
  
  explain_string: function() {
    return "<button class='explain-snp' type='submit'>Explain</button>";
  },
  
  toggle_unknown_genotypes: function() {
    $('.results-table:visible td:nth-child(2):contains("??")').parent().toggle();
    if ($('.results-table:visible tr:hidden').length != 0)
      $('#toggle-unknown-genotypes').button('option', 'label', 'Show unknown genotypes');
    else 
      $('#toggle-unknown-genotypes').button('option', 'label', 'Hide unknown genotypes');
  }
  
  });
});
