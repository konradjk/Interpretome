function User() {
	this.population = null;
	this.dbsnps = [];
	this.chromosomes = {};
	this.snps = {};
  
  this.age = null;
  this.height = null;
  this.weight = null;
  this.race = null;
  this.enzyme = null;
  this.amiodarone = null;
	
  this.parseGenome = function(lines) {
    var regex = new RegExp(/^[a-z]+/);
    
    for (i in lines) {
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line == '') continue;
      
      var tokens = _.map(line.split('\t'), $.trim);
      var dbsnp = parseInt(tokens[0].replace(regex, ''));
      var chromosome = parseInt(tokens[1]);
      
      this.dbsnps.push(dbsnp);
      if (chromosome in this.chromosomes) this.chromosomes[chromosome]++;
      else this.chromosomes[chromosome] = 1;
        
      this.snps[dbsnp] = {chromosome: chromosome, genotype: tokens[3]};
    }
  }
  
  this.lookup = function(dbsnp) {
    return this.snps[dbsnp];
  }
}
