from django.conf.urls.defaults import *

# First argument to patterns can be a prefix.
urlpatterns = patterns('interpretome.application.views',
  (r'^$', 'index'),
  (r'^submit/$', 'submit'),
  (r'lookup/linked/$', 'linked'),
  (r'lookup/impute/$', 'impute'),
  (r'lookup/get_reference_alleles/$', 'get_reference_alleles'),
  (r'lookup/get_allele_frequencies/$', 'get_allele_frequencies'),
  (r'lookup/get_chrom_pos/$', 'get_chrom_pos'),
  
  (r'pca/get_pca_loadings/$', 'get_pca_loadings'),
  (r'diabetes/get_diabetes_snps/$', 'get_diabetes_snps'),
  (r'height/get_height_snps/$', 'get_height_snps'),
  (r'submit/submit_snps/$', 'submit_snps'),
  (r'submit/submit_gwas_snps/$', 'submit_gwas_snps'),
  (r'submit/submit_doses/$', 'submit_doses'),
)
