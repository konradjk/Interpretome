$( function() {
  window.AppView = Backbone.View.extend({
    el: $('body'),
    
    events: {
      'change #genome-file': 'changeGenome',
      'click #clear-genome': 'clearGenome',
    },
  
    initialize: function() {
      _.bindAll(this, 'changeGenome', 'clearGenome');
    },
    
    render: function() {
      $('#population').buttonset();
      $('#tabs').tabs({
        // select: function(event, ui) {
        //   window.history.pushState(ui.tab.hash, null, ui.tab.hash); 
        // }
      });
      
    },
    
    changeGenome: function(event) {
      console.log(event);
      
      var reader = new FileReader();
      reader.onloadend = this.loadGenome;
      reader.readAsText(event.target.files[0]);
    },
    
    loadGenome: function(event) {
      console.log('Load');
      $('#genome > label, input').hide();
      $('#genome button').button({icons: {primary: 'ui-icon-circle-close'}}).show();
      window.App.user.parseGenome(event.target.result.split('\n'));
    },
    
    clearGenome: function() {
      console.log('clear');
      this.$(confirmClearTmpl).dialog({
        buttons: {
          'Cancel': function() {
          },
          'Clear': function() {
            $(this).dialog('close');
          }
        }
      });
    }
  });
  
  window.StartView = Backbone.View.extend({
    el: $('#start'),
    
    render: function() {
      var self = this;
      $.get('/media/tmpl/start.html', function(tmpl) {
        self.$(self.el).append($.tmpl(tmpl));
        self.el.find('button').button();
      });
    }
  });
  
  window.LookupView = Backbone.View.extend({
    el: $('#lookup'),
    
    events: {
      'click #lookup-snps': 'lookupSnps',
      'click #impute-snp': 'imputeSnp'
    },
    
    initialize: function() {
      _.bindAll(this, 'lookupSnps', 'imputeSnp');
    },
    
    render: function() {
      var self = this;
      $.get('/media/tmpl/lookup.html', function(tmpl) {
        self.$(self.el).append($.tmpl(tmpl));
        self.el.find('button').button();
      });
    },
    
    lookupSnps: function(e) {
      var table = this.el.find('#snp-table');
      table.find('tr:first ~ tr').remove();
      var snps = _.map(this.el.find('#snps').val().split('\n'), $.trim);
      
      $.each(snps, function(i, v) {
        var snp = window.App.user.lookup(parseInt(v));
        if (snp == undefined) snp = {dbsnp: v, genotype: 'no value'};
        $(table).append(_.template(snpTmpl, snp));
      });
      table.show();
    },
    
    imputeSnp: function() {
      
    }
  });
  
  window.AppController = Backbone.Controller.extend({
    routes: {
      'start': 'start',
      'lookup': 'lookup'
    },
    
    start: function() {
      console.log('start');
    },
    
    lookup: function() {
      console.log('lookup');
    }
  });
  
  window.StartView = new StartView();
  window.LookupView = new LookupView();
  window.App = new AppView();
  window.App.user = new User();
  
  window.StartView.render();
  window.LookupView.render();
  window.App.render();
  
  window.controller = new AppController();
  Backbone.history.start();
});