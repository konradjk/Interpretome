# Create your views here.

from numpy import *
import pickle
from django import http
from django.db import connections
from django.utils import simplejson
from django import shortcuts
import random

import MySQLdb.cursors
import helpers
from django.db.backends.mysql import base

dbsnp_table = 'dbsnp.snp130'

def dict_cursor(self):
  cursor = self._cursor()
  cursor.close()
  return base.CursorWrapper(self.connection.cursor(MySQLdb.cursors.DictCursor))
base.DatabaseWrapper.dict_cursor = dict_cursor

def linked(request):
  dbsnps = helpers.check_dbsnp_array(request.REQUEST.get('dbsnps', None))
  population = helpers.check_population(request.REQUEST.get('population', None))
  ld_cutoff = helpers.check_float(request.REQUEST.get('ld_cutoff', None))
  
  if None in (dbsnps, population, ld_cutoff):
    return http.HttpResponseBadRequest()
  
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
      AND R_square >= %s
      ORDER BY R_square DESC;
    ''' % (population, dbsnp, dbsnp, ld_cutoff)
    
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
  
  return http.HttpResponse(simplejson.dumps(results), mimetype = 'application/json')
  
def impute(request):
  '''Impute one or more SNPs.
  
  dbsnp will be one or more dbSNP identifiers (only rsIDs), separated by commas.
  '''
  dbsnps = helpers.check_dbsnp_array(request.REQUEST.get('dbsnps', None))
  user_dbsnps = helpers.check_dbsnp_array(request.REQUEST.get('user_dbsnps', None))
  population = helpers.check_population(request.REQUEST.get('population', None))
  
  if None in (dbsnps, population, user_dbsnps):
    return http.HttpResponseBadRequest()
  
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
  numsnps_request = helpers.check_int(request.GET.get('numsnps', None))
  source_request = helpers.check_pca_source(request.GET.get('source', None))
  level_request = helpers.check_int(request.GET.get('level', None))
  x_request = helpers.check_int(request.GET.get('axis1', None))
  y_request = helpers.check_int(request.GET.get('axis2', None))
  
  if None in (numsnps_request, source_request, level_request, x_request, y_request):
    return http.HttpResponseBadRequest()
  numsnps = numsnps_request
  source = source_request
  cursor = connections['default'].dict_cursor()
  
  lab_pc1 = str(x_request)
  lab_pc2 = str(y_request)
  
  query = '''
    SELECT rsid, pc%(pc1)s, pc%(pc2)s FROM interpretome_ancestry.loadings
    WHERE listcode="%(numsnps)s" AND pop="%(source)s"
  ''' % {"pc1": lab_pc1, "pc2": lab_pc2, "source":source, "numsnps": numsnps}
  cursor.execute(query)
  loadings = cursor.fetchall()
  
  main_source = source.split('_')[0]
  sub_source = source.split('_')[1]
  
  if source == 'hgdp_all':
    level = 1
  else:
    level = level_request
  
  query = '''
    SELECT sample_id, pcp%(pc1)s, pcp%(pc2)s, Level%(level)s_label AS population, Level2_label AS population_2 FROM interpretome_ancestry.projections
    JOIN interpretome_ancestry.%(main_source)s_poplabels ON (interpretome_ancestry.projections.sample_id = interpretome_ancestry.%(main_source)s_poplabels.id)
    WHERE listcode = "%(numsnps)s" and pop = "%(source)s"
    ORDER BY population
  ''' % {"pc1": lab_pc1, "pc2": lab_pc2, "source": source, "numsnps": numsnps, "main_source": main_source, "level": level}
  cursor.execute(query)
  projections = cursor.fetchall()
  
  query = '''
    SELECT rsid, ref FROM interpretome_ancestry.%(main_source)s_snplist
    WHERE listcode = "%(numsnps)s"
  ''' % {"main_source": main_source, "numsnps": numsnps}
  cursor.execute(query)
  refs = cursor.fetchall()
  
  query = '''
    SELECT pc%(pc1)s, pc%(pc2)s FROM interpretome_ancestry.explained_vars
    WHERE pop = '%(source)s' AND listcode = "%(numsnps)s"
  ''' % {"pc1": lab_pc1, "pc2": lab_pc2, "source": source, "numsnps": numsnps}
  
  cursor.execute(query)
  variances = cursor.fetchone()
  
  if source.split('_')[1] == 'all':
    query = '''
      SELECT DISTINCT Level%(level)s_label FROM interpretome_ancestry.%(main_source)s_poplabels
      ORDER BY Level%(level)s_label
    ''' % {"level": level, "main_source": main_source}
  else:
    query = '''
      SELECT DISTINCT Level%(level)s_label, Level2_label FROM interpretome_ancestry.%(main_source)s_poplabels
      WHERE Level1_label LIKE '%%%(sub_source)s%%'
      ORDER BY Level%(level)s_label
    ''' % {"main_source": main_source, "level":level, "sub_source": sub_source}
  
  cursor.execute(query)
  
  populations = [x.values()[0] if x.values()[0] != '' else x.values()[1] for x in cursor.fetchall()]
  params = {}
  params['snp_ids'] = [0]*len(loadings)
  params['reference_alleles'] = {}
  params['sample_ids'] = []
  params['variances'] = variances
  pop_dict = {}
  pc1 = [0]*len(loadings)
  pc2 = [0]*len(loadings)
  
  for i, entry in enumerate(loadings):
    params['snp_ids'][i] = entry['rsid']
    pc1[i] = entry['pc' + lab_pc1]
    pc2[i] = entry['pc' + lab_pc2]
  params['loadings'] = [pc1, pc2]
  projmat = array(params['loadings'])
  for entry in refs:
    params['reference_alleles'][entry['rsid']] = entry['ref']
  for population in populations:
    pop_dict[population] = {}
    pop_dict[population]['name'] = population.replace('_', ' ')
    pop_dict[population]['color'] = get_random_color()
    pop_dict[population]['data'] = []
    if (source == 'popres_all' and str(level) == "2"):
      pop_dict[population]['marker'] = {};
      pop_dict[population]['marker']['symbol'] = "url(http://esquilax.stanford.edu/media/graphics/png/" + population.lower() +".png)";
    
  snp_list = [int(x['rsid']) for x in loadings]
  for i, entry in enumerate(projections):
    params['sample_ids'].append(entry['sample_id'])
    pop = entry['population']
    if pop == '':
      pop = entry['population_2']
    pop_dict[pop]['data'].append([entry['pcp' + lab_pc1],entry['pcp' + lab_pc2]])
  
  params['series'] = []
  for population in populations:
    params['series'].append(pop_dict[population])
  
  return http.HttpResponse(simplejson.dumps(params), mimetype = "application/json")

def get_polyphen_scores(request):
  cursor = connections['default'].dict_cursor()
  query = 'select dbSNP, prediction, pph2_prob from interpretome_clinical.polyphen_dbSNP'
  cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(cursor.fetchall()), mimetype = "application/json")

def get_rare_variants(request):
  population = helpers.check_population(request.GET.get('population', None))
  cutoff = helpers.check_float(request.GET.get('cutoff', None))
  if None in (population, cutoff):
    return http.HttpResponseBadRequest()
  query = '''SELECT rsid, refallele, otherallele, otherallele_freq
  FROM var_hapmap.snp_frequencies_%s
  WHERE otherallele_freq <= %s''' % (population.lower(), cutoff)
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(cursor.fetchall()), mimetype = "application/json")

def get_drug_targets(request):
  cursor = connections['default'].dict_cursor()
  query = 'select dbSNP, gene_name, name, drug_name from interpretome_clinical.drug_targets_snps'
  cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(cursor.fetchall()), mimetype = "application/json")

def get_pharmacogenomics_snps(request):
  query = 'select * from interpretome_clinical.pharmaco'
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(cursor.fetchall()), mimetype = "application/json")

def get_possible_studies(population):
  possible_studies = {
    'CEU' : ['European'],
    'YRI' : ['African'],
    'CHB' : ['Chinese'],
    'JPT' : ['Japanese']
  }
  return possible_studies[population]

def get_gwas_catalog(request):
  population = helpers.check_population(request.GET.get('population', None))
  if population is None:
    return http.HttpResponseBadRequest()
  studies = get_possible_studies(population)
  like_string = "%' or `initial_sample_size` like '%".join(studies)
  query = '''
    SELECT pubmedid, link, disease_trait, initial_sample_size, reported_genes,
    or_or_beta, strongest_snp, risk_allele, p_value
    FROM interpretome_clinical.gwas_catalog
    WHERE initial_sample_size LIKE '%%%s%%'
    ORDER BY disease_trait
  ''' % like_string
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  snps = cursor.fetchall()
  return http.HttpResponse(simplejson.dumps(snps), mimetype = "application/json")

def get_height_snps(request):
  query = '''
    SELECT rsid, min(p_value), risk_allele, effect_size_cm FROM interpretome_exercises.height
    GROUP BY rsid
    ORDER BY p_value ASC
  '''
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  output = {}
  for entry in cursor.fetchall():
    output[entry['rsid']] = entry
  return http.HttpResponse(simplejson.dumps(output), mimetype = "application/json")

def get_painting_params(request):
  source = helpers.check_source(request.GET.get('source', None))
  resolution = helpers.check_resolution(request.GET.get('resolution', None))
  chisq_cutoff = helpers.check_float(request.GET.get('chisq', None))
  if None in (source, resolution, chisq_cutoff):
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  
  info = {}
  query = '''
    SELECT * FROM interpretome_ancestry.%s_%s_frequencies
    WHERE chisq > %s
    ORDER BY chromosome, position ASC
  ''' % (source, resolution, chisq_cutoff)
  cursor.execute(query)
  chromosomes = {}
  for res in cursor.fetchall():
    if res['chromosome'] not in chromosomes:
      chromosomes[res['chromosome']] = []
    chromosomes[res['chromosome']].append(res)
  
  query = '''
    SELECT chromosome, rel_length, rel_centromere, length
    FROM interpretome_ancestry.chrom_info
    ORDER BY chromosome;
  '''
  cursor.execute(query)
  chrom_info = []
  for res in cursor.fetchall():
    chrom_info.append( [res['rel_length'], res['rel_centromere'], res['length']] )
  
  response = {'chromosomes':chromosomes, 'chrom_info':chrom_info}
  
  return http.HttpResponse(simplejson.dumps(response), mimetype = "application/json")

def get_snps_on_map(request):
  dbsnps = helpers.check_dbsnp_array(request.GET.get('dbsnps', None))
  cursor = connections['default'].dict_cursor()
  output = {}
  for dbsnp in dbsnps:
    query = 'select alfred_uid from interpretome_ancestry.alfred_variant_info where rs_number ="rs%s"' % dbsnp
    output[dbsnp] = cursor.execute(query)
  return http.HttpResponse(simplejson.dumps(output), mimetype = "application/json")

def get_hgdp_allele_frequencies(request):
  dbsnp = helpers.check_dbsnp(request.GET.get('dbsnp', None))
  ref = helpers.check_base(request.GET.get('reference', None))
  cursor = connections['default'].dict_cursor()
  query = 'select alfred_uid from interpretome_ancestry.alfred_variant_info where rs_number ="rs%s"' % dbsnp
  cursor.execute(query)
  uid = cursor.fetchone()
  if uid is None:
    return http.HttpResponseBadRequest()
  query = 'select site_name from interpretome_ancestry.alfred_polymorphism where site_uid ="%s"' % uid['alfred_uid']
  cursor.execute(query)
  site_name = cursor.fetchone()['site_name'].replace('/', '')
  if site_name is None:
    return http.HttpResponseBadRequest()
  query = 'select strand from ucsc_snp130 where rsid=%s' % dbsnp
  cursor.execute(query)
  strand = cursor.fetchone()['strand']
  if strand == '-':
    ref = helpers.flip_allele(ref)
  query = '''
    select pop_name, minlon, maxlon, minlat, maxlat, frequency from
    (select * from interpretome_ancestry.alfred where site_name="%s" and allele_name="%s") a
    join interpretome_ancestry.alfred_populations using (pop_uid)
  ''' % (site_name, ref)
  cursor.execute(query)
  data = cursor.fetchall()
  return http.HttpResponse(simplejson.dumps(data), mimetype = "application/json")
  
def get_allele_frequencies(request):
  dbsnps = helpers.check_dbsnp_array(request.GET.get('snps', None))
  population = helpers.check_population(request.GET.get('population', None))
  if None in (population, dbsnps):
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  frequencies = {}
  for dbsnp in dbsnps:
    query = '''
      SELECT refallele, refallele_freq, otherallele, otherallele_freq FROM var_hapmap.allele_freqs_%s
      WHERE rsid=%s
    ''' % (population, dbsnp)
    cursor.execute(query)
    data = cursor.fetchone()
    frequencies[dbsnp] = data
  return http.HttpResponse(simplejson.dumps(frequencies), mimetype = "application/json")

def get_reference_alleles(request):
  dbsnps = helpers.check_dbsnp_array(request.GET.get('snps', None))
  references = {}
  if dbsnps is None:
    return http.HttpResponseBadRequest()
  
  for dbsnp in dbsnps:
    query = '''
      SELECT strand, refncbi FROM %s
      WHERE rsid=%s
    ''' % (dbsnp_table, dbsnp)
    cursor = connections['default'].dict_cursor()
    cursor.execute(query)
    data = cursor.fetchone()
    if data is not None:
      references[dbsnp] = data['refncbi']
  return http.HttpResponse(simplejson.dumps(references), mimetype = "application/json")

def get_chrom_pos(request):
  dbsnps = helpers.check_dbsnp_array(request.GET.get('snps', None))
  if dbsnps is None:
    return http.HttpResponseBadRequest()
  info = {}
  for dbsnp in dbsnps:
    query = '''
      SELECT chrom, chromstart, chromend FROM %s
      WHERE rsid=%s
    ''' % (dbsnp_table, dbsnp)
    cursor = connections['default'].dict_cursor()
    cursor.execute(query)
    data = cursor.fetchone()
    info[dbsnp] = data
  return http.HttpResponse(simplejson.dumps(info), mimetype = "application/json")

  
def submit(request):
  request_dict = request.GET.copy()
  try:
	  exercise = request_dict.pop('exercise')[0]
  except KeyError:
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  
  if exercise in (
    'butte_diabetes', 'selection', 'assimes_cad', 'neandertal', 'eqtl',
    'snyder_binding', 'mignot_narcolepsy', 'longevity', 'kim_aging'
  ):
    population = helpers.check_population(request_dict.pop('population')[0])
    cursor.execute('SELECT MAX(sid) FROM interpretome_exercises.unified;')
    sid = cursor.fetchone().values()[0] + 1
    statements = []
    for k, v in request_dict.items():
      string = "('%s', '%s', '%s', '%s', %d)" % (helpers.sanitize(k), helpers.sanitize(v), population, exercise, int(sid))
      statements.append(string)
    query = '''
      INSERT INTO interpretome_exercises.unified (`key`, `value`, population, exercise, sid)
      VALUES %s;''' % ', '.join(statements)
    cursor.execute(query)
  return http.HttpResponse()
  
#def submit_doses(request):
#  dose_request = request.GET.get('doses', None)
#  
#  if dose_request is None or dose_request == '':
#    return http.HttpResponse(simplejson.dumps(None), mimetype = "application/json")
#  
#  cursor = connections['default'].dict_cursor()
#  query = '''
#    INSERT INTO interpretome_exercises.class_warfarin (submit_time, clinical, genetic, extended) VALUES (NOW(), %s)
#  ''' % (dose_request)
#  cursor.execute(query)
  
