# Create your views here.

import MySQLdb.cursors

from django import http
from django.db import connections
from django.utils import simplejson
from django import shortcuts

from django.db.backends.mysql import base

def dict_cursor(self):
  cursor = self._cursor()
  cursor.close()
  return base.CursorWrapper(self.connection.cursor(MySQLdb.cursors.DictCursor))
base.DatabaseWrapper.dict_cursor = dict_cursor

def strip_rsids(params):
  if 'dbsnp' in params:
    pass
  

def linked(request):
  dbsnp = request.GET.get('dbsnp', None)
  population = request.GET.get('population', None)
  if dbsnp is None or population is None:
    return http.HttpResponseBadRequest()
  
  dbsnp = int(dbsnp.lstrip('rs'))
  cursor = connections['default'].dict_cursor()
  
  cursor.execute('''
    SELECT dbSNP1, dbSNP2, R_square 
    FROM var_ld_data.ld_%s 
    WHERE dbSNP1 = %d OR dbSNP2 = %d
    ORDER BY R_square DESC;''' % (population, dbsnp, dbsnp)
  )
  result = cursor.fetchall()
  
  return http.HttpResponse(
    simplejson.dumps(result),
    mimetype = 'application/json'
  )
  
def impute(request):
  dbsnp = request.GET.get('dbsnp', None)
  if dbsnp is None:
    pass
  
  dbsnp = int(dbsnp.lstrip('rs'))
  return http.HttpResponse(simplejson.dumps("Success"), mimetype = "application/json")
    

def index(request):
	return shortcuts.render_to_response('application/index.html', {})