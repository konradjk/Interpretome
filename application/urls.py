from django.conf.urls.defaults import *

urlpatterns = patterns('',
  (r'^$', 'interpretome.application.views.index'),
  (r'lookup/linked/$', 'interpretome.application.views.linked'),
  (r'lookup/impute/$', 'interpretome.application.views.impute'),
  (r'pca/get_pca_loadings/$', 'interpretome.application.views.get_pca_loadings'),
  (r'diabetes/get_diabetes_snps/$', 'interpretome.application.views.get_diabetes_snps'),
  (r'height/get_height_snps/$', 'interpretome.application.views.get_height_snps'),
  (r'submit/submit_snps/$', 'interpretome.application.views.submit_snps'),
  (r'submit/submit_gwas_snps/$', 'interpretome.application.views.submit_gwas_snps'),
  (r'submit/submit_doses/$', 'interpretome.application.views.submit_doses'),
)
