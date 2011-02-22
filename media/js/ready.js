var tmpls = ['start', 'lookup'];

$.each(tmpls, function(i, v) {
	$.get('/media/tmpl/' + v + '.html', function(tmpl) {
	  $.tmpl(tmpl).appendTo($('#' + v));
		$('button').button();
	});
});


$('#genome-file').live('change', function(e) {
  var fin = e.target.files[0];
  var reader = new FileReader();

  reader.onloadend = function(e) {
    user = new User();
    user.parseGenome(this.result.split('\n'));

    $('#status').empty().hide();
    $('#about-you tr:first ~ tr').remove();

    $.tmpl(clearTmpl).appendTo('#status').parent().show('slow');
    $('#clear-button').button({icons: {primary: 'ui-icon-circle-close'}});

    $('#about-you').show()
    $.each(user.chromosomes, function(i, v) {
      $.tmpl(chromosomeTmpl, {
        chromosome: i, count: v
      }).appendTo('#chromosomes-table')
    });
    $('.on-user-change').change();
  }
  reader.readAsText(fin);
});
$('#population').live('change', function(e) {
  if (user != undefined) {
    user.population = $('#population option:selected').val();
  }
});
$('#lookup-snps').live('click', function(e) {
  $('#snp-table').parent().show();
  $('#snp-table tr:first ~ tr').remove();
  $.each($('#snps-textarea').val().split('\n'), function(i, v) {
    v = $.trim(v);
    if (v == '') return;

    var genotype = user.lookup(v);
    if (genotype == undefined)
      genotype = 'no value';

    $.tmpl(genotypeTmpl, {
      dbSNP: v, genotype: genotype
    }).appendTo('#snp-table');
  });
});
$('#impute-snp').live('click', function(e) {
  var dbSNP = $('input[name="dbSNP"]').val();
  $.get('/linked/', {dbSNP: dbSNP, population: user.population}, function(response) {
    var userValues = {};
    $.each(response, function(i, v) {
      var userValue1 = user.lookup(v.dbSNP1);
      var userValue2 = user.lookup(v.dbSNP2);
      if (userValue1 != undefined) var value = userValue1;
      if (userValue2 != undefined) var value = userValue2;

      if (value != undefined) {
        console.log(value);
        $.get('/impute/', {dbSNP: userValue}, function(response) {
          $('#snp-table').append(response);
        });
      } else {
        $('#snp-table').append('Unable to impute SNP.');
      }
    });
  });
});

$('#tabs').tabs({});