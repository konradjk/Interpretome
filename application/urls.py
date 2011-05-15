from django.conf.urls.defaults import *

# First argument to patterns can be a prefix.
urlpatterns = patterns('interpretome.application.views',
  (r'^$', 'index'),
  (r'^submit/$', 'submit'),
  (r'lookup/exercise/$', 'exercise'),
  (r'lookup/longevity/$', 'longevity'),
  (r'lookup/neandertal/$', 'get_neandertal_snps'),
  (r'lookup/linked/$', 'linked'),
  (r'lookup/impute/$', 'impute'),
  (r'lookup/get_reference_alleles/$', 'get_reference_alleles'),
  (r'lookup/get_allele_frequencies/$', 'get_allele_frequencies'),
  (r'lookup/get_chrom_pos/$', 'get_chrom_pos'),
  
  (r'similarity/get_individuals/$', 'get_individuals'),
  (r'pca/get_pca_parameters/$', 'get_pca_parameters'),
  (r'diabetes/get_diabetes_snps/$', 'get_diabetes_snps'),
  (r'height/get_height_snps/$', 'get_height_snps'),
  (r'submit/submit_snps/$', 'submit_snps'),
  (r'submit/submit_gwas_snps/$', 'submit_gwas_snps'),
  (r'submit/submit_doses/$', 'submit_doses'),
  (r'submit/submit_coordinates/$', 'submit_coordinates'),
  
  (r'disease/get_gwas_catalog/$', 'get_gwas_catalog'),
  (r'^diabetes/$', 'diabetes'),
  (r'^get_painting_params/$', 'get_painting_params')
)
