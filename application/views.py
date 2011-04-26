# Create your views here.


from django import http
from django.db import connections
from django.utils import simplejson
from django import shortcuts
import random

import MySQLdb.cursors
import helpers
from django.db.backends.mysql import base
def printlog(s):
  logfile = open('/Users/gene210-admin/interpretome/log.txt', 'a')
  logfile.write(str(s) + '\n')
  logfile.close()

def dict_cursor(self):
  cursor = self._cursor()
  cursor.close()
  return base.CursorWrapper(self.connection.cursor(MySQLdb.cursors.DictCursor))
base.DatabaseWrapper.dict_cursor = dict_cursor

def linked(request):
  dbsnp_request = request.GET.get('dbsnps', None)
  population = request.GET.get('population', None)
  if dbsnp_request is None or population is None:
    return http.HttpResponseBadRequest()
  
  dbsnps = [int(element) for element in dbsnp_request.split(',')]
  cursor = connections['default'].dict_cursor()
  
  results = {}
  for dbsnp in dbsnps:
    query = '''
      SELECT *
      FROM var_hapmap.hapmap_phased_%s 
      WHERE dbSNP = %s;
    ''' % (population, dbsnp)
    
    cursor.execute(query)
    hapmap_result = cursor.fetchone()
    
    query = '''
      SELECT dbSNP1, dbSNP2, R_square 
      FROM var_ld_data.ld_%s 
      WHERE dbSNP1 = %d OR dbSNP2 = %d
      ORDER BY R_square DESC;
    ''' % (population, dbsnp, dbsnp)
    
    cursor.execute(query)
    raw_result = cursor.fetchall()
    
    if hapmap_result is None or raw_result is None:
      results[dbsnp] = []
      continue
    
    result = []
    for entry in raw_result:
      if entry['dbSNP1'] == dbsnp:
        other_dbsnp = entry['dbSNP2']
      else:
        other_dbsnp = entry['dbSNP1']
      query = '''
        SELECT *
        FROM var_hapmap.hapmap_phased_%s 
        WHERE dbSNP = %s;
      ''' % (population, other_dbsnp)
      cursor.execute(query)
      if cursor.fetchone() is not None:
        result.append(entry)
      
    results[dbsnp] = result
  
  return http.HttpResponse(
    simplejson.dumps(results),
    mimetype = 'application/json'
  )
  
def impute(request):
  '''Impute one or more SNPs.
  
  dbsnp will be one or more dbSNP identifiers (only rsIDs), separated by commas.
  '''
  dbsnp_request = request.GET.get('dbsnps', None)
  user_dbsnp_request = request.GET.get('user_dbsnps', None)
  population = request.GET.get('population', None)
  
  if None in (dbsnp_request, population, user_dbsnp_request):
    return http.HttpResponseBadRequest()
  dbsnps = [int(element) for element in dbsnp_request.split(',')]
  user_dbsnps = [int(element) for element in user_dbsnp_request.split(',')]
  cursor = connections['default'].dict_cursor()
  
  phases = {}
  for index, dbsnp in enumerate(dbsnps):
    query_snp_in_hapmap = helpers.get_individuals(cursor, dbsnp, population)
    anchor_snp_in_hapmap = helpers.get_individuals(cursor, user_dbsnps[index], population)
    phase = helpers.get_best_phases(query_snp_in_hapmap, anchor_snp_in_hapmap)
    phase['user_snp'] = user_dbsnps[index]
    phases[dbsnp] = phase
  
  return http.HttpResponse(simplejson.dumps(phases), mimetype = "application/json")
  
def get_random_color():
  return 'rgba(%s,%s,%s,.5)' % (random.randint(1,254), random.randint(1,254), random.randint(1,254))

