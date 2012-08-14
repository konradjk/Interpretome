<?php if (!defined('PmWiki')) exit();

/*  Copyright 2005 Hans Bracker
    This file is part of PmWiki; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.  See pmwiki.php for full details.

    This script adds the following tools to help implement Views features:
    $View variable from a list $ViewList, 
    ?setview=... cookie switcher and ?view=... switcher,
    (:if view ... :) conditional markup, 
    {$View} page variable.
*/
global $FmtPV, $View, $EnableViewSwitching;

## Default view
SDV($View,'standard');

# show content if views are not installed with (:if !enabled views:)
$views = 1; 

## enable view switching
SDV($EnableViewSwitching,1);

## defining $ViewList array:
SDVA($ViewList, array(
        'standard' => 'standard', 
        'author' => 'author', 
        'admin' => 'admin',
        'display' => 'display',
        ));

global $Now, $CookiePrefix ;
SDV($ViewCookie, $CookiePrefix.'setview');
## if enabled $View can be set with a cookie by ?setview=....
## and without a cookie by ?view=....
## setview cookie routine:
if($EnableViewSwitching == 1) {
    SDV($ViewCookieExpires,$Now+60*60*24*365);
    if (isset($_COOKIE[$ViewCookie])) $sv = $_COOKIE[$ViewCookie];
    if (isset($_GET['setview'])) {
    $sv = $_GET['setview'];
    setcookie($ViewCookie,$sv,$ViewCookieExpires,'/');
    }
    if (isset($_GET['view'])) $sv = $_GET['view'];
    if (@$ViewList[$sv]) $View = $ViewList[$sv];
};

## add {$View} page variable
$FmtPV['$View'] = '$GLOBALS["View"]';

## (:if view viewname:) conditional markup:
$Conditions['view'] = "\$GLOBALS['View']==\$condparm";
$Conditions['View'] = "\$GLOBALS['View']==\$condparm";
