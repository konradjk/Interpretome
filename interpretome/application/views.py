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
  

def linked(request):
  cursor = connections['default'].dict_cursor()
  dbsnp = request.GET.get('dbsnp', None)
  cursor.execute(r"SELECT * FROM var_ld_data.ld_CEU LIMIT 1;")
  result = cursor.fetchall()
  
  return http.HttpResponse(
    simplejson.dumps(result),
    mimetype = "application/json"
  )
  

def index(request):
	return shortcuts.render_to_response('application/index.html', {})