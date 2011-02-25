# Create your views here.


from django import http
from django.db import connections
from django.utils import simplejson
from django import shortcuts

import MySQLdb.cursors
import helpers
from django.db.backends.mysql import base

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
      SELECT dbSNP1, dbSNP2, R_square 
      FROM var_ld_data.ld_%s 
      WHERE dbSNP1 = %d OR dbSNP2 = %d
      ORDER BY R_square DESC;
      ''' % (population, dbsnp, dbsnp)
    
    cursor.execute(query)
    result = cursor.fetchall()
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
  population = request.GET.get('population', None)
  
  if dbsnp_request is None or population is None:
    return http.HttpResponseBadRequest()
  dbsnps = [int(element) for element in dbsnp_request.split(',')]
  cursor = connections['default'].dict_cursor()
  
  phases = {}
  for dbsnp in dbsnps:
    query_snp_in_hapmap = helpers.get_individuals(cursor, dbsnp, population)
    
    if len(query_snp_in_hapmap) == 0:
      return None
    
    anchor_snp_in_hapmap = helpers.get_individuals(cursor, dbsnp, population)
    
    phase, phase_count, total = helpers.get_best_phases(query_snp_in_hapmap, anchor_snp_in_hapmap)
    phases[dbsnp] = phase
    
    #genotype = phase[dbsnp.genotype[0]] + phase[dbsnp.genotype[1]]
    
  return http.HttpResponse(simplejson.dumps(phases), mimetype = "application/json")

  
def index(request):
  return shortcuts.render_to_response('application/interpretome.html', {})

