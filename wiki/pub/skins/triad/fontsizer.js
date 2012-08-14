// part of code by Chris Kaminski www.setmajer.com/demo/fontsizewidget.html
// heavily adapted for php integration by Hans Bracker.
// The sizer buttons are loaded via markup (:fontsizer:)
// variables 'increment' and 'fontSizeDefault' are set in fontsizer.php

function Fontsize(increment,def) {
    this.w3c = (document.getElementById);
    this.ms = (document.all);
    this.userAgent = navigator.userAgent.toLowerCase();
    this.isOldOp = ((this.userAgent.indexOf('opera') != -1)&&(parseFloat(this.userAgent.substr(this.userAgent.indexOf('opera')+5)) <= 7));
    // this.isMacIE = ((this.userAgent.indexOf('msie') != -1) && (this.userAgent.indexOf('mac') != -1) && (this.userAgent.indexOf('opera') == -1));
    if ((this.w3c || this.ms) && !this.isOldOp && !this.isMacIE) {
        this.name = "fontSize";
  //     this.cookiePrefix = cookiePrefix;
  //     this.cookieName = cookiePrefix+'setfontsize';
        this.cookieName = cookieName;
        this.cookieExpires = '30';
        this.cookiePath = '/';
        this.increment = increment;
        this.def = def;
        this.defPx = Math.round(16*(def/100))
        this.base = 1;
        this.pref = this.getPref();
        this.testHTML = '<div id="fontSizeTest" style="position:absolute;visibility:hidden;line-height:1em;">&nbsp;</div>';
    } else {
        this.fontSizeInit = new Function('return true;');
    }
        this.allLinks = this.getLinkHtml();
}

// check the user's current base text size and adjust as necessary
Fontsize.prototype.fontSizeInit = function() {
        document.writeln(this.testHTML);
        this.body = (this.w3c)?document.getElementsByTagName('body')[0].style:document.all.tags('body')[0].style;
        this.fontSizeTest = (this.w3c)?document.getElementById('fontSizeTest'):document.all['fontSizeTest'];
        var h = (this.fontSizeTest.clientHeight)?parseInt(this.fontSizeTest.clientHeight):(this.fontSizeTest.offsetHeight)?parseInt(this.fontSizeTest.offsetHeight):999;
        if (h < this.defPx) this.base = this.defPx/h;
        this.body.fontSize = Math.round(this.pref*this.base) + '%';
        fsinit = 1;
}

Fontsize.prototype.getLinkHtml = function() {
        var html ='<span id="fsbox" class="fsbox"><span class="fslinklabel">'+fsLabel+'</span>';
        html +='<a href="#" onclick="fontSize.setSize(-1); return false;" return false;" ';
        html +=' title="'+fsSmaller+'" class="fontsizer" >&ndash;</a>';
        html +='<a href="#" onclick="fontSize.setSize(0); return false;" return false;" ';
        html +=' title="'+fsNormal+'" class="fontsizer" >0</a>';
        html +='<a href="#" onclick="fontSize.setSize(1); return false;" return false;" ';
        return html +=' title="'+fsBigger+'" class="fontsizer" >+</a></span>';    
}

Fontsize.prototype.getPref = function() {
    var pref = this.getCookie(this.cookieName);
    if (pref) return parseInt(pref);
    else return this.def;
}

Fontsize.prototype.setSize = function(direction) {
    this.pref = (direction)?this.pref+(direction*this.increment):this.def;
    setCookies = setcookie(this.cookieName,this.pref,this.cookieExpires,this.cookiePath);
    this.body.fontSize = Math.round(this.pref*this.base) + '%';
}
Fontsize.prototype.getCookie = function(cookieName) {
    var cookie = getcookie(cookieName);   
    return (cookie)?cookie:false;
}

var  fontSize = new Fontsize(increment,fontSizeDefault);
var  fsinit = 0;

function getexpirydate( nodays){
    var UTCstring;
    Today = new Date();
    nomilli=Date.parse(Today);
    Today.setTime(nomilli+nodays*24*60*60*1000);
    UTCstring = Today.toUTCString();
    return UTCstring;
}

function getcookie(cookiename) {
    var cookiestring=""+document.cookie;
    var index1=cookiestring.indexOf(cookiename);
    if (index1==-1 || cookiename=="") return ""; 
    var index2=cookiestring.indexOf(';',index1);
    if (index2==-1) index2=cookiestring.length; 
    return unescape(cookiestring.substring(index1+cookiename.length+1,index2));
}

function setcookie(name,value,duration,path){
    cookiestring=name+"="+escape(value)+";EXPIRES="+getexpirydate(duration)+";PATH="+path;
    document.cookie=cookiestring;
    if(!getcookie(name)){ return false; }
    else{ return true; }
}

    