def get_pca_parameters(request):
  printlog('Enter')
  numsnps_request = request.GET.get('numsnps', None)
  source_request = request.GET.get('source', None)
  if None in (numsnps_request, source_request):
    return http.HttpResponseBadRequest()
  numsnps = numsnps_request
  source = source_request
  source = 'hgdp'
  query = '''
    SELECT rsid, pc1, pc2 FROM pca.%s_components limit %s
  ''' % (source, numsnps)
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  loadings = cursor.fetchall()
  query = '''
    SELECT sample_id, pcp1, pcp2, Level1_label AS population  FROM pca.%{source}s_projections, pca.%{source}s_poplabels 
     WHERE pca.%{source}s_projections.sample_id= pca.%{source}s_poplabels.id
  ''' % {source: source}
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  projections = cursor.fetchall()
  query = '''
    SELECT pca.%{source}s_components.rsid, dbsnp.ucsc_snp130.refncbi AS ref_allele FROM dbsnp.ucsc_snp130, pca.%{source}s_components
    WHERE pca.%{source}s_components.rsid=dbsnp.ucsc_snp130.rsid limit %{numsnps}s
  ''' % {source: source, numsnps: numsnps}
  
  cursor.execute(query)
  refs = cursor.fetchall()
  query = '''
    SELECT DISTINCT Level1_label FROM pca.%{source}s_poplabels
  ''' % {source: source}
  
  cursor.execute(query)
  populations = [x.values()[0] for x in cursor.fetchall()]
  params = {}
  params['snp_ids'] = [0]*len(loadings)
  params['reference_alleles'] = []
  params['sample_ids'] = []
  pop_dict = {}
  pc1 = [0]*len(loadings)
  pc2 = [0]*len(loadings)
  for i, entry in enumerate(loadings):
    params['snp_ids'][i] = entry['rsid']
    pc1[i] = entry['pc1']
    pc2[i] = entry['pc2']
  params['loadings'] = [pc1, pc2]
  for entry in refs:
    params['reference_alleles'].append(entry['ref_allele'])
  for population in populations:
    pop_dict[population] = {}
    pop_dict[population]['name'] = population
    pop_dict[population]['color'] = get_random_color()
    pop_dict[population]['data'] = []
  for entry in projections:
    params['sample_ids'].append(entry['sample_id'])
    pop_dict[entry['population']]['data'].append([entry['pcp1'],entry['pcp2']])
  params['series'] = pop_dict.values()
  printlog('Done')
  return http.HttpResponse(simplejson.dumps(params), mimetype = "application/json")

def get_diabetes_snps(request):
  query = '''
    SELECT * FROM var_disease_snp.diabetes
  '''
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  snps = cursor.fetchall()
  return http.HttpResponse(simplejson.dumps(snps), mimetype = "application/json")

def get_height_snps(request):
  query = '''
    SELECT rsid, min(p_value), risk_allele, effect_size_cm FROM exercises.height
    GROUP BY rsid
    ORDER BY p_value ASC
  '''
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  output = {}
  for entry in cursor.fetchall():
    output[entry['rsid']] = entry
  return http.HttpResponse(simplejson.dumps(output), mimetype = "application/json")

def get_allele_frequencies(request):
  dbsnp_request = request.GET.get('snps', None)
  population = request.GET.get('population', None)
  dbsnps = dbsnp_request.split(',')
  frequencies = {}
  for dbsnp in dbsnps:
    query = '''
      SELECT refallele, refallele_freq, otherallele, otherallele_freq FROM var_hapmap.allele_freqs_%s
      WHERE rsid=%s
    ''' % (population, dbsnp)
    cursor = connections['default'].dict_cursor()
    cursor.execute(query)
    data = cursor.fetchone()
    frequencies[dbsnp] = data
  return http.HttpResponse(simplejson.dumps(frequencies), mimetype = "application/json")

def get_reference_alleles(request):
  dbsnp_request = request.GET.get('snps', None)
  references = {}
  if dbsnp_request in (None, ""):
    return http.HttpResponseBadRequest()
  dbsnps = dbsnp_request.split(',')
  
  for dbsnp in dbsnps:
    query = '''
      SELECT strand, refncbi FROM dbsnp.ucsc_snp130
      WHERE rsid=%s
    ''' % (dbsnp)
    cursor = connections['default'].dict_cursor()
    cursor.execute(query)
    data = cursor.fetchone()
    if data is not None:
      references[dbsnp] = data['refncbi']
  return http.HttpResponse(simplejson.dumps(references), mimetype = "application/json")

def get_chrom_pos(request):
  dbsnp_request = request.GET.get('snps', None)
  dbsnps = dbsnp_request.split(',')
  info = {}
  for dbsnp in dbsnps:
    query = '''
      SELECT chrom, chromstart, chromend FROM dbsnp.ucsc_snp130
      WHERE rsid=%s
    ''' % (dbsnp)
    cursor = connections['default'].dict_cursor()
    cursor.execute(query)
    data = cursor.fetchone()
    info[dbsnp] = data
  return http.HttpResponse(simplejson.dumps(info), mimetype = "application/json")

def submit_snps(request):
  dbsnp_request = request.GET.get('dbsnps', None)
  genotype_request = request.GET.get('genotypes', None)
  
  if None in (dbsnp_request, genotype_request) or "" in (dbsnp_request, genotype_request):
    return http.HttpResponse(simplejson.dumps(None), mimetype = "application/json")
  
  dbsnps = [int(element) for element in dbsnp_request.split(',')]
  genotypes = genotype_request.split(',')
  
  cursor = connections['default'].dict_cursor()
  for index, dbsnp in enumerate(dbsnps):
    query = '''
      INSERT INTO exercises.class (submit_time, dbsnp, genotype) VALUES (NOW(), %s, "%s")
    ''' % (dbsnp, genotypes[index])
    cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(dbsnps), mimetype = "application/json")
  
