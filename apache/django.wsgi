import os, sys
sys.path.append('/opt/local/www')
sys.path.append('/opt/local/www/interpretome/apache/')
os.environ['DJANGO_SETTINGS_MODULE'] = 'interpretome.settings'

import django.core.handlers.wsgi

import monitor
monitor.start(interval=1.0)
monitor.track(os.path.dirname(__file__))

application = django.core.handlers.wsgi.WSGIHandler()
