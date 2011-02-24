


String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

 
// window.application.addController(
//   'lookup', new LookupController(window.application, $('#lookup'))
// );

// // Start section handlers.
// $('#genome-file').live('change', function(e) {
//   var fin = e.target.files[0];
//   var reader = new FileReader();
// 
//   reader.onloadend = function(e) {
//     user = new User();
//     user.parseGenome(this.result.split('\n'));
// 
//     $('#status').empty().hide();
//     $('#about-you tr:first ~ tr').remove();
// 
//     $.tmpl(clearTmpl).appendTo('#status').parent().show('slow');
//     $('#clear-button').button({icons: {primary: 'ui-icon-circle-close'}});
// 
//     $('#about-you').show()
//     $.each(user.chromosomes, function(i, v) {
//       $.tmpl(chromosomeTmpl, {
//         chromosome: i, count: v
//       }).appendTo('#chromosomes-table')
//     });
//     $('.on-user-change').change();
//   }
//   reader.readAsText(fin);
// });
// $('#population').live('change', function(e) {
//   if (user != undefined) {
//     user.population = $('#population option:selected').val();
//   }
// });

// Lookup section handlers.
// $('#lookup-snps').live('click', function(e) {
//   $('#snp-table').parent().show();
//   $('#snp-table tr:first ~ tr').remove();
//   $.each($('#snps-textarea').val().split('\n'), function(i, v) {
//     v = $.trim(v);
//     if (v == '') return;
// 
//     var genotype = user.lookup(v);
//     if (genotype == undefined) {
//       genotype = 'no value';
//     }
// 
//     $.tmpl(genotypeTmpl, {
//       dbSNP: v, genotype: genotype
//     }).appendTo('#snp-table');
//   });
// });
// $('#impute-snp').live('click', function(e) {
//   var dbSNP = $('input[name="dbSNP"]').val();
//   $.get(iome.URLs.impute, {
// 	    dbSNP: dbSNP, population: user.population
// 	  }, function(response) {
//       
//     $.each(response, function(i, v) {
//       var userValue = _.reject(
//         [user.lookup(v.dbSNP1), user.lookup(v.dbSNP2)],
//         function(e) {e != undefined}
//       )[0];
//       
//       if (userValue != undefined) {
//         $.get(iome.URLs.lookup.impute, {
// 	          dbSNP: userValue
// 	        }, function(response) {
//           $('#snp-table').append(response);
//         });
//       } else $('#snp-table').append('Unable to impute SNP.');
//     });
//   });
// });