#def submit_coordinates(request):
#  coordinate_request = request.GET.get('coordinates', None)
#  
#  if coordinate_request is None or coordinate_request == '':
#    return http.HttpResponse(simplejson.dumps(None), mimetype = "application/json")
#  
#  cursor = connections['default'].dict_cursor()
#  query = '''
#    INSERT INTO interpretome_exercises.class_pca (submit_time, pc1, pc2) VALUES (NOW(), %s)
#  ''' % (coordinate_request)
#  cursor.execute(query)
#  
#  return http.HttpResponse(simplejson.dumps(coordinate_request), mimetype = "application/json")

def exercise(request):
  '''Get SNP data for an exercise.'''
  exercise = request.GET.get('exercise', None)
    
  # Defaults
  fields = '*'
  where_clause = ''
  db = 'interpretome_exercises'
  table = exercise
  
  # Supported exercises
  exercises = ['ashley_cad', 'tang_ancestry', 'altman_pgx', 'butte_diabetes',
               'assimes_cad', 'snyder_binding', 'class_writeups',
               'mignot_narcolepsy', 'kim_aging',
               'eqtl', 'longevity', 'selection', 'neandertal']
  if exercise not in exercises:
    return http.HttpResponseBadRequest()
  
  # Set query parameters
  if exercise == 'longevity':
    where_clause = 'ORDER BY log10_bf DESC'
  elif exercise == 'selection':
    pop = request.REQUEST.get('population')
    where_clause = "WHERE pop = '%s' AND selected IS NOT NULL" % pop
  
  query = '''SELECT %(fields)s FROM %(db)s.%(table)s %(where)s
  ''' % {'fields': fields, 'db': db, 'table': table, 'where': where_clause}
  
  # Get type of snp_dict
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  snps = {}
  if exercise in ('snyder_binding'):
    result = cursor.fetchall()
    snps['snps'] = helpers.create_multi_snp_dict(result)
  else:
    result = cursor.fetchall()
    snps['snps'] = helpers.create_snp_dict(result)
  
  # Post-processing
  if exercise == 'longevity':
    snps['sorted_dbsnps'] = [e['dbsnp'] for e in result]
  
  return http.HttpResponse(simplejson.dumps(snps), mimetype = 'application/json')

