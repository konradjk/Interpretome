//Needs sylvester and highcharts libraries
$(function() {
window.PCAView = Backbone.View.extend({
  el: $('#pca'),
  has_loaded: false,
  pc1: 0,
  pc2: 0,
  series_data: [],
  pc1_var: 0,
  pc2_var: 0,
  rev_x: false,
  rev_y: false,

  events: {
    'click #compute-pca': 'click_compute_pca',
    //'click #submit-coordinates': 'click_submit',
    'change #pca_source': 'change_pop',
    'click #reverse-x-axis': 'reverse_x_axis',
    'click #reverse-y-axis': 'reverse_y_axis'
  },

  initialize: function() {
    _.bindAll(this, 
      'click_compute_pca', 'draw_pca_plot',
      'got_pca_params', 'change_pop',
      'loaded', 'refresh_individuals',
      'reverse_x_axis', 'reverse_y_axis'
      //'click_submit', 'click_confirm_submit'
    );
  },
  
  render: function() {
    $.get('/media/template/pca.html', this.loaded);
  },
    
  loaded: function(response) {
	  $(this.el).append(response);
	  
	  $('button').button();
	  $('.help > div').show();
    $('#pca_source').buttonset();
    $('#pca_level').hide();
    $('#pca_level').buttonset();
    $('#pca_resolution').buttonset();
    
    $('#popres_resolution').buttonset();
    $('#popres_resolution').hide();
    $('#popres_level').buttonset();
    $('#popres_level').hide();
    
    $('#khoisan_resolution').buttonset();
    $('#khoisan_resolution').hide();
    
    $('#looking-up').dialog({modal: true, resizable: false, autoOpen:false});
	  
    window.App.genome_lists.push(this.refresh_individuals);
    this.refresh_individuals();
	  match_style(this.el);
	  this.pca_snp_template = $('#pca-snp-template').html();
	  this.has_loaded = true;
  },
  
  refresh_individuals: function() {
    $('#pca-individuals').empty();
    $('#genome-analysis option').each(function(i, v) {
      var item_name = v.value;
      $('#pca-individuals').append(
        $(document.createElement("input")).attr({ type:  'checkbox', id: item_name + '-similarity', value: item_name } )
      );
      $('#pca-individuals').append(' ' + item_name + '<br/>');
    });
  },
  
  change_pop: function(event) {
    if ($('#pca_source label[aria-pressed="true"]').attr('for').split(/\_/g)[1] == 'all') {
      $('#pca_level').hide();
    } else {
      $('#pca_level').show();
    }
    $('#popres_resolution').hide();
    $('#khoisan_resolution').hide();
    $('#pca_resolution').hide();
    $('#popres_level').hide();
    if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'popres_all') {
      $('#popres_resolution').show();
      $('#popres_level').show();
    } else if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'khoisan_all') {
      $('#khoisan_resolution').show();
      $('#khoisan_level').show();
    } else {
      $('#pca_resolution').show();
    }
  },
  
  click_compute_pca: function(event) {
    if (window.App.check_genome() == false) return;
    $('#looking-up').dialog('open');
    $('#pca-chart-options').hide();
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
    axis1 = $('#pcx-axis option:selected').val();
    axis2 = $('#pcy-axis option:selected').val();
    
    setTimeout($.get('/pca/get_pca_parameters/', {numsnps: resolution, source: source, level: level, axis1: axis1, axis2: axis2}, this.got_pca_params), 0);
  },
  
  got_pca_params: function(response) {
    var self = this;
    pc1 = {};
    pc2 = {};
    pca_users = {};
    $('#pca-individuals input').each( function(i, v){
      if (v.checked) {
        pc1[v.value] = 0;
        pc2[v.value] = 0;
      }
    });
    pc1[get_user().username] = 0;
    pc2[get_user().username] = 0;
    
    $.each(response['snp_ids'], function(i, v) {
      $.each(_.keys(pc1), function(k, user){
        genotype_count = 2;
        if (window.App.users[user].lookup(v) != undefined) {
          genotype_count = count_genotype(window.App.users[user].lookup(v).genotype, response['reference_alleles'][v]);
        }
        pc1[user] += genotype_count*response['loadings'][0][i];
        pc2[user] += genotype_count*response['loadings'][1][i];
      });
    });
    
    $('#looking-up').dialog('close');
    this.user_pc1 = pc1[get_user().username];
    this.user_pc2 = pc2[get_user().username];
    
    this.series_data = response['series'];
    $.each(_.keys(pc1), function(i, user){
      if (user == get_user().username) {
        my_color = 'rgba(255, 0, 0, 1)';
      } else {
        my_color = 'rgba(' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) + ',' + Math.floor(Math.random()*255) +',.5)'
      }
      if ($('#popres_level label[aria-pressed="true"]').attr('for') == 'popres_2') {
        my_color = 'rgba(0, 0, 0, 1)';
      }
      self.series_data.push({ name: user, color: my_color, marker: { symbol: 'square', radius: 8 }, data: [[pc1[user], pc2[user]]]});
    });
    this.pc1_var = response['variances']['pc' + $('#pcx-axis option:selected').val()]*100;
    this.pc2_var = response['variances']['pc' + $('#pcy-axis option:selected').val()]*100;
    
    this.draw_pca_plot();
  },
  
  reverse_x_axis: function() {
    this.rev_x = !this.rev_x;
    this.draw_pca_plot();
  },
  
  reverse_y_axis: function() {
    this.rev_y = !this.rev_y;
    this.draw_pca_plot();
  },
  
  draw_pca_plot: function() {
    legend = { layout: 'vertical', align: 'left', verticalAlign: 'top', x: 0, y: 70, floating: false, backgroundColor: '#FFFFFF', borderWidth: 1 };
    if ($('#pca_source label[aria-pressed="true"]').attr('for') == 'popres_all') {
      legend = { verticalAlign: 'bottom', y: -20, floating: false, backgroundColor: '#FFFFFF', borderWidth: 1 }
    }
    
    xnum = $('#pcx-axis option:selected').val();
    ynum = $('#pcy-axis option:selected').val();
    
    chart = new Highcharts.Chart({
    chart: {
         renderTo: 'pca-plot', 
         defaultSeriesType: 'scatter',
         zoomType: 'xy'
      },
      title: { text: 'Loadings plot of first two principal components' },
      subtitle: { text: 'Source: ' + $.trim($('#pca_source label[aria-pressed="true"]').attr('innerText')) },
      xAxis: {
         title: { enabled: true, text: 'PC' + xnum + ' (' + (this.pc1_var).toFixed(2) + '%)'
         },
         startOnTick: true,
         endOnTick: true,
         showLastLabel: true,
         reversed: this.rev_x,
      },
      yAxis: { title: { text: 'PC' + ynum + ' (' + (this.pc2_var).toFixed(2) + '%)' }, reversed: this.rev_y },
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
      series: this.series_data
    });
    $('#pca-chart-options').show();
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
  //    var coordinates = [this.user_pc1, this.user_pc2];
  //    $.get( '/submit/submit_coordinates/', { coordinates: coordinates.join(',') }, check_submission);
  //  }
  //}
});
});
