def flip_allele(base):
  flip = {
    'A' : 'T',
    'T' : 'A',
    'G' : 'C',
    'C' : 'G'
  }
  return flip[base.upper()]

def printlog(s):
  logfile = open('/Users/gene210-admin/interpretome/log.txt', 'a')
  logfile.write(str(s) + '\n')
  logfile.close()

def get_individuals(cursor, rsid, population):
  query = '''
    SELECT *
    FROM var_hapmap.hapmap_phased_%s 
    WHERE dbSNP = %s;
  ''' % (population, rsid)
  cursor.execute(query)
  result = cursor.fetchone()
  if result is not None:
    del result['dbSNP']
    del result['position']
  return result

def get_best_phases(query_snp_hash, anchor_snp_hash):
  anchor_snp_options = []
  query_snp_options = []
  for anchor_allele in anchor_snp_hash.values():
    anchor_snp_options.append(anchor_allele)
  for query_allele in query_snp_hash.values():
    query_snp_options.append(query_allele)
  
  if len(list(set(anchor_snp_options))) == 1 or len(list(set(query_snp_options))) == 1:
    phase_output = {}
    phase_output['total'] = len(anchor_snp_options)
    phase_output[list(set(anchor_snp_options))[0]] = list(set(query_snp_options))[0]
    phase_output['best'] = len(anchor_snp_options)
    return phase_output
  
  anchor_snp_option_1, anchor_snp_option_2 = list(set(anchor_snp_options))
  query_snp_option_1, query_snp_option_2 = list(set(query_snp_options))
  phase_1 = 0
  phase_2 = 0
  for individual, anchor_allele in anchor_snp_hash.items():
    query_allele = query_snp_hash[individual]
    if anchor_allele == anchor_snp_option_1:
      if query_allele == query_snp_option_1:
        phase_1 += 1
      else:
        phase_2 += 1
    else:
      if query_allele == query_snp_option_2:
        phase_1 += 1
      else:
        phase_2 += 1
  phase_output = {}
  phase_output['total'] = phase_1 + phase_2
  if phase_1 >= phase_2:
    phase_output[anchor_snp_option_1] = query_snp_option_1
    phase_output[anchor_snp_option_2] = query_snp_option_2
    phase_output['best'] = phase_1
  else:
    phase_output[anchor_snp_option_1] = query_snp_option_2
    phase_output[anchor_snp_option_2] = query_snp_option_1
    phase_output['best'] = phase_2
  return phase_output

def create_multi_snp_dict(snps):
  result = {}
  for snp in snps:
    if snp['dbsnp'] in result:
      result[snp['dbsnp']].append(snp)
    else:
      result[snp['dbsnp']] = [snp]
  return result

def create_snp_dict(snps):
	return dict((str(snp['dbsnp']).replace('rs', ''), snp) for snp in snps)

def check_float(input_float):
  try:
    return float(input_float)
  except Exception:
    return None
  
def check_int(input_int):
  try:
    return int(input_int)
  except Exception:
    return None

def sanitize(string):
  return string.replace("'","").replace('"',"").replace(";","").replace(')',"").replace("(","")

def check_dbsnp_array(dbsnp_array):
  try:
    return [int(element) for element in dbsnp_array.split(',')]
  except Exception:
    return None

def check_population(population):
  if population in (
    'CEU', 'YRI', 'CHB', 'JPT',
    'ASW', 'CHD', 'GIH',
    'LWK', 'MKK', 'MEX', 'TSI'
    ):
    return population
  else:
    return None

def check_source(source):
  if source in (
    'hapmap2', 'hapmap3',
    'hapmap23'
  ):
    return source
  else:
    return None
  
def check_resolution(input):
  if input in ('v2', 'v3'):
    return input
  else:
    return None
  

def check_pc(pc):
  options = ['PC' + str(opt) for opt in range(1,11)]
  if pc in options:
    return pc
  else:
    return None
  
def check_pca_source(source):
  if source in (
    'popres_all',
    'hgdp_asian',
    'hgdp_european',
    'hgdp_african',
    'hgdp_all',
    'hapmap_all',
    'khoisan_all',
    'behar_all'
  ):
    return source
  else:
    return None