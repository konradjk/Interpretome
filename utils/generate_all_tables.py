import sys
import make_frequency_tables

populations = ('asw', 'ceu', 'chb', 'gih', 'jpt', 'lwk', 'mex', 'tsi', 'yri')

for population in populations:
  make_frequency_tables.main(population)
