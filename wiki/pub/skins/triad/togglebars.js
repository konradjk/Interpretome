//javascript to toggle right and left bar
//toggle button
//rshow="1"; // global to save state
function toggleRight() {
if (rshow == "1") {
  if (toggleCookies== "1") document.cookie=rcookie+"=0; path=/";
  rshow="0";
  hideRight(); //start code 
  copy ='<input name="b" type="button" value="&darr; '+show+'" ';
  copy+='class="togglebox" onclick="toggleRight();" />';
  document.getElementById('toggleright').innerHTML=copy;
  } 
  else if(rshow == "0") {
  if (toggleCookies== "1") document.cookie=rcookie+"=1; path=/";
  rshow="1";
  showRight(); //stop code 
  copy ='<input name="b" type="button" value="&darr; '+hide+'" ';
  copy+='class="togglebox" onclick="toggleRight();" />';
  document.getElementById('toggleright').innerHTML=copy;
  }
}

//hide and show rightbar
function hideRight() {
  if(document.getElementById) {
    document.getElementById('rightbar').style.display ="none";
    document.getElementById('right-box').style.width = "1px";
    }
return "";
};

function showRight() {
  if(document.getElementById) {
    document.getElementById('rightbar').style.display ="block";
    document.getElementById('right-box').style.width = rwidth;
    }
 return "";
};

//=============================================================//

//toggle button
//lshow="1"; // global to save state
function toggleLeft() {
if (lshow == "1") {
  if (toggleCookies== "1") document.cookie=lcookie+"=0; path=/";
  lshow="0";
  hideLeft(); //start code 
  copy ='<input name="lb" type="button" value="'+show+' &darr;" ';
  copy+='class="togglebox" onclick="toggleLeft();" />';
  document.getElementById('toggleleft').innerHTML = copy;
  } 
  else if(lshow == "0"){
  if (toggleCookies== "1") document.cookie=lcookie+"=1; path=/";
  lshow="1";
  showLeft(); //stop code 
  copy ='<input name="lb" type="button" value="'+hide+' &darr;" ';
  copy+='class="togglebox" onclick="toggleLeft();" />';
  document.getElementById('toggleleft').innerHTML = copy;
  }
}

//hide and show left bar
function hideLeft() {
  if(document.getElementById) {
    document.getElementById('sidebar').style.display ="none";
    document.getElementById('left-box').style.width = "1px";
    }
return "";
};

function showLeft() {
  if(document.getElementById) {
    document.getElementById('sidebar').style.display ="block";
    document.getElementById('left-box').style.width = lwidth;
    }
 return "";
};
