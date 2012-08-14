#!/usr/bin/env python

'''
Created on Feb 21, 2010

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
import re

db = MySQLdb.connect(host='localhost', user='', passwd='', db='var_ld_data').cursor()

def main(argv):
    population = argv[1]
    ld_cutoff = 0.3
    #ld_cutoff = argv[2]
    chromosomes = range(1, 23)
    
    create_ld_table(db, population)
    created = 0
    started = 0
    
    for chrom in chromosomes:
        ftp = FTP('ftp.ncbi.nlm.nih.gov')
        ftp.login()
        ftp.cwd('/hapmap/ld_data/2009-04_rel27/')
        print 'Processing Chromosome %s' % chrom
        ld_file = 'ld_chr%s_%s.txt.gz' % (chrom, population)
        ftp.retrbinary('RETR %s' % ld_file, open('%s' % ld_file, 'wb').write)
        ftp.quit()
        ld_fh = gzip.open(ld_file, 'rb')
        add_to_ld_table(db, ld_fh, ld_cutoff, chrom, population)
        ld_fh.close()
        os.remove(ld_file)

        ftp = FTP('ftp.ncbi.nlm.nih.gov')
        ftp.login()
        ftp.cwd('/hapmap/phasing/2009-02_phaseIII/HapMap3_r2/%s/UNRELATED/' % population)
        phase_file = 'hapmap3_r2_b36_fwd.consensus.qc.poly.chr%s_%s.unr.phased.gz' % (chrom, population.lower())
        ftp.retrbinary('RETR %s' % phase_file, open(phase_file, 'wb').write)
        ftp.quit()
        phase_fh = gzip.open(phase_file, 'rb')
        for line in phase_fh:
            if created == 0:
                fields_string = create_phase_table(line, population)
                created = 1
                started = 1
            elif started == 0:
                started = 1
            else:
                add_to_phase_table(line, population, fields_string)
        started = 0
        phase_fh.close()
        os.remove(phase_file)
    
    db.execute('CREATE INDEX `dbSNP1` ON var_ld_data.ld_%s (dbSNP1)' % (population))
    db.execute('CREATE INDEX `dbSNP2` ON var_ld_data.ld_%s (dbSNP2)' % (population))
    db.execute('CREATE INDEX `dbSNP` ON var_hapmap.hapmap_phased_%s (dbSNP)' % (population))

def create_ld_table(db, population):
    create_query = '''
    CREATE TABLE var_ld_data.`ld_%s` (
    `dbSNP1` int(11) DEFAULT NULL ,
    `dbSNP2` int(11) DEFAULT NULL ,
    `D_prime` float DEFAULT NULL ,
    `R_square` float DEFAULT NULL ,
    `LOD` float DEFAULT NULL
    ) ENGINE=MyISAM DEFAULT CHARSET=utf8;
    ''' % (population)
    db.execute(create_query)

def add_to_ld_table(db, ld_fh, ld_cutoff, chrom, population):
    for line in ld_fh:
        position_1, position_2, pop, rsid_1, rsid_2, D_prime, R_square, LOD, _ = line.strip().split()
        dbSNP1 = rsid_1.lstrip('rs')
        dbSNP2 = rsid_2.lstrip('rs')
        if float(R_square) > ld_cutoff:
            insert_query = 'INSERT INTO var_ld_data.ld_%s (dbSNP1, dbSNP2, D_prime, R_square, LOD) VALUES (%s, %s, %s, %s, %s)' % (population, dbSNP1, dbSNP2, D_prime, R_square, LOD)
            db.execute(insert_query)

def create_phase_table(line, population):
    table_fields = line.strip().split()
    table_fields.pop(0)
    table_fields.pop(0)
    fields_string = "dbSNP, position, " + ", ".join(table_fields)
    table_string = " VARCHAR(1), ".join(table_fields)
    create_query = 'CREATE TABLE var_hapmap.hapmap_phased_%s (dbSNP INT(11), position INT(11), %s VARCHAR(1)) ENGINE=MyISAM DEFAULT CHARSET=utf8;' % (population, table_string)
    db.execute(create_query)
    return fields_string
    
def add_to_phase_table(line, population, fields_string):
    if line.lstrip('rs') != line:
        values = '"' + line.strip().lstrip('rs').replace(' ', '","') + '"'
        insert_query = 'INSERT INTO var_hapmap.hapmap_phased_%s (%s) VALUES (%s)' % (population, fields_string, values)
        db.execute(insert_query)    

if __name__ == '__main__':
    main(sys.argv)
