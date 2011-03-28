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