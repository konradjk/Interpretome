<?php if (!defined('PmWiki')) exit();

/*  Copyright 2006 Hans Bracker. 
    This file is showhide.php; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published
    by the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
    
    (:showhide:) creates a toggle button, which can show or hide a division
    or object on the page, for instance a div created with
    >>id=divisionname<< 
    text can be hidden/shown 
    >><< 
    Necessary parameters: (:showhide div=divisionname:) 
    Optional parameters:
    init=hide  hides the division initially (default is show)
    lshow=labelname  label of button when div is hidden (default is Show)
    lhide=labelname label of button when div is shown (default is Hide)
*/ 
define(SHOWHIDE_VERSION, '2006-08-19');

# declare $ShowHide to be able to check if showhide
global $ShowHide; $ShowHide = 1;

## add markup (:showhide:)
Markup('showhide', 'directives',
  '/\\(:showhide\\s*(.*?):\\)/ei',
  "ShowHide(\$pagename, PSS('$1'))");
  
## one function to do it all, taking parameters from markup
function ShowHide($pagename,$opt) {
  global $HTMLHeaderFmt, $HTMLStylesFmt;
  $defaults = array(
      'div' => '',
      'init' => 'show',
      'lshow' => FmtPageName('$[Show]', $pagename),
      'lhide' => FmtPageName('$[Hide]', $pagename),
      'div2' => '',
      );
  $opt = array_merge($defaults, ParseArgs($opt));
  
  # add javascript to html header
  $HTMLHeaderFmt['showhideobj'] = "
  <script type='text/javascript' ><!--
    function showHide(obj,init,lshow,lhide,swap) {
        var Ar = new Array(obj,init,lshow,lhide,swap);
        var elstyle = document.getElementById(obj).style;
        var button    = document.getElementById(obj + \"-but\");
        if (Ar[1]=='show') {
            Ar[1]='hide';
            elstyle.display = 'none';
            if(Ar[4]) document.getElementById(swap).style.display = 'block';
            copy ='<input type=\"button\" value=\"'+Ar[2];
            copy+='\" class=\"inputbutton togglebutton\" ';
            copy+='onclick=\"showHide(\''+Ar[0]+'\',\''+Ar[1]+'\',\''+Ar[2];
            copy+='\',\''+Ar[3]+'\',\''+Ar[4]+'\');\" />';
            button.innerHTML = copy;
            } 
        else if (Ar[1]=='hide') {
            Ar[1]='show';
            elstyle.display = 'block';
            if(Ar[4]) document.getElementById(swap).style.display = 'none';
            copy ='<input type=\"button\" value=\"'+Ar[3];
            copy+='\" class=\"inputbutton togglebutton\" ';
            copy+='onclick=\"showHide(\''+Ar[0]+'\',\''+Ar[1]+'\',\''+Ar[2];
            copy+='\',\''+Ar[3]+'\',\''+Ar[4]+'\');\" />';
            button.innerHTML = copy;
            }
       }    
  --></script> ";

  # if init=hide is set initially add css code to hide  div 
  if($opt['div2']) 
     $opt['init']=="hide" ? "" : $HTMLStylesFmt[] = " #{$opt['div2']} {display:none} \n" ;
  $opt['init']=="hide" ? $HTMLStylesFmt[] = " #{$opt['div']} {display:none} \n" : "";
  

  # initially place button with onclick call to javascript function
  return "<span id='{$opt['div']}-but'><input ".Keep("class='inputbutton togglebutton' type='button' ".
       ($opt['init']=="show" ? "value='{$opt['lhide']}'" : "value='{$opt['lshow']}'") .
       " onclick=\"showHide('{$opt['div']}','{$opt['init']}','{$opt['lshow']}','{$opt['lhide']}','{$opt['div2']}')\" /></span>");
}
#end of ShowHide function

