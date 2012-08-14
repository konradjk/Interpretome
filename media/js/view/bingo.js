$(function() {
window.BingoView = Backbone.View.extend({
	el: $('#bingo'),
	has_loaded: false,
  hidden: false,
  won: false,
  
  events: {
    'click #generate-bingo': 'confirm_generate_bingo_card',
    'click #submit-completed-bingo-card': 'submit_completed_bingo_card'
  },
  
	initialize: function() {
	  _.bindAll(this, 'loaded',
    'confirm_generate_bingo_card',
    'got_bingo_info', 'submit_completed_bingo_card',
    'check_win',
    'save_state');
	},
	
	render: function() {
	  $.get('/media/template/bingo.html', this.loaded);
    this.has_loaded = true;
	},
	
	loaded: function(response) {
    $('#tabs').tabs('select', '#bingo');
    $(this.el).append(response);
    $('#generate-bingo').button();
    $('#submit-completed-bingo-card').button({disabled:true});
    this.table_template = $('#bingo-template').html();
    var self = this;
    
    cur_game = '';
    var cookies = document.cookie.split(";");
    for (i=0; i < cookies.length; i++) {
      x = cookies[i].substr(0, cookies[i].indexOf("="));
      y = cookies[i].substr(cookies[i].indexOf("=")+1);
      x = x.replace(/^\s+|\s+$/g,"");
      if (x == 'bingo') {
        cur_game = atob(y.replace(/\|/g, '='));
      }
    }
    if (cur_game != '') {
      $('#bingo-table').html(cur_game);
      document.getElementById('bingo-table').onclick = function(e) {
      var target = (e || window.event).target;
      if (target.tagName in {TD:1, TH:1}) {
        if (target.getAttribute('style') == null || target.getAttribute('style') == 'null') {
          target.setAttribute('style', 'background-color: #6A92D4');
        } else {
          target.setAttribute('style', null);
        }
        self.save_state();
      }
    };
      $('#bingo-table').show();
      $('#bingo-rules').show();
    }
    $('#confirm-generate-bingo').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Okay': function() {
          $('#bingo-table').empty();    
          $.get('get_bingo_info', self.got_bingo_info);
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
    $('#bingo-winner').dialog({
      modal: true, resizable: false, autoOpen: false, buttons: {
        'Woohoo!': function() {$(this).dialog('close');}
      }
    });
    $('#bingo-card-generated').dialog({
      modal: true,  width: "50%", resizable: true, autoOpen: false, buttons: {
        'Woohoo!': function() {$(this).dialog('close');}
      }
    });
    
    $('#confirm-submit-bingo').dialog({
      modal: true,  width: "50%", resizable: true, autoOpen: false, buttons: {
        'Okay': function() {
          $.get('get_bingo_image', {html:$('#bingo-table-box').html(), name:$('#bingo-name-textarea').val()}, function(response){
            twitter_url = 'https://twitter.com/intent/tweet?text=BINGO!&hashtags=interpretome,bog12&url=' + response + ''
            $('#twitter-bingo-url').html("<a href='" + twitter_url + "' target='_blank'>Tweet your card</a>")
            $('#bingo-link').html(response)
            $('#bingo-card-generated').dialog('open');
          });
          $(this).dialog('close');
        },
        'Cancel': function() {$(this).dialog('close');}
      }
    });
	},
  
  confirm_generate_bingo_card: function() {
    $('#confirm-generate-bingo').dialog('open');
  },
  
  submit_completed_bingo_card: function() {
    $('#confirm-submit-bingo').dialog('open');
  },
  
  got_bingo_info: function(response) {
    var self = this;
    $("#bingo-table").append(_.template(self.table_template, response));
    $('#bingo-table').show();
    $('#bingo-rules').show();
    document.getElementById('bingo-table').onclick = function(e) {
      var target = (e || window.event).target;
      if (target.tagName in {TD:1, TH:1}) {
        if (target.getAttribute('style') == null || target.getAttribute('style') == 'null' || target.getAttribute('style') == '') {
          target.setAttribute('style', 'background-color: #6A92D4');
        } else {
          target.setAttribute('style', null);
        }
        self.save_state();
      }
    };
    document.getElementById('free-space').setAttribute('style', 'background-color: #6A92D4');
    self.save_state();
  },
  
  save_state: function() {
    var cookies = document.cookie.split(";");
    var new_cookie = '';
    var already_found = 0;
    var session = '';
    var self = this;
    for (i=0; i < cookies.length; i++) {
      x = cookies[i].substr(0, cookies[i].indexOf("="));
      y = cookies[i].substr(cookies[i].indexOf("=")+1);
      x = x.replace(/^\s+|\s+$/g,"");
      if (x == 'bingo') {
        var exdate = new Date();
        exdate.setDate(exdate.getDate() + 30);
        document.cookie = " bingo=" + btoa($('#bingo-table').html()).replace(/=/g, '|') + "; expires="+exdate.toUTCString() + ';';
        already_found = 1;
      } else if (x == 'session') {
        session = y;
      }
    }
    if (already_found == 0) {
      var exdate = new Date();
      exdate.setDate(exdate.getDate() + 30);
      session = Math.random().toString().slice(2,20);
      document.cookie = " session=" + session;
      document.cookie = " bingo=" + btoa($('#bingo-table').html()).replace(/=/g, '|') + "; expires="+exdate.toUTCString() + ';';
    }
    $.get('playing_bingo', {id:session})
    
    d = new Date();
    $('#bingo-saved-time').html(d.toString());
    $.get('get_playing_bingo', function(response){
      $('#bingo-status').show();
      $('#playing-bingo').html(response);
    });
    $("#submit-completed-bingo-card").button( "option", "disabled", false );
    this.check_win();
  },
  
  check_win: function() {
    wins = [['a1', 'a2', 'a3', 'a4', 'a5'],
            ['b1', 'b2', 'b3', 'b4', 'b5'],
            ['c1', 'c2', 'free-space', 'c4', 'c5'],
            ['d1', 'd2', 'd3', 'd4', 'd5'],
            ['e1', 'e2', 'e3', 'e4', 'e5'],
            ['a1', 'b1', 'c1', 'd1', 'e1'],
            ['a2', 'b2', 'c2', 'd2', 'e2'],
            ['a3', 'b3', 'free-space', 'd3', 'e3'],
            ['a4', 'b4', 'c4', 'd4', 'e4'],
            ['a5', 'b5', 'c5', 'd5', 'e5'],
            ['a1', 'b2', 'free-space', 'd4', 'e5'],
            ['a5', 'b4', 'free-space', 'd2', 'e1']]
    current_winner = false;
    $.each(wins, function(i, v){
      total = 0;
      $.each(v, function(j, k){
        x = $('#' + k)[0];
        if (!(x.getAttribute('style') == null || x.getAttribute('style') == 'null' || x.getAttribute('style') == '')) {
          total += 1
        }
      });
      if (total == 5) {
        current_winner = true;
      }
    });
    if (current_winner) {
      if (!this.won) {
        $('#bingo-winner').dialog('open');
      }
      this.won = true;
    } else {
      this.won = false;
    }
  }
  
});
});
