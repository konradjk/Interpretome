import sys
import make_frequency_tables

populations = ('ASW', 'CEU', 'CHB', 'CHD' 'GIH', 'JPT', 'LWK', 'MEX', 'TSI', 'YRI')

for population in populations:
  make_frequency_tables.main(population)
