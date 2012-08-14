<?php if (!defined('PmWiki')) exit();
/*  Copyright 2006 Hans Bracker. 
    This file is skin.php; part of the Triad skin for pmwiki 2
    you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
*/
global $FmtPV, $SkinName, $SkinVersionDate, $SkinVersionNum, $SkinVersion, $SkinRecipeName, 
       $SkinSourceURL, $RecipeInfo;
# Some Skin-specific values
$RecipeInfo['TriadSkin']['Version'] = '2010-05-13';
$SkinName = 'triad';
$SkinRecipeName = "TriadSkin";

# for use in conditional markup  (:if enabled TriadSkin:)
global $TriadSkin; $TriadSkin = 1; 

global $DefaultColor, $DefaultFont, $DefaultPageWidth, 
       $EnableStyleOptions, $EnableThemes,
       $EnableColorOptions, $EnableFontOptions, $EnablePageWidthOptions,
       $EnableGroupTitle, $EnableRightBar, $EnableMarkupShowRight, 
       $EnableEmptyRightBar, $EnableRightBarToggle, $EnableLeftBarToggle,
       $EnableToggleCookies, $EnableViewSwitcher, $EnableFontSizer,$EnablePopupEditForm,
       $EnablePmWikiCoreCss, $RightWidth, $LeftWidth, $PageBorder, 
       $BackgroundImgUrlFmt, $BackgroundColor;
       
# Set default color and font scheme, and default page width style
# Variables can also be set in config.php
SDV($DefaultColor,'lightblue'); # lightblue, silverblue, seagreen, green, gold, choc, white, night, trans
SDV($DefaultFont, 'verdana'); # verdana or georgia
SDV($DefaultPageWidth, 'wide');  # wide, 800, 1000, 1300 or border 

# Default left and right bar width
SDV($RightWidth, '170px');
SDV($LeftWidth, '170px');
SDV($PageBorder, '20px');

# By default style options are enabled, 
# Disable user options by setting $EnableStyleOptions = 0;
SDV($EnableStyleOptions, 1);
# Inidividual option switching can be disabled by type setting any of the following to zero
# An admin may prefer to have the page width option not changeable
SDV($EnableColorOptions, 1);
SDV($EnableFontOptions, 1);
SDV($EnablePageWidthOptions, 1); 

# By default markup (:theme colorname fontname:)is enabled, 
# SDV($EnableThemes, 0); #disables theme display.
SDV($EnableThemes, 1);

## background image & body bg-color (for width other than wide) for transparent color scheme
SDV($BackgroundImgUrlFmt, '$SkinDirUrl/images/beach.jpg');
SDV($BackgroundColor, '#b9c7d4');

# Enables grouplink in titlebar; set to 0 for no grouplink in titlebar.
# The group name can also be hidden on pages with markup (:nogroup:)
SDV($EnableGroupTitle, 1);

# Enables default rightbar, set to 0 if no right column is needed sitewide
SDV($EnableRightBar, 1);

# enable markup (:showright:), which can show RightBar for individual pages, 
# if showing of RightBar is sitewide disabled with switch $EnableRightBar = 0; above.
SDV($EnableMarkupShowRight, 1);

# Do not show empty right bar column. Only show RightBar column if RightBar exists. 
# Set to 1 to show empty column when there is no RightBar page. 
SDV($EnableEmptyRightBar, 0);

# adds rightbar toggle switch to topmenubar to show/hide rightbar
SDV($EnableRightBarToggle, 1);
# adds left sidebar toggle switch to topmenubar to show/hide left sidebar
SDV($EnableLeftBarToggle, 1);
# enable persistent toggle state setting via cookies
SDV($EnableToggleCookies, 1);

# add big view  - normal view switcher
SDV($EnableViewSwitcher, 1);

# add font sizer, use (:fontsizer:) markup in header or sidebar or where needed
SDV($EnableFontSizer, 1);

## adding  preview popup for edit window
SDV($EnablePopupEditForm, 1);

# load pmwiki-core.css instead of default styles in page head
SDV($EnablePmWikiCoreCss, 1);

