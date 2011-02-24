# Create your views here.


from django import http
from django.db import connections
from django.utils import simplejson
from django import shortcuts

import MySQLdb.cursors
from django.db.backends.mysql import base

population_map = {
  'European': 'CEU',
  'Japanese': 'JPT',
  'Chinese': 'CHB'
}

def dict_cursor(self):
  cursor = self._cursor()
  cursor.close()
  return base.CursorWrapper(self.connection.cursor(MySQLdb.cursors.DictCursor))
base.DatabaseWrapper.dict_cursor = dict_cursor

def linked(request):
  dbSNP = request.GET.get('dbSNP', None)
  population = request.GET.get('population', None)
  if dbSNP is None or population is None:
    return http.HttpResponseBadRequest()
  
  dbSNP = int(dbSNP)
  cursor = connections['default'].dict_cursor()
  
  query = '''
    SELECT dbSNP1, dbSNP2, R_square 
    FROM var_ld_data.ld_%s 
    WHERE dbSNP1 = %d OR dbSNP2 = %d
    ORDER BY R_square DESC;
    ''' % (population, dbSNP, dbSNP)
    
  cursor.execute(query)
  result = cursor.fetchall()
  
  return http.HttpResponse(
    simplejson.dumps(result),
    mimetype = 'application/json'
  )
  
def impute(request):
  dbSNP = request.GET.get('dbSNP', None)
  population = request.GET.get('population', None)
  if dbSNP is None or population is None:
    return http.HttpResponseBadRequest()
  
  query_snp_in_hapmap = get_individuals(dbSNP, population)
  if len(query_snp_in_hapmap) == 0:
    return None
  
  anchor_snp_in_hapmap = get_individuals(dbSNP, population)
  
  phase, phase_count, total = get_best_phases(query_snp_in_hapmap, anchor_snp_in_hapmap)
  
  genotype = phase[dbSNP.genotype[0]] + phase[dbSNP.genotype[1]]
  
  dbSNP = int(dbSNP)
  return http.HttpResponse(simplejson.dumps("Success"), mimetype = "application/json")

def get_individuals(rsid, population):
  query = '''
    SELECT individual_allele, allele 
    FROM hapmap_individuals.phased_individual_%s 
    WHERE rsid = '%s';
    ''' % (population, rsid)
  cursor.execute(query)
  individuals = {}
  for individual, allele in cursor.fetchall():
    individuals[individual] = allele
  return individuals

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
  if phase_1 >= phase_2:
    phase_output[anchor_snp_option_1] = query_snp_option_1
    phase_output[anchor_snp_option_2] = query_snp_option_2
    return phase_output, phase_1, phase_1 + phase_2
  else:
    phase_output[anchor_snp_option_1] = query_snp_option_2
    phase_output[anchor_snp_option_2] = query_snp_option_1
    return phase_output, phase_2, phase_1 + phase_2
  
def index(request):
  return shortcuts.render_to_response('application/interpretome.html', {})

