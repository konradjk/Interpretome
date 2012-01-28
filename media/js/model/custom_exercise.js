function CustomExercise() {
  this.snps = {};
  this.head = [];
  this.comments = '';

  initialize = function() {
    _.bindAll(this,
      'parse_exercise_snps', 'add_snps'
    );
  }

  this.add_snps = function(lines) {
    var regex = new RegExp(/^rs/);
    for (i in lines){
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line == '') continue;
      
      var tokens = _.map(line.split('\t'), $.trim);
      var snp = parseInt(tokens[0].replace(regex, ''));
      
      this.snps[snp] = {};
      for (var j=1; j<tokens.length; j++){
        this.snps[snp][this.head[j]] = tokens[j];
      }
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
    this.add_snps(data_lines);
  }
}

