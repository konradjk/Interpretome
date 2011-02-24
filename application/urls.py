from django.conf.urls.defaults import *

urlpatterns = patterns('',
  (r'^$', 'interpretome.application.views.index'),
  (r'lookup/linked/$', 'interpretome.application.views.linked'),
  (r'lookup/impute/$', 'interpretome.application.views.impute'),
)
