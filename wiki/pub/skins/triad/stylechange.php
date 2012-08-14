<?php if (!defined('PmWiki')) exit();
/*  
    stylechange.php   - A part of Triad skin -
    
    This script enables various skin configurations using alternative css files.
    It uses five sets of css file options, to set fonts, colors.  
    The various options are defined in skin.php 
*/

global $Now, $CookiePrefix, $FontCookie, $ColorCookie, $PageWidthCookie ;

# set cookie expire time (default 1 year)
SDV($FontCookieExpires,$Now+60*60*24*365);
SDV($ColorCookieExpires,$Now+60*60*24*365);
SDV($PageWidthCookieExpires,$Now+60*60*24*365);

$prefix = $CookiePrefix.$SkinName.'_';

SDV($SkinCookie, $prefix.'setskin');

# font cookie routine
if($EnableFontOptions==1) {
    SDV($FontCookie, $prefix.'setfont');
    if (isset($_COOKIE[$FontCookie])) $sf = $_COOKIE[$FontCookie];
    if (isset($_GET['setfont'])) {
      $sf = $_GET['setfont'];
      setcookie($FontCookie,$sf,$FontCookieExpires,'/');}
    if (isset($_GET['fonts'])) $sf = $_GET['fonts'];
    if (@$PageFontList[$sf]) $FontCss = $PageFontList[$sf];
    else $sf = $DefaultFont;
}

# color cookie routine 
if($EnableColorOptions==1) {
    SDV($ColorCookie, $prefix.'setcolor');
    if (isset($_COOKIE[$ColorCookie])) $sc = $_COOKIE[$ColorCookie];
    if (isset($_GET['setcolor'])) {
      $sc = $_GET['setcolor'];
      setcookie($ColorCookie,$sc,$ColorCookieExpires,'/');}
      if (isset($_GET['colors'])) $sc = $_GET['colors'];
    if (@$PageColorList[$sc]) $ColorCss = $PageColorList[$sc];
    else $sc = $DefaultColor;
}

# page width cookie routine
if($EnablePageWidthOptions==1) {
    SDV($PageWidthCookie, $prefix.'setpagewidth');
    if (isset($_COOKIE[$PageWidthCookie])) $sw = $_COOKIE[$PageWidthCookie];
    if (isset($_GET['setpagewidth'])) {
        $sw = $_GET['setpagewidth'];
        setcookie($PageWidthCookie,$sw,$PageWidthCookieExpires,'/');}
    if (isset($_GET['pagewidth'])) $sw = $_GET['pagewidth'];
    if (@$PageWidthList[$sw]) $PageWidth = $PageWidthList[$sw];
    else $sw = $DefaultPageWidth;
}
#####end cookies
