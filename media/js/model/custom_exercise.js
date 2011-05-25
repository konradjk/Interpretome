function CustomExercise() {
  this.snps = {};
  this.head = [];
  this.comments = '';

  initialize = function() {
    _.bindAll(this,
      'pars_exercise_snps', 'add_snps'
    );
  }

  this.set_counter = function(percent, snps){
    $('#parsing-bar').progressbar('option', 'value', percent);
    $('#parsing-bar > div').css('opacity', percent/100);
    document.getElementById('snps-loaded').innerHTML = snps;
  }

  this.add_snps = function(lines, exercise, percent, snps) {
    exercise.set_counter(percent, snps);
    var regex = new RegExp(/^rs/);
    for (i in lines){
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line == '') continue;
      
      var tokens = _.map(line.split('\t'), $.trim);
      var snp = parseInt(tokens[0].replace(regex, ''));
      
      exercise.snps[snp] = {};
      for (var j=1; j<tokens.length; j++){
        exercise.snps[snp][exercise.head[j]] = tokens[j];
      }
    }
    if (percent == 100){
      $('#loading-dialog').dialog('close');
    }
  }

  this.parse_exercise_snps = function(lines) {
    var i = 0;
    while (true) {
      if (!lines[i].indexOf('#') == 0)
	break;
      this.comments += lines[i].replace('#', '');
      i += 1;
    }
    this.head = _.map(lines[i].split('\t'), $.trim); 
    data_lines = lines.slice(i + 1, lines.length);
    var chunks = 100;
    var chunk_size = data_lines.length/chunks;
    for (var j=0; j<=chunks; j++) {
      snps = add_commas(parseInt(j*chunk_size));
      output = data_lines.slice(chunk_size*(j), chunk_size*(j+1))
      //if (!$('#full-genome').attr('checked')) {
      setTimeout(this.add_snps, 0, output, this, j, snps);
      //} else {
      //  setTimeout(this.add_vcf_snps, 0, output, this, j, snps);
      //}
    }
  }
}

