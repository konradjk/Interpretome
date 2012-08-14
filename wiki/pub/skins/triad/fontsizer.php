<?php if (!defined('PmWiki')) exit();

/*  Copyright 2006 Hans Bracker. 
    This file is fontsizer.php; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
    
    fontsizer allows instant incremental text sizing, and preferred 
    text size is remembered via a cookie setting. 
    Prerequisites: javascript enabled browser, skin with fonts set to 
    relative sizes (em or ex or %, not pt or mm etc.)
    
    Install fontsizer.php in cookbook/
    Install fontsizer.js in pub/fontsizer/
    Add to config.php: include_once("$FarmD/cookbook/fontsizer.php");
    Use markup (:fontsizer:) in SideBar to display sizer buttons.
*/ 
global $EnableFontSizer;
if(@$EnableFontSizer==0 || @$FontSizer==1) return;

# set var $FontSizer for use with (:if enabled FontSizer:) to hide if disabled
global $FontSizer; $FontSizer = 1;

# following is set in skin template:
# set session cookie with javascript to set a flag
#$HTMLHeaderFmt['javascript-cookie'] = "
#  <script type='text/javascript'><!--
#      document.cookie = 'javascript=true; path=/';
#  --></script>
#";


# set default fontsize (percent of user default text size) and step increment
global $FontSizeDefault,$FontSizeIncrement,$FSLabel,$FSBigger,$FSNormal,$FSSmaller;
SDV($FontSizeDefault, 90);
SDV($FontSizeIncrement, 10);
# set label and descriptions (tooltips)
SDV($FSLabel, XL('Text Size'));
SDV($FSBigger, XL('bigger'));
SDV($FSNormal, XL('default'));
SDV($FSSmaller, XL('smaller'));

## setfontsize cookie routine:
global $Now, $BaseFontSize, $FSCookie, $CookiePrefix;
$BaseFontSize = '90';
$FSCookie = $CookiePrefix.'setfontsize';
SDV($FontSizeCookieExpires,$Now+60*60*24*30);
    if (isset($_COOKIE[$FSCookie])) $sf = $_COOKIE[$FSCookie];
    if (isset($_GET['setfontsize'])) {
           $sf = $_GET['setfontsize'];
           setcookie($FSCookie,$sf,$FontSizeCookieExpires,'/'); }
    if (isset($_GET['fontsize'])) $sf = $_GET['fontsize'];
    $BaseFontSize = $sf;

global $FmtPV;
$FmtPV['$BaseFontSize'] = '$GLOBALS["BaseFontSize"]';

# load fontsize javascript, 
# load init variables, pass on from php to javascript
global $HTMLHeaderFmt;
$HTMLHeaderFmt['fontsizer'] = "
<script type='text/javascript' >
    var fontSizeDefault = $FontSizeDefault;
    var increment = $FontSizeIncrement;
    var cookieName = '$FSCookie';
    var fsLabel = '$FSLabel';
    var fsBigger = '$FSBigger';
    var fsNormal = '$FSNormal';
    var fsSmaller = '$FSSmaller';
 </script>
<script type='text/javascript' src='$SkinDirUrl/fontsizer.js'></script>
";

# load styling for fontsizer buttons (styled anchor links)
# skin nulls this, styles are in layout-main.css
$HTMLStylesFmt['fontsizer'] = "
    span.fsbox { width:11em; }
    a.fontsizer  { 
        margin-left:2px;
        padding:0 4px; 
        text-decoration:none;
        font-weight:900; 
        border-top:1px solid #ccf; 
        border-left:1px solid #ccf;
        border-right:1px solid #99c;
        border-bottom:1px solid #99c;}
    a.fontsizer:hover { background:#f9f9f9;}
";

# the following is already part of the skin template:   
# add $FontSizerInit into template just after <body> tag
global $FontSizerInit;
$FontSizerInit = "    <script type='text/javascript' >
    <!--
    if (fontSize) fontSize.fontSizeInit();
    --></script> 
";

# markup displays links via php if javascript cookie present 
if($javascript==1) { $FSLinksFmt = 
        "<span id='fsbox1' name='fsbox1' class='fsbox'><span class='fslinklabel'>$FSLabel</span><a accesskey='-' href='#' onclick='fontSize.setSize(\"-1\"); return false;'
        class='fontsizer' title='$FSSmaller' />&ndash;</a><a accesskey='0' href='#' onclick='fontSize.setSize(0); return false;' 
        class='fontsizer' title='$FSNormal' />0</a><a accesskey='+' href='#' onclick='fontSize.setSize(1); return false;' 
        class='fontsizer' title='$FSBigger' />+</a></span>";
} 
# else it displays links via javascript (at first site visit in a session)
else $FSLinksFmt = " 
    <script type='text/javascript' >
    <!--
      if (fsinit==1) document.write(fontSize.allLinks);
      else if (fontSize) { 
          fontSize.fontSizeInit();
          document.write(fontSize.allLinks); }
    --></script>  
 ";
# markup (:fontsizer:) to display sizer buttons
Markup('fontsizer', 'directives', '/\\(:fontsizer:\\)/', Keep($FSLinksFmt)); 

## alternative sizer markups 
/*
Markup('fontsize','directives','/\\(:fontsize\s(-?\d)\s(\w+)\s?(.*?):\\)/e',
  "Keep(\"<a href='' onclick='fontSize.setSize($1); return false;' title='$3'>$2</a>\",'L')"); 
*/
/*
# make sizer buttons with acceskeys (Alt+ value on button)
 (:fsizer -1 - smaller:) (:fsizer 0 0 normal:) (:fsizer 1 + larger:)  
Markup('sizerbutton','directives','/\\(:fsizer\s(-?\d)\s(.*?)\s(.*?):\\)/e',
 "Keep(\"<input type='button' class='inputbutton fontsizer' name='sbt' accesskey='$2' value='$2' onclick='fontSize.setSize($1); return false;' title='$3' />\",'L')"); 
*/
/*
Markup('fslarger','directives','/\\(:fslarger:\\)/e',
  "Keep(\"<a accesskey='l' href='#' onclick='fontSize.setSize(+1); return false;' >+</a>\",'L')"); 
Markup('fssmaller','directives','/\\(:fssmaller:\\)/e',
  "Keep(\"<a accesskey='s' href='#' onclick='fontSize.setSize(-1); return false;' >-</a>\",'L')"); 
Markup('fsnormal','directives','/\\(:fsnormal:\\)/e',
  "Keep(\"<a accesskey='n' href='#' onclick='fontSize.setSize(0); return false;' >-</a>\",'L')"); 
*/