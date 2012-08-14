OSX has a concept of "Resource Forks" and when you make a tar file, it includes these as files that start with ._ in the tarball.

https://sites.google.com/site/michaelsafyan/software-engineering/a-better-tar-on-macosx-excluding-save-backup-files-svn-metadata-and-resource-forks was useful:

  export COPY_EXTENDED_ATTRIBUTES_DISABLE=true
  export COPYFILE_DISABLE=true
  tar cvf foo.cbt bar/
