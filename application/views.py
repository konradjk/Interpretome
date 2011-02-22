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
  
  cursor.execute('''
    SELECT dbSNP1, dbSNP2, R_square 
    FROM var_ld_data.ld_%s 
    WHERE dbSNP1 = %d OR dbSNP2 = %d
    ORDER BY R_square DESC;''' % (population, dbSNP, dbSNP)
  )
  result = cursor.fetchall()
  
  return http.HttpResponse(
    simplejson.dumps(result),
    mimetype = 'application/json'
  )
  
def impute(request):
  dbSNP = request.GET.get('dbSNP', None)
  if dbSNP is None:
    pass
  
  dbSNP = int(dbSNP)
  return http.HttpResponse(simplejson.dumps("Success"), mimetype = "application/json")
    

def index(request):
	return shortcuts.render_to_response('application/index.html', {})