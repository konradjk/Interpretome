<?php if (!defined('PmWiki')) exit();

/* alternative searchbox function & markup, with onfocus and onblur events
   fully capable of pmwiki's advanced pagelist and search results functions.
*/
## versiondate: 2006-11-25

## redefine searchbox format:
function SearchBox2($pagename, $opt) {
  global $SearchBoxOpt, $SearchQuery, $EnablePathInfo;
 SDVA($SearchBoxOpt, array(
    'size'   => '20', 
    'label'  => FmtPageName('$[Search]', $pagename),
    'value'  => str_replace("'", "&#039;", $SearchQuery)));
 $opt = array_merge((array)$SearchBoxOpt, (array)$opt);
 $focus = $opt['focus'];
 $opt['action'] = 'search';
 if(isset($opt['target'])) $target = MakePageName($pagename, $opt['target']); 
 else $target = $pagename;
 $out = FmtPageName(" class='wikisearch' action='\$PageUrl' method='get'><div>", $target);
 $opt['n'] = IsEnabled($EnablePathInfo, 0) ? '' : $target;
 $out .= 
   "<input type='text' name='q' value='{$opt['value']}' class='inputbox searchbox' size='{$opt['size']}' ";
 if ($focus) $out .= "
    onfocus=\"preval=this.value; this.value=''; \" ";
 $out .= " /> <input type='submit' class='inputbutton searchbutton' value='{$opt['label']}' />";
 foreach($opt as $k => $v) {
   if ($v == '' || is_array($v)) continue;
   if ($k=='q' || $k=='label' || $k=='value' || $k=='size') continue;
   $k = str_replace("'", "&#039;", $k);
   $v = str_replace("'", "&#039;", $v);
   $out .= 
   "<input type='hidden' name='$k' value='$v' />";
 }
 return "<form ".Keep($out)."</div></form>";
}
Markup('searchbox', '>links',
  '/\\(:searchbox(\\s.*?)?:\\)/e',
  "SearchBox2(\$pagename, ParseArgs(PSS('$1')))");