def diabetes(request):
  cursor = connections['default'].dict_cursor()
  query = 'SELECT * FROM interpretome_clinical.diabetes_old_with_sizes ORDER BY study_size DESC;'
  cursor.execute(query)
  all_snps = cursor.fetchall()
  snps = helpers.create_multi_snp_dict(all_snps)
  order_snps = []
  for snp in all_snps:
    order_snps.append(snp['dbsnp'])
  output = {'snps': snps, 'dbsnps': order_snps}
  return http.HttpResponse(simplejson.dumps(output), mimetype = 'application/json')
  
def get_individuals(request):
  numsnps = helpers.check_int(request.GET.get('numsnps', None))
  if numsnps is None:
    return http.HttpResponseBadRequest()
  individuals = helpers.sanitize(request.GET.get('individuals', None)).split(',')
  individual_select = set()
  for individual in individuals:
    if individual == '210-2011-staff':
      individual_select.update(['Konrad', 'Nick', 'Noah', 'Rob', 'Stuart'])
    else:
      individual_select.add(individual)
  if len(individual_select) == 0:
    return http.HttpResponseBadRequest()
  cursor = connections['default'].dict_cursor()
  query = '''
    SELECT dbsnp, %s FROM interpretome_ancestry.similarity LIMIT %s;
  ''' % (",".join([str(i) for i in individual_select]), numsnps)
  cursor.execute(query)
  output = helpers.create_snp_dict(cursor.fetchall())
  return http.HttpResponse(simplejson.dumps(output), mimetype = 'application/json')
  
def index(request):
  return shortcuts.render_to_response('application/interpretome.html', {})
