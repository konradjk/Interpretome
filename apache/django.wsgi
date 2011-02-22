import os, sys
sys.path.append('/opt/local/www')
os.environ['DJANGO_SETTINGS_MODULE'] = 'interpretome.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