def submit_gwas_snps(request):
  
  if None in request.GET.values() or "" in request.GET.values():
    return http.HttpResponse(simplejson.dumps(request.GET), mimetype = "application/json")
  
  cursor = connections['default'].dict_cursor()
  query = '''
    INSERT INTO exercises.class_gwas (submit_time, `%s`) VALUES (NOW(), '%s')
  ''' % ('`,`'.join(request.GET.keys()), "','".join(request.GET.values()))
  
  cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(query), mimetype = "application/json")

def submit(request):
  request_dict = request.GET.copy()
  try:
	  exercise = request_dict.pop('exercise')[0]
  except KeyError:
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  query = '''
    INSERT INTO exercises.%s (submit_time, `%s`) VALUES (NOW(), '%s')
  ''' % (exercise, '`,`'.join(request_dict.keys()), "','".join(request_dict.values()))
  cursor.execute(query)
  return http.HttpResponse()
  
def submit_doses(request):
  dose_request = request.GET.get('doses', None)
  
  if dose_request is None or dose_request == '':
    return http.HttpResponse(simplejson.dumps(None), mimetype = "application/json")
  
  cursor = connections['default'].dict_cursor()
  query = '''
    INSERT INTO exercises.class_warfarin (submit_time, clinical, genetic, extended) VALUES (NOW(), %s)
  ''' % (dose_request)
  cursor.execute(query)
  
  return http.HttpResponse(simplejson.dumps(dose_request), mimetype = "application/json")

def exercise(request):
  '''Get SNP data for an exercise.'''
  
  exercises = ('cad', 'ancestry', 'longevity', 'diabetes', 'pgx')
  exercise = request.GET.get('exercise', None)
  if exercise is None or exercise not in exercises:
    return http.HttpResponseBadRequest()
  
  cursor = connections['default'].dict_cursor()
  
  if exercise == 'cad':
	  query = '''
	    SELECT dbsnp, genes, risk_allele, risk_frequency, combined_or, combined_p 
	    FROM exercises.cad;'''
  elif exercise == 'ancestry':
    query = 'SELECT dbsnp, euro_allele, azn_allele FROM exercises.ancestry'
  elif exercise == 'longevity':
    query = 'SELECT * FROM exercises.longevity ORDER BY log10_bf DESC;'
  elif exercise == 'pgx':
    query = 'SELECT dbsnp, gene, risk_allele, risk_info FROM exercises.pgx;'
  
  cursor.execute(query)
  snps = helpers.create_snp_dict(cursor.fetchall())
  return http.HttpResponse(
    simplejson.dumps(snps), mimetype = 'application/json'
	)
  
def diabetes(request):
  population = request.GET.get('population', None)
  if population is None:
    return http.HttpResponseBadRequest()
  
  cursor = connections['default'].dict_cursor()
  query = '''
    SELECT dbsnp, genotype, LR FROM exercises.diabetes_with_sizes
    WHERE pop_hapmap3 = '%s'
    GROUP BY dbsnp ORDER BY SUBSTRING_INDEX(cases, ' ', 1) + 0 DESC;''' % population
  cursor.execute(query)
  all_snps = cursor.fetchall()
  snps = helpers.create_multi_snp_dict(all_snps)
  order_snps = []
  for snp in all_snps:
    order_snps.append(snp['dbsnp'])
  output = {'snps': snps, 'dbsnps': order_snps}
  return http.HttpResponse(
    simplejson.dumps(output), mimetype = 'application/json'
  )

def longevity(request):
  cursor = connections['default'].dict_cursor()
  query = 'SELECT * FROM exercises.longevity ORDER BY log10_bf DESC;'
  cursor.execute(query)
  result = cursor.fetchall()
  snps = {'snps': helpers.create_snp_dict(result)}
  snps['sorted_dbsnps'] = [e['dbsnp'] for e in result]
  
  return http.HttpResponse(
    simplejson.dumps(snps), mimetype = 'application/json'
  )
  
def get_individuals(request):
  numsnps = request.GET.get('numsnps', None)
  if numsnps is None:
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  query = '''
    SELECT * FROM public_genomes.similarity_rsids LIMIT %s;
  ''' % (numsnps)
  cursor.execute(query)
  output = cursor.fetchall()
  return http.HttpResponse(simplejson.dumps(output), mimetype = 'application/json')
  
def index(request):
  return shortcuts.render_to_response('application/interpretome.html', {})