# array lists of available style options
global $PageColorList, $PageFontList, $PageWidthList;
SDVA($PageColorList, array (
        'lightblue' => 'c-lightblue.css',
        'silverblue' => 'c-silverblue.css',
        'seagreen' => 'c-seagreen.css',
        'green' => 'c-green.css',
        'gold' => 'c-gold.css',
        'choc' => 'c-choc.css',
        'white' => 'c-white.css',
        'trans' => 'c-transparent.css',
        'night' => 'c-night-blue.css',
        ));
SDVA($PageFontList, array ( 
        'verdana' => 'font-verdana.css',
        'georgia' => 'font-georgia.css',
        ));
SDVA($PageWidthList, array (
        'wide' => 'wide',
        '800' => '778',
        '1000' => '1024',
        '1024' => '1024',
        '1280' => '1280',
        '1300' => '1280',
        'border' => 'border',
        ));

# =========== end of configuration section of skin.php ================= # 

# compatibility check with pmwiki version number
global $VersionNum, $CompatibilityNotice;
if($VersionNum < '2001016') 
   $CompatibilityNotice = "<p style='color:yellow'>Compatibility problem: Please upgrade to the latest pmwiki version</p>";

global $BodyAttrFmt;
SDV($BodyAttrFmt, '');

# pmwiki core styles 
# disable pmwiki default core styles, load from core.css
global $HTMLStylesFmt, $PmWikiCoreStylesFmt;
if($EnablePmWikiCoreCss==1) { 
# awaiting pmwiki suport for pmwiki-core.css, $PmWikiCoreCss may need update!
  global $PmWikiCoreCss;
  SDV($PmWikiCoreCss, "pmwiki-core.css");
  if(file_exists("$FarmD/pub/css/$PmWikiCoreCss")) SDV($PmWikiCoreStylesFmt, "
    <link href='$FarmPubDirUrl/css/$PmWikiCoreCss' rel='stylesheet' type='text/css' />");
  else
    SDV($PmWikiCoreStylesFmt, "
    <link href='$SkinDirUrl/css/pm-core.css' rel='stylesheet' type='text/css' />");
  
   $HTMLStylesFmt['pmwiki'] = '';
   $HTMLStylesFmt['diff'] = '';
   $HTMLStylesFmt['simuledit'] = '';
   $HTMLStylesFmt['markup'] = '';
   $HTMLStylesFmt['urlapprove'] = '';
   $HTMLStylesFmt['vardoc'] = '';
   $HTMLStylesFmt['wikistyles']= '';
}

# check for javascript cookie, set $javascript var for (:if enabled javascript:) switch  
global $javascript;
if (isset($_COOKIE['javascript'])) $javascript = $_COOKIE['javascript']; 

global $ColorCss, $FontCss, $PageWidth;
$sc = $DefaultColor;
$sf = $DefaultFont;
$sw = $DefaultPageWidth;
$ColorCss = $PageColorList[$sc];
$FontCss = $PageFontList[$sf];
$PageWidth = $PageWidthList[$sw];

# add stylechange.php for cookie setting code if set.
if ($EnableStyleOptions == 1) include_once("$SkinDir/stylechange.php");

# sidebar and rightbar width 
global $HTMLStylesFmt;
$HTMLStylesFmt[] = "
  #sidebar { width: $LeftWidth; }  
  #rightbar { width: $RightWidth; }\n";

## automatic loading of skin default config pages
global $WikiLibDirs, $SkinDir;
    $where = count($WikiLibDirs);
    if ($where>1) $where--;
    array_splice($WikiLibDirs, $where, 0, 
        array(new PageStore("$SkinDir/wikilib.d/\$FullName")));
        
# set default edit form and configuration page
global $XLLangs, $PageEditForm, $SiteGroup; 
SDV($PageEditForm, $SiteGroup.'.Popup-EditForm');
XLPage('triad', 'Site.Triad-Configuration' );
   array_splice($XLLangs, -1, 0, array_shift($XLLangs)); 
   
# popup editform load switch
global $ShowHide, $SiteGroup, $HTMLHeaderFmt, $action;
if ($action=='edit') {
  if($EnablePopupEditForm==1) {
    if (!$ShowHide) include_once("$SkinDir/showhide.php");
    $HTMLHeaderFmt['popupedit'] = "
      <script type='text/javascript'><!--
         document.write(\"<link href='$SkinDirUrl/css/popup2edit.css' rel='stylesheet' type='text/css' />\");
      --></script>
      <noscript>
         <link href='$SkinDirUrl/css/popup2edit-noscript.css' rel='stylesheet' type='text/css' />
      </noscript>
      ";
  }
  else $HTMLHeaderFmt['popupedit'] = "
    <link href='$SkinDirUrl/css/popup2edit-noscript.css' rel='stylesheet' type='text/css' />";
} 

   
# load views script if enabled
if($EnableViewSwitcher==1) {
    $ViewList['big'] = 'big'; # add 'big' to list of view keywords
    SDV($ViewCookie, $CookiePrefix.$SkinName.'_setview');
    include_once("$SkinDir/views.php"); # load views script
  # set inits for 'big' view 
    global $FontSizeDefault, $FontSizeIncrement, $RTInit, $LTInit;
    if($View=='big') {
             $FontSizeDefault = '120'; # base size percentage
             $FontSizeIncrement = '10';      # size increment in percent
             $RShow = '0';            # no right bar initially
             $LShow = '1';            # (0=no) left bar initially
    };
};

## adds fontsizer if enabled.
# Fontsizer action links are inserted by default in Site.PageHeader
# using markup (:fontsizer:). It could be used in other places, like the SideBar.
# Remove (:fontsizer:) markup if not wanted.
if($EnableFontSizer==1) { include_once("$SkinDir/fontsizer.php");
      $HTMLStylesFmt['fontsizer'] = "";}

# set base font size for 'big' view if fontsizer disabled
global $HTMLStylesFmt;
if($EnableFontSizer==0 && $View=='big') {
    $HTMLStylesFmt[] = " body {font-size:150%} "; }

# set TriadSkin as global variable for (:if enable TriadSkin:) markup 
global $TriadSkin;
$TriadSkin = 1;

# add {$PageLogoUrl} to page variables to use on default PageHeader page
global $FmtPV;
$FmtPV['$PageLogoUrl'] = '$GLOBALS["PageLogoUrl"]';

# do not show topmenu bar if PageTopMenu is empty
/*  ===== disabled =====
$gtm = FmtPageName('$Group.PageTopMenu',$pagename);
$stm = FmtPageName('$SiteGroup.PageTopMenu',$pagename);
if (PageExists($gtm)) $page = ReadPage($gtm);
if (@$page['text']=='') $nogtm = 1; 
if (PageExists($stm)) $page = ReadPage($stm);
if (@$page['text']=='') $nostm = 1; 
if (@$nogtm==1 && @$nostm==1){ 
        SetTmplDisplay('PageTopMenuFmt',0);
       };
====== ====== */

## use alternative searchbox markup
include_once("$SkinDir/searchbox2.php");
  

# PageVariables for group links Cluster support (see Cookbook.Cluster)
# Support for Cluster and Hg recipe through $Cfn naming the PV function of each recipe 
$Cfn = array('ClusterPageName','HierarchicalPagenames');
foreach($Cfn as $fn) { 
  if (function_exists($fn)) { 
    $FmtPV['$PageHeader'] = $fn.'($group, "PageHeader")';
    $FmtPV['$TitleBar'] = $fn.'($group, "TitleBar")';
    $FmtPV['$PageTopMenu'] = $fn.'($group, "PageTopMenu")';
    $FmtPV['$SideBar'] = $fn.'($group, "SideBar")';
    $FmtPV['$RightBar'] = $fn.'($group, "RightBar")';
    $FmtPV['$PageFootMenu'] = $fn.'($group, "PageFootMenu")';
    $FmtPV['$PageFooter'] = $fn.'($group, "PageFooter")';
    $FmtPV['$PageSideBarFooter'] = $fn.'($group, "PageSideBarFooter")'; 
    }
}
 
## set var $RBExists if RightBar exists
$RBExists = 0; //init
if ($EnableRightBar==1 || $EnableMarkupShowRight==1) {
  $pageRB = FmtPageName('$FullName-RightBar',$pagename);
  if (PageExists($pageRB))  $RBExists = 1;
  $clusterRB = FmtPageName('{$RightBar}',$pagename); //used with Cluster or Hg 
  if (PageExists($clusterRB)) $RBExists = 1;
  $groupRB = FmtPageName('$Group.RightBar',$pagename);
  if (PageExists($groupRB))  $RBExists = 1;
  $siteRB = FmtPageName('$SiteGroup.RightBar',$pagename);
  if (PageExists($siteRB))  $RBExists = 1;
}

# empty right column logic 
if ($EnableEmptyRightBar==0 && $RBExists==0) SetTmplDisplay('PageRightFmt',0); 
if ($EnableEmptyRightBar==1 && $EnableRightBar==1) SetTmplDisplay('PageRightFmt',1); 

# disable rightbar logic
if (!$EnableRightBar==1) SetTmplDisplay('PageRightFmt',0);

# add left & right bar toggle switches if enabled
if($EnableRightBarToggle==1 || $EnableLeftBarToggle==1) {
    include_once("$SkinDir/togglebars.php"); }

# changes to extended markup recipe for selflink definition:
global $LinkPageSelfFmt;
#$LinkPageSelfFmt = "<a class='selflink'>\$LinkText</a>";

# set HTML title
global $HTMLTitleFmt, $WikiTitle;
$title = PageVar($pagename,'$Title');
$group = PageVar($pagename,'$Group');
SDV($HTMLTitleFmt, "$WikiTitle - $group - $title");

// adding switch for 'Pagename-TitleBar' subpage for fancy font titlebars
$ftb = FmtPageName('$FullName-TitleBar',$pagename);
if(PageExists($ftb))  $HTMLStylesFmt[] = " .titlelink { display:none } \n ";

##========== Special Markups =============================##

## markup (:noleft:)
function NoLeft2() {
    global $LeftToggleFmt;
    $LeftToggleFmt = ""; 
    SetTmplDisplay('PageLeftFmt',0);
    return ''; }
Markup('noleft','directives','/\\(:noleft:\\)/e', 
    "NoLeft2()");

## markup (:noright:) 
function NoRight2() {
    global $RightToggleFmt;
    $RightToggleFmt = ""; 
    SetTmplDisplay('PageRightFmt',0);
    return ''; }
Markup('noright','directives','/\\(:noright:\\)/e', 
    "NoRight2()");

## Markup (:showright:) 
if ($EnableMarkupShowRight==1) {
    Markup('showright','directives','/\\(:showright:\\)/e',  
        "SetTmplDisplay('PageRightFmt',1)"); 
};

## Markup (:notopmenu:)
function NoTopMenu2() {
    global $HTMLStylesFmt;
    SetTmplDisplay('PageTopMenuFmt',0);
    $HTMLStylesFmt[] = "
         #header {border-bottom:1px solid #003466}\n ";   
    return ''; }
Markup('notopmenu','directives','/\\(:notopmenu:\\)/e', 
   "NoTopMenu2()");

## Markup (:nofootmenu:) 
Markup('nofootmenu','directives','/\\(:nofootmenu:\\)/e',
  "SetTmplDisplay('PageFootMenuFmt', 0)");
  
## Markup (:noaction:)
function NoAction2() {
    global $HTMLStylesFmt;
    SetTmplDisplay('PageFootMenuFmt', 0);
    SetTmplDisplay('PageTopMenuFmt',0);
    $HTMLStylesFmt['noaction'] = "
         #header {border-bottom:1px solid #003466}\n ";   
    return ''; }
Markup('noaction','directives','/\\(:noaction:\\)/e',
  "NoAction2()");
  
## Markup (:noheader:) 
Markup('noheader','directives','/\\(:noheader:\\)/e', 
    "SetTmplDisplay('PageHeaderFmt', 0)");
    
## Markup (:notitle:) 
Markup('notitle','directives','/\\(:notitle:\\)/e', 
    "SetTmplDisplay('PageTitleFmt', 0)");
    
## Markup (:nogroup:) 
Markup('nogroup','directives','/\\(:nogroup:\\)/e', 
    "NoGroupTitle($pagename)");
function NoGroupTitle($pagename) {
    global $HTMLStylesFmt;
    $HTMLStylesFmt['nogrouptitle'] = 
    "  .pagegroup {display:none;} \n ";
}
# display or hide group-link in titlebar.
if($EnableGroupTitle==0) NoGroupTitle($pagename);
    
## Markup (:fullpage:)
function FullPage() {
     SetTmplDisplay('PageHeaderFmt', 0);         
     SetTmplDisplay('PageTopMenuFmt',0);
     SetTmplDisplay('PageFootMenuFmt', 0);
     SetTmplDisplay('PageFooterFmt', 0);    
     SetTmplDisplay('PageLeftFmt',0);
     SetTmplDisplay('PageRightFmt',0);  
     return '';
}
Markup('fullpage','directives','/\\(:fullpage:\\)/e',
  "FullPage()");
  
## Markup (:theme colorname fontname:)
function SetTheme($opt) {
   global $ColorCss, $PageColorList, $FontCss, $PageFontList, $PageWidth, $PageWidthList,
   $HTMLHeaderFmt, $HTMLStylesFmt,
   $SkinDirUrl, $EnableThemes, $BackgroundImgUrlFmt, $BackgroundColor;
   $opt = ParseArgs($opt);
   $opt[''] = (array)@$opt[''];
   $sc = (isset($opt['color'])) ? $opt['color'] : array_shift($opt['']);
   $sf = (isset($opt['font']))  ? $opt['font']  : array_shift($opt['']);
   $sw = (isset($opt['width']))  ? $opt['width']  : array_shift($opt['']);
   if (@$PageColorList[$sc]) { 
      $ColorCss = $PageColorList[$sc];
      $HTMLHeaderFmt['skin-color'] = "   
   <link href='$SkinDirUrl/css/$ColorCss' rel='stylesheet' type='text/css' media='screen' />";
   }
   if($sf) {
     if (@$PageFontList[$sf]) {
       $FontCss = $PageFontList[$sf];};
       $HTMLHeaderFmt['skin-font'] = "   
   <link href='$SkinDirUrl/css/$FontCss' rel='stylesheet' type='text/css' media='screen' />";
   }
   if ($sw) {
		TriadSetPageWidth($sw);
	}
   if(isset($opt['background'])) {
      $ColorCss = $PageColorList['trans'];
      $HTMLHeaderFmt['skin-color'] = "   
   <link href='$SkinDirUrl/css/$ColorCss' rel='stylesheet' type='text/css' media='screen' />";
   	$BackgroundImgUrlFmt = $opt['background'];
   	if (isset($opt['bgcolor'])) $BackgroundColor = $opt['bgcolor'];
   	$HTMLHeaderFmt['trans-background'] =  
			"\n  <style type='text/css'><!--".
			"\n	#outer-box { background:url({$BackgroundImgUrlFmt}) fixed; }".
			"\n	body { background-color:{$BackgroundColor}; }". 
			"\n  --></style>";
	}
};
if($EnableThemes == 1) {
    Markup('theme', 'fulltext',
      '/\\(:theme\\s+(.*?)\\s*:\\)/e',
      "SetTheme(PSS('$1'))"); 
}
else {
    Markup('theme', 'fulltext',
      '/\\(:theme\\s+(.*?)\\s*:\\)/e',
      "");
};
  
## add double line horiz rule markup ====
Markup('^====','>^->','/^====+/','<:block,1>
  <hr class="hr-double" />');
  
## removing header, title for history and uploads windows
global $action;
if ($action=='diff' || $action=='upload') { 
		SetTmplDisplay('PageHeaderFmt', 0);
		SetTmplDisplay('PageTitleFmt', 0);
}

## alternative Diff (History) form with link in title
global $PageDiffFmt, $PageUploadFmt;
$PageDiffFmt = "<h3 class='wikiaction'>
  <a href='\$PageUrl'> \$FullName</a> $[History]</h3>
  <p>\$DiffMinorFmt - \$DiffSourceFmt - <a href='\$PageUrl'> $[Cancel]</a></p>";

## alternative Uploads form with link in title 
$PageUploadFmt = array("
  <div id='wikiupload'>
  <h3 class='wikiaction'>$[Attachments for] 
  <a href='\$PageUrl'> {\$FullName}</a></h3>
  <h3>\$UploadResult</h3>
  <form enctype='multipart/form-data' action='{\$PageUrl}' method='post'>
  <input type='hidden' name='n' value='{\$FullName}' />
  <input type='hidden' name='action' value='postupload' />
    <p align='right' style='float:left'>$[File to upload:]
    <input name='uploadfile' type='file' size=50 /></p>
    <p align='right' style='float:left' />$[Name attachment as:]
    <input type='text' name='upname' value='\$UploadName' size=25 />
    <input type='submit' value=' $[Upload] ' /></p>
    </form></div><br clear=all />",
  'wiki:$[{$SiteGroup}/UploadQuickReference]');
  
global $SkinColor;
## defining page variables
$SkinVersionDate = $RecipeInfo['TriadSkin']['Version'];
$SkinVersionNum = str_replace("-","",$SkinVersionDate);
$SkinVersion = $SkinName." ".$SkinVersionDate;
$SkinSourceUrl = 'http://www.pmwiki.org/wiki/Cookbook/'.$SkinRecipeName;
$SkinColor = $sc;
# setting variables as page variables
$FmtPV['$SkinName'] = '$GLOBALS["SkinName"]';
$FmtPV['$SkinVersionDate'] = '$GLOBALS["SkinVersionDate"]';
$FmtPV['$SkinVersionNum'] = '$GLOBALS["SkinVersionNum"]';
$FmtPV['$SkinVersion'] = '$GLOBALS["SkinVersion"]';
$FmtPV['$SkinRecipeName'] = '$GLOBALS["SkinRecipeName"]';
$FmtPV['$SkinSourceUrl'] = 'PUE($GLOBALS["SkinSourceUrl"])';
$FmtPV['$SkinDirUrl'] = 'PUE($GLOBALS["SkinDirUrl"])';
$FmtPV['$SkinColor'] = 'PUE($GLOBALS["SkinColor"])';

## provide backward compatibility for non-relative urls
if ($VersionNum < 2001900) 
      Markup('{*$var}', '<{$var}', '/\\{\\*\\$/', '{$');
######

# add skin style css to template
global $HTMLHeaderFmt;
$HTMLHeaderFmt['skin-layout'] = "
   <link href='$SkinDirUrl/css/layout-triad.css' rel='stylesheet' type='text/css' />
   <link href='$SkinDirUrl/css/layout-main.css' rel='stylesheet' type='text/css' />
   <link href='$SkinDirUrl/css/layout-print.css' rel='stylesheet' type='text/css' media='print' />";  
$HTMLHeaderFmt['skin-font'] = "  
   <link href='$SkinDirUrl/css/$FontCss' rel='stylesheet' type='text/css' media='screen' />";
$HTMLHeaderFmt['skin-color'] = "   
   <link href='$SkinDirUrl/css/$ColorCss' rel='stylesheet' type='text/css' media='screen' />
   ";

if ($sc=='trans') {
	$HTMLHeaderFmt['trans-background'] = " 
		<style type='text/css'><!--
			#outer-box { background:url({$BackgroundImgUrlFmt}) fixed; }
			body { background-color:{$BackgroundColor}; } \n
		--></style>
	";
}	
TriadSetPageWidth($sw);

function TriadSetPageWidth($sw) {
	global $HTMLHeaderFmt, $PageBorder;
	# page width layout
	if ($sw=='800') { 
	return $HTMLHeaderFmt['pagewidth'] = " 
		 <style type='text/css'>
		 body {padding:10px 0;} 
		 #outer-box {width:778px; height:90%;}
		 </style>
		 ";
	}
	if ($sw=='1000'||$sw=='1024') { 
	return $HTMLHeaderFmt['pagewidth'] = " 
		 <style type='text/css'>
		 body {padding:10px 0;} 
		 #outer-box {width:1004px; height:100%;}
		 </style>
		 ";
	}
	if ($sw=='1300'||$sw=='1280') { 
	return $HTMLHeaderFmt['pagewidth'] = " 
		 <style type='text/css'>
		 #outer-box {width:1260px; height:100%;}
		 </style>
		 ";
	}
	if ($sw=='border') { 
	return $HTMLHeaderFmt['pagewidth'] = " 
		 <style type='text/css'>
		 body {padding:$PageBorder;}
		 </style>
		 ";
	}
}

global $EnablePreWrap;
SDV($EnablePreWrap, 1);
# preserve spaces and wrap lines in preformatted text
if($EnablePreWrap==1) { 
  $HTMLHeaderFmt['prewrap'] = "
  <style type='text/css'>
  pre {	white-space: pre-wrap; /* css-3 */
	white-space: -moz-pre-wrap; /* Mozilla, since 1999 */
	white-space: -pre-wrap; /* Opera 4-6 */
	white-space: -o-pre-wrap; /* Opera 7 */
	*break-word: break-all; /* Internet Explorer 7 */
	*white-space: pre;
	* html pre { white-space: normal; /* old IE */ }	
	</style>
  ";
}