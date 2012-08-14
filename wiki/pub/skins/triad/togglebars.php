<?php if (!defined('PmWiki')) exit();

/*  Copyright 2006 Hans Bracker. 
    This file is togglebars.php; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
    
    togglebars.php is part of triad skin for pmwiki 2
    
    changes: 
    2006-08-21: added togglebar cookie settings
  
*/ 
# defined in skin.php:
#global $EnableToggleCookies;
#SDV($EnableToggleCookies, 1);

# right and left toggle switch defaults: 1=show switch
SDV($LShow, 1);
SDV($RShow, 1); 

# check cookies
global $RShowCookie, $LShowCookie, $CookiePrefix;
SDV($LShowCookie, $CookiePrefix.$SkinName.'_setLshow');
SDV($RShowCookie, $CookiePrefix.$SkinName.'_setRshow');
if ($EnableToggleCookies==1 && isset($_COOKIE[$LShowCookie])) $LShow = $_COOKIE[$LShowCookie];
if ($EnableToggleCookies==1 && isset($_COOKIE[$RShowCookie])) $RShow = $_COOKIE[$RShowCookie];


# load toggle script
global $HTMLHeaderFmt,  $HTMLStylesFmt; 
$HTMLHeaderFmt['showhide'] = "
<script type='text/javascript' >
    var toggleCookies = '$EnableToggleCookies';
    var lcookie = '$LShowCookie';
    var rcookie = '$RShowCookie';
    var lshow = '$LShow';
    var rshow = '$RShow';
    var show = '$[Show]';
    var hide = '$[Hide]';
    var lwidth = '$LeftWidth';
    var rwidth = '$RightWidth';
</script>
<script type='text/javascript' src='$SkinDirUrl/togglebars.js'></script>
";

## define LeftToggle
global $LeftToggleFmt;
if($EnableLeftBarToggle==0) $LeftToggleFmt = ""; 
if($EnableLeftBarToggle==1)  { 
 if($LShow==1) {
   $LeftToggleFmt = "
   <script type='text/javascript' ><!--
   if (toggleLeft) document.write(\"<input name='lb' type='button' class='togglebox' value='\$[Hide] &darr;' onclick='toggleLeft()' />\") 
   --></script>
   ";}

 if($LShow==0) {
   $HTMLStylesFmt[] = " #sidebar {display:none} #left-box {width:1px} ";
   $LeftToggleFmt = "
   <script type='text/javascript' ><!--
   if (toggleLeft) document.write(\"<input name='lb' type='button' class='togglebox' value='\$[Show] &darr;' onclick='toggleLeft()' />\")
   --></script>
   ";}
 }

## define RightToggle
global $RightToggleFmt;
if($EnableRightBarToggle==0) $RightToggleFmt = ""; 
if($EnableRightBarToggle==1 && $RBExists==1)  { 
 if($RShow==1) {
   $RightToggleFmt = 
   "<script type='text/javascript' ><!--
   if (toggleRight) document.write(\"<input name='rb' type='button' class='togglebox' value='&darr; \$[Hide]' onclick='toggleRight()' />\")
   --></script>
   ";}
   
 if($RShow==0) {
   $HTMLStylesFmt[] = " #rightbar {display:none} #right-box {width:1px} ";
   $RightToggleFmt = 
   "<script type='text/javascript' ><!--
   if (toggleRight) document.write(\"<input name='rb' type='button' class='togglebox' value='&darr; \$[Show]' onclick='toggleRight()' />\")
   --></script>
   ";}
}





