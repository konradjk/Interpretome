//Needs sylvester and highcharts libraries
$(function() {
window.PCAView = Backbone.View.extend({
  el: $('#pca'),
  has_loaded: false,
  pc1: 0,
  pc2: 0,

  events: {
    'click #compute-pca': 'click_compute_pca',
    //'click #submit-coordinates': 'click_submit',
    'change #pca_source': 'change_pop'
  },

  initialize: function() {
    _.bindAll(this, 
      'click_compute_pca',
      'got_pca_params', 'change_pop',
      'loaded'
      //'click_submit', 'click_confirm_submit'
    );
  },
  
  render: function() {
    $.get('/media/template/pca.html', this.loaded);
  },
    
  loaded: function(response) {
	  this.el.append(response);
	  
	  this.el.find('button').button();
	  this.el.find('.help > div').show();
    this.el.find('#pca_source').buttonset();
    this.el.find('#pca_level').hide();
    this.el.find('#pca_level').buttonset();
    this.el.find('#pca_resolution').buttonset();
    
    this.el.find('#popres_resolution').buttonset();
    this.el.find('#popres_resolution').hide();
    this.el.find('#popres_level').buttonset();
    this.el.find('#popres_level').hide();
    
    this.el.find('#khoisan_resolution').buttonset();
    this.el.find('#khoisan_resolution').hide();
    
    $('#looking-up').dialog({modal: true, resizable: false, autoOpen:false});
	  
    this.el.find('.submit > div').hide();
    
	  match_style(this.el);
	  this.pca_snp_template = $('#pca-snp-template').html();
	  this.has_loaded = true;
  },
  
  change_pop: function(event) {
    if ($('#pca_source label[aria-pressed="true"]').attr('for').split(/\_/g)[1] == 'all') {
      this.el.find('#pca_level').hide();
    } else {
      this.el.find('#pca_level').show();
    }
    this.el.find('#popres_resolution').hide();
    this.el.find('#khoisan_resolution').hide();
    this.el.find('#pca_resolution').hide();
    this.el.find('#popres_level').hide();
    if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'popres_all') {
      this.el.find('#popres_resolution').show();
      this.el.find('#popres_level').show();
    } else if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'khoisan_all') {
      this.el.find('#khoisan_resolution').show();
      this.el.find('#khoisan_level').show();
    } else {
      this.el.find('#pca_resolution').show();
    }
  },
  
  click_compute_pca: function(event) {
    if (window.App.check_genome() == false) return;
    $('#looking-up').dialog('open');
    var source = $('#pca_source label[aria-pressed="true"]').attr('for');
    var level = $('#pca_level label[aria-pressed="true"]').attr('for');
    if (source == 'popres_all') {
      var resolution = $('#popres_resolution label[aria-pressed="true"]').attr('for');
      var level = $('#popres_level label[aria-pressed="true"]').attr('for').replace('popres_','');
    } else if (source == 'khoisan_all') {
      var resolution = $('#khoisan_resolution label[aria-pressed="true"]').attr('for');
    } else {
      var resolution = $('#pca_resolution label[aria-pressed="true"]').attr('for');
    }
    axis1 = this.el.find('#pcx-axis option:selected').val();
    axis2 = this.el.find('#pcy-axis option:selected').val();
    
    setTimeout($.get('/pca/get_pca_parameters/', {numsnps: resolution, source: source, level: level, axis1: axis1, axis2: axis2}, this.got_pca_params), 0);
  },
  
  got_pca_params: function(response) {
    var pc1 = 0;
    var pc2 = 0;
    user = get_user();
    $.each(response['snp_ids'], function(i, v) {
      genotype_count = 2;
      if (user.lookup(v) != undefined) {
        genotype_count = count_genotype(user.lookup(v).genotype, response['reference_alleles'][v]);
      }
      pc1 += genotype_count*response['loadings'][0][i];
      pc2 += genotype_count*response['loadings'][1][i];
    });
    
    $('#looking-up').dialog('close');
    this.pc1 = pc1;
    this.pc2 = pc2;
    var user = window.App.user;
    legend = { layout: 'vertical', align: 'left', verticalAlign: 'top', x: 0, y: 70, floating: false, backgroundColor: '#FFFFFF', borderWidth: 1 };
    my_color = 'rgba(255, 0, 0, 1)';
    if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'popres_all') {
      legend = { verticalAlign: 'bottom', y: -20, floating: false, backgroundColor: '#FFFFFF', borderWidth: 1 }
      if ($('#popres_level label[aria-pressed="true"]').attr('for') == 'popres_2') {
        my_color = 'rgba(0, 0, 0, 1)';
      }
    }
    
    series_data = response['series'];
    series_data.push({ name: 'You', color: my_color, marker: { symbol: 'square', radius: 8 }, data: [[pc1, pc2]]});
    
    xnum = this.el.find('#pcx-axis option:selected').val();
    ynum = this.el.find('#pcy-axis option:selected').val();
    
    chart = new Highcharts.Chart({
    chart: {
         renderTo: 'pca-plot', 
         defaultSeriesType: 'scatter',
         zoomType: 'xy'
      },
      title: { text: 'Loadings plot of first two principal components' },
      subtitle: { text: 'Source: ' + $.trim($('#pca_source label[aria-pressed="true"]').attr('innerText')) },
      xAxis: {
         title: { enabled: true, text: 'PC' + xnum + ' (' + (response['variances']['pc' + xnum]*100).toFixed(2) + '%)'
         },
         startOnTick: true,
         endOnTick: true,
         showLastLabel: true
      },
      yAxis: { title: { text: 'PC' + ynum + ' (' + (response['variances']['pc' + ynum]*100).toFixed(2) + '%)' } },
      tooltip: { formatter: function() { return this.series.name; } },
      legend: legend,
      plotOptions: {
         scatter: {
            marker: {
              radius: 5,
              states: {
                hover: {
                  enabled: true,
                  lineColor: 'rgb(100,100,100)'
                }
              }
            },
            states: { hover: { marker: { enabled: false } } }
         }
      },
      series: series_data
    });
    this.el.find('.submit > div').show();
  },
  
  //click_submit: function(event) {
  //  var self = this;
  //  $('#confirm-submit-coordinates').dialog({
  //    modal: true, resizable: false, buttons: {
  //      'Confirm' : function() {
  //        self.click_confirm_submit();
  //        $(this).dialog('close');
  //      },
  //      'Cancel': function() {$(this).dialog('close');}
  //    }
  //  });
  //},
  //
  //click_confirm_submit: function(event) {
  //  var source = $('#pca_source label[aria-pressed="true"]').attr('for');
  //  var resolution = $('#pca_resolution label[aria-pressed="true"]').attr('for');
  //  if (source == 'hgdp_all' && resolution == 100000) {
  //    var coordinates = [this.pc1, this.pc2];
  //    $.get( '/submit/submit_coordinates/', { coordinates: coordinates.join(',') }, check_submission);
  //  }
  //}
});
});
