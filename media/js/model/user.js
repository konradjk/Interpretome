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
  
  this.sex = null;
  
  this.parseGenome = function(lines) {
    var regex = new RegExp(/^rs/);
    var cgi = false;
    if (!cgi) {
      for (i in lines) {
        line = $.trim(lines[i]);
        if (line.indexOf('#') == 0 || line == '') continue;
        
        var tokens = _.map(line.split('\t'), $.trim);
        var dbsnp = parseInt(tokens[0].replace(regex, ''));
        
        this.dbsnps.push(dbsnp);
        this.snps[dbsnp] = {genotype: tokens[3]};
      }
    } else {
      for (i in lines) {
        line = $.trim(lines[i]);
        if (line.indexOf('#') == 0 || line.indexOf('>') == 0 || line == '') continue;
        
        var tokens = _.map(line.split('\t'), $.trim);
        if (tokens[11].indexOf('no-call') > -1) continue;
        var dbsnp = parseInt(tokens[1].replace(regex, ''));
        
        this.dbsnps.push(dbsnp);
        this.snps[dbsnp] = {genotype: tokens[12] + tokens[18]};
      }
    }
  }
  
  this.delete_snp = function(dbsnp) {
    if (dbsnp in this.snps) {
      delete this.snps[dbsnp];
    } 
  }
  
  this.lookup = function(dbsnp) {
    return this.snps[dbsnp];
  }
  
  this.lookup_snps = function(callback, args, all_dbsnps, comments) {
    var lookup_dbsnps = [];
    var extended_snps = {};
    var self = this;
    $.each(all_dbsnps, function(i, v) {
      extended_snps[v] = self.blank_extended_snp(v);
      self.set_comments(extended_snps[v], comments[v]);
      
      if (window.App.user.lookup(v) == undefined) {
        lookup_dbsnps.push(v);
        self.set_genotype(extended_snps[v], 'NA');
      }else{
        self.set_genotype(extended_snps[v], window.App.user.lookup(v).genotype);
      }
    });
    
    if (lookup_dbsnps.length == 0) return this.got_phases(callback, args, all_dbsnps, extended_snps, {});
    
    var self = this;
    $.get(
      '/lookup/linked/', {
        population: window.App.user.population, 
        dbsnps: lookup_dbsnps.join(',')
      }, function(response) {
        return self.got_linked(callback, args, all_dbsnps, extended_snps, response);
      }
    );
  },
  
  this.got_linked = function(callback, args, all_dbsnps, extended_snps, response) {
    var unimputable_dbsnps = [];
    var request_dbsnps = [];
    var user_dbsnps = [];
    var self = this;
    $.each(response, function(v, i) {
      var any = false;
      $.each(i, function(k, linked_snp) {
        if (any) return;
        if (parseInt(v) != linked_snp.dbSNP1) var linked_dbsnp = linked_snp.dbSNP1; 
        else var linked_dbsnp = linked_snp.dbSNP2;
        
        if (window.App.user.lookup(linked_dbsnp) != undefined) {
          self.set_imputed_snp(extended_snps[v], linked_dbsnp + ' (' + window.App.user.lookup(linked_dbsnp).genotype + ')', linked_snp['R_square']);
          request_dbsnps.push(parseInt(v));
          user_dbsnps.push(linked_dbsnp);
          any = true;
          return;
        }
      });
    });
    
    if (request_dbsnps.length == 0) return this.got_phases(callback, args, all_dbsnps, extended_snps, {});
    var self = this;
    $.get(
      '/lookup/impute/', {
        population: window.App.user.population,
        dbsnps: request_dbsnps.join(','), user_dbsnps: user_dbsnps.join(',')
      }, function(response) {
        return self.got_phases(callback, args, all_dbsnps, extended_snps, response);
      }
    );
  },
  
  this.got_phases = function(callback, args, all_dbsnps, extended_snps, response) {
    var self = this;
    
    imputable_genotypes = {};
    if (response != undefined){
      $.each(response, function(request_snp, info) {
        var user_snp = window.App.user.lookup(info.user_snp);
        self.set_genotype(extended_snps[request_snp], info[user_snp.genotype[0]] + info[user_snp.genotype[1]]);
      });
    }
    return self.get_reference_alleles(callback, args, all_dbsnps, extended_snps);
  },
  
  this.get_reference_alleles = function(callback, args, all_dbsnps, extended_snps) {
    var self = this;
    $.get(
      '/lookup/get_reference_alleles/', {
        snps: all_dbsnps.join(',')
      }, function(response) {
        $.each(response, function(i, v){
          if (v != null) {
            self.set_reference(extended_snps[i], v);
            self.set_color(extended_snps[i]);
          }
        });
        return self.get_allele_frequencies(callback, args, all_dbsnps, extended_snps);
      }
    );
  },
  
  this.get_allele_frequencies = function(callback, args, all_dbsnps, extended_snps) {
    var self = this;
    $.get(
      '/lookup/get_allele_frequencies/', {
        snps: all_dbsnps.join(','),
        population: window.App.user.population
      }, function(response){
        $.each(response, function(i, v){
          if (v != null) self.set_allele_frequencies(extended_snps[i], v['refallele_freq'], v['otherallele'], v['otherallele_freq']);
        });
        return self.get_chrom_pos(callback, args, all_dbsnps, extended_snps);
      }
    );
  },
  
  this.get_chrom_pos = function(callback, args, all_dbsnps, extended_snps){
    var self = this;
    $.get(
      '/lookup/get_chrom_pos/', {
        snps: all_dbsnps.join(',')
      }, function(response){
        $.each(response, function(i, v){
          if (v != null) self.set_chrom_pos(extended_snps[i], v['chrom'], v['chromstart'], v['chromend']);
        });
        return callback(args, all_dbsnps, extended_snps);
      }
    );
  },
  
  this.set_chrom_pos = function(extended_snp, chrom, start, end){
    extended_snp['chrom'] = chrom;
    extended_snp['start'] = start;
    extended_snp['end'] = end;
  }
  
  this.set_allele_frequencies = function(extended_snp, refallele_freq, otherallele, otherallele_freq){
    extended_snp['refallele_freq'] = refallele_freq;
    extended_snp['otherallele'] = otherallele;
    extended_snp['otherallele_freq'] = otherallele_freq;
  },
  
  this.set_reference = function(extended_snp, reference){
    extended_snp['reference'] = reference;
  },
  
  this.set_color = function(extended_snp){
    var zygosity = count_genotype(extended_snp['genotype'], extended_snp['reference']);
    if (zygosity == 2){
      extended_snp['color'] = '1,1,1';
    }else if (zygosity == 1){
      extended_snp['color'] = '0,0,255';
    }else{
      extended_snp['color'] = '255,0,0';
    }
  },
  
  this.set_genotype = function(extended_snp, genotype){
    extended_snp['genotype'] = genotype
  },
  
  this.set_comments = function(extended_snp, comments){
    extended_snp['comments'] = comments
  },
  
  this.set_imputed_snp = function(extended_snp, imputed, r_squared){
    extended_snp['imputed_from'] = imputed;
    extended_snp['r_squared'] = r_squared;
  },
  
  this.blank_extended_snp = function(v) {
    extended_snp = {};
    extended_snp['dbsnp'] = v;
    extended_snp['genotype'] = '';
    extended_snp['imputed_from'] = '';
    extended_snp['r_squared'] = '';
    extended_snp['comments'] = '';
    extended_snp['reference'] = '';
    extended_snp['explain'] = '';
    extended_snp['refallele_freq'] = '';
    extended_snp['otherallele'] = '';
    extended_snp['otherallele_freq'] = '';
    extended_snp['chrom'] = '';
    extended_snp['start'] = '';
    extended_snp['end'] = '';
    extended_snp['color'] = '';
    return extended_snp;
  }
}
