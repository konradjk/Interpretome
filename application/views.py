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
  rsquared_request = request.GET.get('r_squareds', None)
  population = request.GET.get('population', None)
  
  if None in (dbsnp_request, population, user_dbsnp_request, rsquared_request):
    return http.HttpResponseBadRequest()
  dbsnps = [int(element) for element in dbsnp_request.split(',')]
  user_dbsnps = [int(element) for element in user_dbsnp_request.split(',')]
  rsquareds = [float(element) for element in rsquared_request.split(',')]
  cursor = connections['default'].dict_cursor()
  
  phases = {}
  for index, dbsnp in enumerate(dbsnps):
    query_snp_in_hapmap = helpers.get_individuals(cursor, dbsnp, population)
    anchor_snp_in_hapmap = helpers.get_individuals(cursor, user_dbsnps[index], population)
    phase = helpers.get_best_phases(query_snp_in_hapmap, anchor_snp_in_hapmap)
    phase['user_snp'] = user_dbsnps[index]
    phase['r_squared'] = rsquareds[index]
    phases[dbsnp] = phase
  
  return http.HttpResponse(simplejson.dumps(phases), mimetype = "application/json")

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
    SELECT * FROM var_disease_snp.height
  '''
  cursor = connections['default'].dict_cursor()
  cursor.execute(query)
  snps = cursor.fetchall()
  return http.HttpResponse(simplejson.dumps(snps), mimetype = "application/json")

def index(request):
  return shortcuts.render_to_response('application/interpretome.html', {})

