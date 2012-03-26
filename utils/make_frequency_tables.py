#!/usr/bin/env python
'''
Created on Mar 29, 2010

@author: konradjk
'''

import warnings
warnings.filterwarnings("ignore",category=DeprecationWarning)
import MySQLdb
import sys
import os
import subprocess
from ftplib import FTP
import gzip

db = MySQLdb.connect(host='localhost', user='', passwd='', db='var_hapmap').cursor()

def main(argv):
    population = argv[1]
    chromosomes = range(1, 23)
    chromosomes.append('X')
    chromosomes.append('Y')
    
    create_freq_table(db, population)
    
    for chrom in chromosomes:
        ftp = FTP('ftp.ncbi.nlm.nih.gov')
        ftp.login()
        ftp.cwd('/hapmap/frequencies/2010-08_phaseII+III/')
        print 'Processing Chromosome %s' % chrom
        freq_file = 'allele_freqs_chr%s_%s_r28_nr.b36_fwd.txt.gz' % (chrom, population)
        ftp.retrbinary('RETR %s' % freq_file, open('%s' % freq_file, 'wb').write)
        ftp.quit()
        freq_fh = gzip.open(freq_file, 'rb')
        add_to_freq_table(db, freq_fh, chrom, population)
        freq_fh.close()
        os.remove(freq_file)
    
    db.execute('CREATE INDEX `rsid` ON var_hapmap.allele_freqs_%s (rsid)' % (population))

def create_freq_table(db, population):
    create_query = '''
    CREATE TABLE `allele_freqs_%s` (
    `rsid` int(11) DEFAULT NULL ,
    `chrom` varchar(2) DEFAULT NULL ,
    `pos` int(11) DEFAULT NULL ,
    `strand` varchar(1) DEFAULT NULL ,
    `build` varchar(15) DEFAULT NULL ,
    `center` varchar(15) DEFAULT NULL ,
    `protlsid` varchar(63) DEFAULT NULL ,
    `assaylsid` varchar(63) DEFAULT NULL ,
    `panellsid` varchar(63) DEFAULT NULL ,
    `qc_code` varchar(3) DEFAULT NULL ,
    `refallele` varchar(1) DEFAULT NULL ,
    `refallele_freq` float DEFAULT NULL ,
    `refallele_count` int(11) DEFAULT NULL ,
    `otherallele` varchar(1) DEFAULT NULL ,
    `otherallele_freq` float DEFAULT NULL ,
    `otherallele_count` int(11) DEFAULT NULL ,
    `totalcount` int(11) DEFAULT NULL 
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
    ''' % (population)
    db.execute(create_query)

def add_to_freq_table(db, freq_fh, chrom, population):
  start = 0
  for line in freq_fh:
    if start == 0:
      start = 1
      continue
    raw_rsid, raw_chrom, pos, strand, build, center, protlsid, assaylsid, panellsid, qc_code, refallele, refallele_freq, refallele_count, otherallele, otherallele_freq, otherallele_count, totalcount = line.strip().split()
    rsid = raw_rsid.lstrip('rs')
    chrom = raw_chrom.lstrip('chr')
    insert_query = '''
    INSERT INTO var_hapmap.allele_freqs_%s (rsid, chrom, pos, strand, build, center, protlsid, assaylsid, panellsid, qc_code, refallele, refallele_freq, refallele_count, otherallele, otherallele_freq, otherallele_count, totalcount) VALUES (%s, "%s", %s, "%s", %s, %s, "%s", %s, %s, %s)
    ''' % (population, rsid, chrom, pos, '","'.join([strand, build, center, protlsid, assaylsid, panellsid, qc_code, refallele]), refallele_freq, refallele_count, otherallele, otherallele_freq, otherallele_count, totalcount)
    #print insert_query
    db.execute(insert_query)
        
if __name__ == '__main__':
  main(sys.argv)
