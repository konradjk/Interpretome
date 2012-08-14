$(function() {
window.PaintingView = Backbone.View.extend({
  el: $('#painting'),
  has_loaded: false,
  all_paintings_m: [],
  all_paintings_f: [],
  all_positions: [],
  
  events: {
    'click #compute-painting': 'click_compute_painting',
    'click #submit-to-twitter' : 'click_submit_to_twitter'
  },

  initialize: function() {
    _.bindAll(this,
      'loaded', 'got_painting_params',
      'to_flip_or_not_to_flip', 'calculate_score',
      'get_best_population', 'smooth', 'find_mode',
      'init_probs', 'get_prior', 'calculate_painting',
      'assign_population', 'update_counter',
      'compute_weighted_average',
      'paint_chromosomes', 'click_submit_to_twitter',
      'paint_chromosome',
      'paint_legend',
      'smooth_positions'
    );
  },
  
  render: function() {
    $.get('/media/template/painting.html', this.loaded);
  },
    
  loaded: function(response) {
	  $(this.el).append(response);
	  $('button').button();
    $('#painting_options').buttonset();
    $('#advanced-painting').accordion({autoHeight: true, minHeight: 1000, collapsible: true, active: false});
    $('#painting-genome').dialog({modal: true, resizable: false, autoOpen: false});
    $('#painting-bar').progressbar();
    
    $('#smoothing-slider').slider({
      min: 0, max: 50, step: 5, value: 20, range: 'min',
      slide: function(event, ui) { document.getElementById('smoothing-constant').innerText = ui.value; }
    });
    document.getElementById('smoothing-constant').innerText = $("#smoothing-slider").slider("value");
    
    $('#block-size-slider').slider({
      min: 20, max: 400, step: 20, value: 100, range: 'min',
      slide: function(event, ui) {
        document.getElementById('block-size').innerText = ui.value;
        document.getElementById('block-size-bp').innerText = 3*ui.value;
      }
    });
    document.getElementById('block-size').innerText = $("#block-size-slider").slider("value");
    document.getElementById('block-size-bp').innerText = 3*$("#block-size-slider").slider("value");
    
    $('#chisq-slider').slider({
      min: 0, max: 1, step: 0.05, value: 0.25, range: 'min',
      slide: function(event, ui) { document.getElementById('chisq-value').innerText = ui.value; }
    });
    document.getElementById('chisq-value').innerText = $("#chisq-slider").slider("value");
    
    $('#heterozygosity-slider').slider({
      min: 0.5, max: 1, step: 0.05, value: 0.8, range: 'min',
      slide: function(event, ui) { document.getElementById('heterozygosity-threshold').innerText = ui.value; }
    });
    document.getElementById('heterozygosity-threshold').innerText = $("#heterozygosity-slider").slider("value");
    
    $('#bootstrap-slider').slider({
      min: 5, max: 50, step: 5, value: 10, range: 'min',
      slide: function(event, ui) { document.getElementById('bootstrap-iterations').innerText = ui.value; }
    });
    document.getElementById('bootstrap-iterations').innerText = $("#bootstrap-slider").slider("value");
    
	  match_style(this.el);
    this.has_loaded = true;
  },
  
  click_compute_painting: function(event) {
    if (window.App.check_genome() == false) return;
    this.all_painting_m = [];
    this.all_painting_f = [];
    this.all_positions = [];
    var source = $('#painting_options label[aria-pressed="true"]').attr('for');
    //var resolution = $('#painting_resolution label[aria-pressed="true"]').attr('for');
    this.update_counter(0);
    $('#painting-genome').dialog('open');
    $.get('/get_painting_params/', {
      source: source,
      resolution: 'v2',
      chisq: $("#chisq-slider").slider("value")
    }, this.got_painting_params);
  },
  
  calculate_score: function(painting_m, painting_f, best_m, best_f) {
    var score = 0;
    for (i = painting_m.length - 1; i >= 0; i--) {
      var r = 1/(painting_m.length - i + 1)
      score += (best_m == painting_m[i])*r;
      score += (best_f == painting_f[i])*r;
    }
    return score;
  },
  
  to_flip_or_not_to_flip: function(paintings_m, paintings_f, best_m, best_f) {
    score_not_flip = this.calculate_score(paintings_m, paintings_f, best_m, best_f);
    score_flip = this.calculate_score(paintings_m, paintings_f, best_f, best_m);
    if (score_flip > score_not_flip) {
      return true;
    } else {
      return false;
    }
  },
  
  get_best_population: function(array) {
    var max = 0;
    $.each(array, function(i,v) {
      if (v > max){
        index = i;
        max = v;
      }
    });
    return index;
  },
  
  init_probs: function(row, prior) {
    var probs = {};
    $.each(row, function(key, v) {
      if (key.match('_reffreq') != null) {
        probs[key.replace('_reffreq', '')] = prior;
      }
    });
    return probs;
  },
  
  get_prior: function(row) {
    total = 0;
    $.each(row, function(key, v) {
      if (key.match('_reffreq') != null) {
        total += 1;
      }
    });
    return (1/total);
  },
  
  get_all_populations: function(row) {
    pops = [];
    $.each(row, function(key, v) {
	if (key.match('_reffreq') != null) {
	  pops.push(key.replace('_reffreq',''));
	}
    });
    return pops;
  },
  
  assign_population: function(options, bootstrap) {
    var threshold = $("#heterozygosity-slider").slider("value");
    var high_threshold = threshold*bootstrap;
    var best = this.get_best_population(options);
    if (options[best] > high_threshold) {
      return [best, best];  
    } else {
      options[best] = 0;
      var second_best = this.get_best_population(options);
      return [best, second_best].sort();
    }
  },
  
  compute_weighted_average: function(v, probs) {
    var average = 0;
    $.each(v, function(key, value) {
      if (key.match('_reffreq') != null) {
        average += value*probs[key.replace('_reffreq', '')];
      }
    });
    return average;
  },
  
  calculate_painting: function(chrom, this_chrom, block_size, smoothing, bootstrap, prior, chrom_info, all_populations) {
    var self = this;
    this.update_counter(chrom);
    user = get_user();
    
    var painting_m = [];
    var painting_f = [];
    var positions = [];
    for (var i = 0; i < this_chrom.length; i += block_size) {
      var options = self.init_probs(this_chrom[0], 0);
      var snps = this_chrom.slice(i, i + block_size);
      for (var j = 0; j < bootstrap; j += 1) {
        var probs = self.init_probs(this_chrom[0], prior);
        $.each(snps, function(i, v) {
          var dbsnp = user.lookup(v['rsid']);
          if (dbsnp != undefined) {
            allele = dbsnp.genotype[Math.floor(Math.random()*2)];
            var average = self.compute_weighted_average(v, probs);
            $.each(v, function(key, value) {
              if (key.match('_reffreq') != null) {
                if (allele == v['refallele']) {
                  update = value/(average);
                } else {
                  update = (1-value)/(1-average);
                }
                probs[key.replace('_reffreq', '')] *= update;
              }
            });
          }
        });
        options[self.get_best_population(probs)]++; //omg.
      }
      results = self.assign_population(options, bootstrap);
      var start_position = this_chrom[i]['position'];
      if (i+(block_size-1) > this_chrom.length) {
        var stop_position = this_chrom[this_chrom.length-1]['position'];
      } else {
        var stop_position = this_chrom[i+(block_size-1)]['position'];
      }
      positions.push([start_position, stop_position])
      painting_m.push(results[0]);
      painting_f.push(results[1]);
    }
    smoothed_m = self.smooth(painting_m, smoothing);
    smoothed_f = self.smooth(painting_f, smoothing);
    
    this.all_painting_m.push(smoothed_m);
    this.all_painting_f.push(smoothed_f);
    this.all_positions.push(positions);
    
    this.update_counter(chrom);
    
    if (chrom == 22) {
      this.paint_chromosomes(this.all_painting_m, this.all_painting_f, this.all_positions, chrom_info, all_populations);
    }
    
    //return [smoothed_m, smoothed_f, positions];
  },
  
  update_counter: function(chrom) {
    $('#painting-bar').progressbar('option', 'value', 100*chrom/22);
    if (chrom == 0) {      
      document.getElementById('chrom-painted').innerHTML = 'Downloading';
    } else {
      document.getElementById('chrom-painted').innerHTML = 'Chromosome ' + chrom;      
    }
    $('#painting-bar > div').css('opacity', 100*chrom/22);
  },
  
  got_painting_params: function(response) {
    var block_size = $("#block-size-slider").slider("value");
    var smoothing = $("#smoothing-slider").slider("value");
    var self = this;
    var all_painting_m = [];
    var all_painting_f = [];
    var all_positions = [];
    var bootstrap = $("#bootstrap-slider").slider("value"); //wtf!?
    var chroms = response['chromosomes'];
    var prior = self.get_prior(chroms[1][0]);
    var all_populations = self.get_all_populations(chroms[1][0]);
    
    $.each(chroms, function(chrom, this_chrom) {
      setTimeout(function(chrom, this_chrom){
        self.update_counter(chrom);
        painting = self.calculate_painting(chrom, this_chrom, block_size, smoothing, bootstrap, prior, response['chrom_info'], all_populations);
        //all_painting_m.push(painting[0]);
        //all_painting_f.push(painting[1]);
        //all_positions.push(painting[2]);
      }, 0, chrom, this_chrom);
    });
    
    //this.paint_chromosomes(all_painting_m, all_painting_f, all_positions, response['chrom_info'], all_populations);
  },
  
  paint_chromosomes: function(all_painting_m, all_painting_f, all_positions, chrom_info, all_populations) {
    
    $('#painting-genome').dialog('close');
    
    var canvas = document.getElementById('canvas');
    canvas.width = canvas.width; // clear the canvas
    var large = 1; // for hi-res, switch to 5
    for (j = 0; j < all_painting_m.length; j++) {
      var painting_m = all_painting_m[j];
      var painting_f = all_painting_f[j];
      var positions = all_positions[j];
      //var positions = [];
      //var painting_m = [];
      //var painting_f = [];
      
      //$.each(flip_positions, function(i, v) {
      //  positions.push([chrom_info[j][2] - v[0], chrom_info[j][2] - v[1]]);
      //});
      //var centromere_relpos = chrom_info[j][1]; // relative to size of chromosome
      var centromere_relpos = 1.0-chrom_info[j][1]; // relative to size of chromosome
      var chrom_length = 400*large*chrom_info[j][0]; // relative size of chromosome
      var m = chrom_info[j][2]/chrom_length; // how to convert chrom pos to canvas position
      var centromere_pos = centromere_relpos*(chrom_length);
      var long_arm = centromere_pos;
      var short_arm = chrom_length - centromere_pos;
      
      var top_paint = {};
      var bot_paint = {};
      
      for (i=0; i<painting_m.length; i++) {
        top_pop = painting_m[i];
      if (!(top_pop in top_paint)) {
        top_paint[top_pop] = []
      }
      x_pos = positions[i][0]/m;
      y_pos = positions[i][1]/m;
      
      if (x_pos < long_arm & y_pos > long_arm) {
        y_pos = long_arm;
      }
      
      top_paint[top_pop].push([x_pos,y_pos]);
      
      bot_pop = painting_f[i];
      if (!(bot_pop in bot_paint)) {
        bot_paint[bot_pop] = []
      }
      bot_paint[bot_pop].push([x_pos,y_pos]);
    }
      
    var paint_coordinates = {
    'top': top_paint,
  	'bottom': bot_paint
    };
      
      if (j == 0) {
      	this.paint_legend([1, 1], paint_coordinates, all_populations);
      }
      
      this.paint_chromosome([1, j*40*large+all_populations.length*16+10], 30*large, [long_arm, short_arm], paint_coordinates, all_populations);      
    }
  },
  
  find_mode: function(populations) {
    var counts = {};
    $.each(populations, function(i, v) {
      if (!(v in counts)){
        counts[v] = 0;
      }
      counts[v] += 1;
    });
    return this.get_best_population(counts);
  },
  
  smooth: function(raw_paintings, d) {
    var smoothed = [];
    d = Math.floor(d/2);
    for (i = 0; i < raw_paintings.length; i ++) {
      if (i - d < 0) {
        start = 0;
      } else {
        start = i-d;
      }
      if (i + d > raw_paintings.length) {
        end = raw_paintings.length;
      } else {
        end = i + d;
      }
      mode = this.find_mode(raw_paintings.slice(start, end))
      smoothed.push(mode);
    }
    return smoothed;
  },
  
  smooth_positions: function(positions, d) {
    var smoothed = [];
    for (i = 0; i < positions.length; i += d) {
      if ((i+d) > positions.length) {
        smoothed.push([positions[i][0], positions[positions.length-1][1]])
      } else {
        smoothed.push([positions[i][0], positions[i+d-1][1]]);
      }
    }
    return smoothed;
  },
  
  paint_legend: function(base, paint_coordinates, all_populations) {
    var alpha = 0.7;
    var fill_colors = _.map([
        'E41A1C', '377EB8', '4DAF4A', '984EA3', 'FF7F00', 
        'FFFF33', 'A65628', 'F781BF', '491D83', '187B7B','999999'
      ], function(v) {
      return 'rgba(' + _.map(_.range(0, 6, 2), function(i) {
        return parseInt('0x' + v.slice(i, i + 2));
      }).join(', ') + ', ' + alpha + ')';
    });
    
    var canvas = document.getElementById('canvas');
    var context = canvas.getContext('2d');
    context.textBaseline = 'bottom';
    context.font = '10pt Arial';
    
    $.each(all_populations, function(i, pop) {
      context.fillStyle = fill_colors[_.indexOf(all_populations, pop)];
      context.fillRect(base[0], base[1]+i*16, 30, 14);
      context.fillText(pop.toUpperCase(), base[0] + 40, base[1]+i*17+12);
    });
    
  },
  
  // Putting this here, until we find a better place for it.
  paint_chromosome: function (base, size, arms, paint_coordinates, all_populations) {
    // define the colors
    var alpha = 0.7;
	  var fill_colors = _.map([
	    'E41A1C', '377EB8', '4DAF4A', '984EA3', 'FF7F00', 
	    'FFFF33', 'A65628', 'F781BF', '491D83', '187B7B', '999999'
	  ], function(v) {
      return 'rgba(' + _.map(_.range(0, 6, 2), function(i) {
        return parseInt('0x' + v.slice(i, i + 2));
      }).join(', ') + ', ' + alpha + ')';
    });
    var canvas = document.getElementById('canvas');

    var context = canvas.getContext('2d');
        
    context.fillStyle = 'rgba(0, 0, 0, 0.2)';
    context.strokeStyle = 'black';
    context.lineWidth = 1;
    
    // The x0 and base[1] coordinates give the top-left pixel of the chromosome, so
    // the origin of the telomere cap is shifted right and down by a single radius' length.
    var cap_radius = size / 2;
    
    var begin_x = base[0] + cap_radius;
    var begin_y = base[1] + cap_radius;
    
    var divot_width = size / 2;
    var divot_height = size / 5;
    
    var left_cap_center = [begin_x, begin_y];
    var left_cap_angles = [Math.PI / 2, 3 * Math.PI / 2];
    
    var right_cap_center = [begin_x + arms[0] + divot_width + arms[1], begin_y];
    var right_cap_angles = [3 * Math.PI / 2, Math.PI / 2];
    
    var top_divot = [
      [begin_x + arms[0], base[1]],
      [begin_x + arms[0] + divot_width / 2, base[1] + divot_height],
      [begin_x + arms[0] + divot_width, base[1]]
    ];
    
    var bottom_divot = [
      [begin_x + arms[0], base[1] + size],
      [begin_x + arms[0] + divot_width / 2, base[1] + 4 * divot_height],
      [begin_x + arms[0] + divot_width, base[1] + size]
    ];
    
    function follow_divot(divot, func) {
      $.each(divot, function(i, v) {
        context[func].apply(context, v);
      });
    }
    
    function follow_cap(cap_center, cap_angles) {
      context.arc.apply(context, cap_center.concat(cap_radius, cap_angles, false));
    }
    
    function fill_cap(cap_center, cap_angles) {
      context.moveTo.apply(context, cap_center);
      context.beginPath();
      follow_cap(cap_center, cap_angles);
      context.closePath();
      context.fill();
    }
    
    // Stroke everything.
    context.beginPath();
    follow_cap(left_cap_center, left_cap_angles);
    follow_divot(top_divot, 'lineTo');
    follow_cap(right_cap_center, right_cap_angles);
    follow_divot(bottom_divot.reverse(), 'lineTo');
    context.closePath();
    context.stroke();
    
    // Fill caps.
    fill_cap(left_cap_center, left_cap_angles);
    fill_cap(right_cap_center, right_cap_angles);
    
    // Fill divot.
    context.moveTo.apply(context, top_divot[0]);
    context.beginPath();
    $.each(top_divot.concat(bottom_divot), function(i, v) {
      context.lineTo.apply(context, v);
    });
    context.closePath();
    context.fill();
    
    
    //
    // Now, get to painting.
    //
    var y_top = base[1];
    var y_bottom = base[1] + size;
    var y_middle = (y_top + y_bottom) / 2;

    $.each(_.keys(paint_coordinates), function(i, position) {
      $.each(_.keys(paint_coordinates[position]), function(j, population) {
        $.each(paint_coordinates[position][population], function(k, coordinates) {
          //console.log('Raw coordinates: ' + coordinates);
          
          var adjusted = coordinates;
          // Coordinates all on right arm, adjust.
          if (adjusted[0] >= arms[0]) {
            adjusted = _.map(adjusted, function(v) {return v + divot_width;});
            //console.log('All coordinates on right arm, adjusted to: ' + adjusted);
          }
          
          // Coordinates should never cross centromere.
          // else if (adjusted[0] <= arms[0] && adjusted[1] >= arms[0]) {
          // 	// Coordinates cross the centromere.
          //   adjusted[1] = adjusted[1] + arms[0] + divot_width;
          //   console.log('Coordinates cross centromere, adjusted to: ' + adjusted);
          //   return;
          // }  
          
          adjusted = _.map(adjusted, function(v) {return v + begin_x;});
          //console.log('Adjusted coordinates: ' + adjusted);
          
          var stroke_begin_y = position == 'top' ? y_top : y_middle;
          var stroke_end_y = position == 'top' ? y_middle : y_bottom;
          
          var stroke_coordinates = [
            [adjusted[1], stroke_begin_y],
            [adjusted[1], stroke_end_y],
            [adjusted[0], stroke_end_y],
            [adjusted[0], stroke_begin_y]
          ];
          context.moveTo.apply(context, stroke_coordinates[3]);
          context.beginPath();
          $.each(stroke_coordinates, function(i, v) {
            context.lineTo.apply(context, v);
          });
          context.closePath();
          context.fillStyle = fill_colors[_.indexOf(all_populations, population)];
          context.fill();
        });
      });
    });
  },
  
  click_submit_to_twitter: function() {
    canvas.toDataURL();
  }
});
});
