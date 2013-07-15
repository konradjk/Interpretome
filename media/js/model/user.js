function User(username) {
  this.username = username;
	this.population = null;
	this.snps = {};
  
  this.age = null;
  this.height = null;
  this.weight = null;
  this.race = null;
  this.enzyme = null;
  this.amiodarone = null;
  
  this.sex = null;

  this.full_genome = false;
  
  this.no_genotype_string = '??';
  
  this.ld_cutoff = 0.7;
  
  initialize = function() {
    _.bindAll(this,
      'add_genotype_snps', 'add_vcf_snps',
      'add_genotype_snps_sql',// 'add_vcf_snps_sql',
      'parse_genome'
    );
  }
  
  this.set_counter = function(percent, snps){
    $('#parsing-bar').progressbar('option', 'value', percent);
    $('#parsing-bar > div').css('opacity', percent/100);
    document.getElementById('snps-loaded').innerHTML = snps;
  }
  
  this.add_genotype_snps = function(lines, user, percent, snps) {
    user.set_counter(percent, snps);
    var regex = new RegExp(/^rs/);
    for (i in lines){
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line == '') continue;
      
      var tokens = _.map(line.split(/\s+/), $.trim);
      var dbsnp = parseInt(tokens[0].replace(regex, ''));
      
      user.snps[dbsnp] = {genotype: tokens[3]};
    }
    if (percent == 100){
      $('#loading-genome').dialog('close');
    }
  }
  
  this.add_genotype_snps_sql = function(lines, user, percent, snps) {
    var self = this;
    user.set_counter(percent, snps);
    var regex = new RegExp(/^rs/);
    for (i in lines){
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line == '') continue;
      
      var tokens = _.map(line.split(/\s+/), $.trim);
      var dbsnp = parseInt(tokens[0].replace(regex, ''));
      
      window.App.user_db.transaction(function(tx) {
        tx.executeSql("INSERT INTO ? (?, ?);", [self.username, dbsnp, tokens[3]]);
      });
      user.snps[dbsnp] = {genotype: tokens[3]};
    }
    if (percent == 100){
      $('#loading-genome').dialog('close');
    }
  }
  
  this.add_cgi_snps = function(lines, user, percent, snps) {
    user.set_counter(percent, snps);
    var regex = new RegExp(/^rs/);
    for (i in lines) {
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line.indexOf('>') == 0 || line == '') continue;
      
      var tokens = _.map(line.split(/\s/), $.trim);
      var dbsnp = parseInt(tokens[0].replace(regex, ''));
      
      user.snps[dbsnp] = {genotype: tokens[1] + tokens[2]};
    }
    if (percent == 100){
      $('#loading-genome').dialog('close');
    }
  }
  
  this.add_vcf_snps = function(lines, user, percent, snps) {
    user.set_counter(percent, snps);
    var regex = new RegExp(/^rs/);
    for (i in lines) {
      line = $.trim(lines[i]);
      if (line.indexOf('#') == 0 || line.indexOf('>') == 0 || line == '') continue;
      
      var tokens = _.map(line.split(/\s+/), $.trim);
      var dbsnp = parseInt(tokens[2].replace(regex, ''));
      
      options = {'0': tokens[3], '1' : tokens[4]};
      raw_genotypes = tokens[9].split(':')[0].split(/[\|\\\/]/);
      genotype = options[raw_genotypes[0]] + options[raw_genotypes[1]];
      

      localStorage[dbsnp] = genotype;
      //user.snps[dbsnp] = {genotype: genotype};
    }
    if (percent == 100){
      $('#loading-genome').dialog('close');
    }
  }
  
  this.parse_genome = function(file_blob, extension) {
    lines = file_blob.split('\n');
    var chunks = 100;
    var chunk_size = lines.length/chunks;
    
    for (var j=0; j<=chunks; j++) {
      snps = add_commas(parseInt(j*chunk_size));
      output = lines.slice(chunk_size*(j), chunk_size*(j+1))
      if ($('#file-format option:selected').val() == 'genotype') {
        setTimeout(this.add_genotype_snps, 0, output, this, j, snps);
        //setTimeout(this.add_genotype_snps_sql, 0, output, this, j, snps);
      } else {
        setTimeout(this.add_vcf_snps, 0, output, this, j, snps);
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
  
  this.lookup_snps = function(callback, args, all_dbsnps, comments, extra_info) {
    $('#looking-up').dialog('open');
    var lookup_dbsnps = [];
    var extended_snps = {};
    var self = this;
    $.each(all_dbsnps, function(i, v) {
      extended_snps[v] = self.blank_extended_snp(v);
      if (comments != undefined && comments[v] != undefined) {
        self.set_comments(extended_snps[v], comments[v]);
      }
      
      if (self.lookup(v) == undefined) {
        self.set_no_genotype(extended_snps[v]);
        if (!self.full_genome){
          lookup_dbsnps.push(v);
        }
      } else {
        self.set_genotype(extended_snps[v], self.lookup(v).genotype);
      }
    });
    if (lookup_dbsnps.length == 0) return this.got_phases(callback, args, all_dbsnps, extended_snps, {}, extra_info);
    var self = this;
    $.post(
      '/lookup/linked/', {
        population: self.population, 
        dbsnps: lookup_dbsnps.join(','),
        ld_cutoff: get_ld_cutoff()
      }, function(response) {
        return self.got_linked(callback, args, all_dbsnps, extended_snps, response, extra_info);
      }
    );
  },
  
  this.got_linked = function(callback, args, all_dbsnps, extended_snps, response, extra_info) {
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
        
        if (self.lookup(linked_dbsnp) != undefined) {
          self.set_imputed_snp(extended_snps[v], linked_dbsnp + ' (' + self.lookup(linked_dbsnp).genotype + ')', linked_snp['R_square']);
          request_dbsnps.push(parseInt(v));
          user_dbsnps.push(linked_dbsnp);
          any = true;
        }
      });
    });
    
    if (request_dbsnps.length == 0) 
      return this.got_phases(callback, args, all_dbsnps, extended_snps, {}, extra_info);
    var self = this;
    $.post(
      '/lookup/impute/', {
        population: self.population,
        dbsnps: request_dbsnps.join(','), user_dbsnps: user_dbsnps.join(',')
      }, function(response) {
        return self.got_phases(callback, args, all_dbsnps, extended_snps, response, extra_info);
      }
    );
  },
  
  this.got_phases = function(callback, args, all_dbsnps, extended_snps, response, extra_info) {
    var self = this;
    
    imputable_genotypes = {};
    if (response != undefined){
      $.each(response, function(request_snp, info) {
        var user_snp = self.lookup(info.user_snp);
        gt1 = info[user_snp.genotype[0]];
        gt2 = info[user_snp.genotype[1]];
        if (gt1 == undefined){
          gt1 = '?';  
        }if (gt2 == undefined){
          gt2 = '?';  
        }
        self.set_genotype(extended_snps[request_snp], gt1 + gt2);
      });
    }
    $('#looking-up').dialog('close');
    if (extra_info == undefined) {
      return callback(args, all_dbsnps, extended_snps);
    } else {
      return self.get_reference_alleles(callback, args, all_dbsnps, extended_snps);
    }
    
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
            if (self.full_genome && self.no_genotype(extended_snps[i])){
              self.set_genotype(extended_snps[i], v + v);
            }
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
        population: self.population
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
  
  this.get_damaging_info = function(callback, args, all_dbsnps, extended_snps) {
    var self = this;
    $.get(
      '/lookup/get_damaging_info/', {
        snps: all_dbsnps.join()
      }, function(response) {
        $.each(response, function(i, v){
          if (v != null) {
            _.extend(extended_snps[i], v);
          }
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
  
  this.set_genotype = function(extended_snp, genotype) {
    extended_snp['genotype'] = genotype;
  },
  this.set_no_genotype = function(extended_snp) {
    extended_snp['genotype'] = this.no_genotype_string;
  },
  this.no_genotype = function(extended_snp){
    return (extended_snp['genotype'] == this.no_genotype_string);
  }
  
  this.set_comments = function(extended_snp, comments) {
    extended_snp['comments'] = comments;
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
  },
  
  this.serialize = function() {
    var serialized = {population: this.population};
    if (this.sex != undefined) serialized.sex = this.sex;
    return serialized;
  }
}
