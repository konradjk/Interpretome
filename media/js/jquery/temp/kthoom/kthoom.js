/*
 * kthoom.js
 *
 * Licensed under the MIT License
 *
 * Copyright(c) 2011 Google Inc.
 * Copyright(c) 2011 antimatter15
 */

/* Reference Documentation:

  * Web Workers: http://www.whatwg.org/specs/web-workers/current-work/
  * Web Workers in Mozilla: https://developer.mozilla.org/En/Using_web_workers
  * File API (FileReader): http://www.w3.org/TR/FileAPI/
  * Typed Arrays: http://www.khronos.org/registry/typedarray/specs/latest/#6

*/

if (!window.console) {
  window.console = {};
  window.console.log = function(str) {};
  window.console.dir = function(str) {};
}
if (window.opera) {
  window.console.log = function(str) {opera.postError(str);};
  window.console.dir = function(str) {};
}

window.kthoom = {};

// key codes
var Key = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, 
A: 65, B: 66, C: 67, D: 68, E: 69, F: 70, G: 71, H: 72, I: 73, J: 74, K: 75, L: 76, M: 77, 
N: 78, O: 79, P: 80, Q: 81, R: 82, S: 83, T: 84, U: 85, V: 86, W: 87, X: 88, Y: 89, Z: 90};

// global variables
var worker;
var currentImage = 0,
  imageFiles = [],
  imageFilenames = [];
var totalImages = 0;
var lastCompletion = 0;

  
var rotateTimes = 0, hflip = false, vflip = false, fitMode = Key.B;

function saveSettings() {
  localStorage.kthoom_settings = JSON.stringify({
    rotateTimes: rotateTimes,
    hflip: hflip,
    vflip: vflip,
    fitMode: fitMode
  });
}

function loadSettings() {
  try {
    if (localStorage.kthoom_settings.length < 10) return;
    var s = JSON.parse(localStorage.kthoom_settings);
    rotateTimes = s.rotateTimes;
    hflip = s.hflip;
    vflip = s.vflip;
    fitMode = s.fitMode;
  } catch(err) {
  }
}


// stores an image filename and its data: URI
// TODO: investigate if we really need to store as base64 (leave off ;base64 and just
//       non-safe URL characters are encoded as %xx ?)
//       This would save 25% on memory since base64-encoded strings are 4/3 the size of the binary
var ImageFile = function(filename, imageString, metadata) {
  this.filename = filename;
  this.dataURI = imageString;
  this.data = metadata;
};

// gets the element with the given id
function getElem(id) {
  if (document.documentElement.querySelector) {
    // querySelector lookup
    return document.body.querySelector('#'+id);
  }  
  // getElementById lookup
  return document.getElementById(id);
}

function resetFileUploader() {
  getElem("uploader").innerHTML = '<input id="filechooser" type="file"/>';
  getElem("filechooser").addEventListener("change", getFile, false);
}

function initProgressMeter() {
  var svgns = "http://www.w3.org/2000/svg";
  var pdiv = document.getElementById("progress");
  var svg = document.createElementNS(svgns, "svg");
  svg.style.width = '100%';
  
  var defs = document.createElementNS(svgns, "defs");

  var patt = document.createElementNS(svgns, "pattern");
  patt.id = "progress_pattern";
  patt.setAttribute("width", "30");
  patt.setAttribute("height", "20");
  patt.setAttribute("patternUnits", "userSpaceOnUse");

  var rect = document.createElementNS(svgns, "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  rect.setAttribute("fill", "#cc2929");
  
  var poly = document.createElementNS(svgns, "polygon");
  poly.setAttribute("fill", "#c9cc29");
  poly.setAttribute("points", "15,0 30,0 15,20 0,20");

  patt.appendChild(rect);
  patt.appendChild(poly);
  defs.appendChild(patt);
  
  svg.appendChild(defs);
  
  var g = document.createElementNS(svgns, "g");
  
  var outline = document.createElementNS(svgns, "rect");
  outline.setAttribute("y", "1");
  outline.setAttribute("width", "100%");
  outline.setAttribute("height", "15");
  outline.setAttribute("fill", "#777");
  outline.setAttribute("stroke", "white");
  outline.setAttribute("rx", "5");
  outline.setAttribute("ry", "5");
  g.appendChild(outline);

  var title = document.createElementNS(svgns, "text");
  title.id = "progress_title";
  title.appendChild(document.createTextNode("0%"));
  title.setAttribute("y", "13");
  title.setAttribute("x", "99.5%");
  title.setAttribute("fill", "white");
  title.setAttribute("font-size", "12px");
  title.setAttribute("text-anchor", "end");
  g.appendChild(title);

  var meter = document.createElementNS(svgns, "rect");
  meter.id = "meter";
  meter.setAttribute("width", "0%");
  meter.setAttribute("height", "17");
  meter.setAttribute("fill", "url(#progress_pattern)");
  meter.setAttribute("rx", "5");
  meter.setAttribute("ry", "5");
  
  var meter2 = document.createElementNS(svgns, "rect");
  meter2.id = "meter2";
  meter2.setAttribute("width", "0%");
  meter2.setAttribute("height", "17");
  meter2.setAttribute("opacity", "0.8");
  meter2.setAttribute("fill", "#007fff");
  meter2.setAttribute("rx", "5");
  meter2.setAttribute("ry", "5");
  
  g.appendChild(meter);
  g.appendChild(meter2);
  
  var page = document.createElementNS(svgns, "text");
  page.id = "page";
  page.appendChild(document.createTextNode("0/0"));
  page.setAttribute("y", "13");
  page.setAttribute("x", "0.5%");
  page.setAttribute("fill", "white");
  page.setAttribute("font-size", "12px");
  g.appendChild(page);
  
  
  svg.appendChild(g);
  pdiv.appendChild(svg);
  
  svg.onclick = function(e) {
    for (var x = pdiv, l = 0; x != document.documentElement; x = x.parentNode) l += x.offsetLeft;
    var page = Math.max(1, Math.ceil(((e.clientX - l)/pdiv.offsetWidth) * totalImages)) - 1;
    console.log(e,l);
    currentImage = page;
    updatePage();
  };
}

function setProgressMeter(pct) {
  var pct = (pct*100);
  var part = 1/totalImages;
  var remain = ((pct - lastCompletion)/100)/part;
  var fract = Math.min(1, remain);
  var smartpct = ((imageFiles.length/totalImages) + fract * part )* 100;
  if (totalImages == 0) smartpct = pct;
  //console.log(smartpct);
  
   // + Math.min((pct - lastCompletion), 100/totalImages * 0.9 + (pct - lastCompletion - 100/totalImages)/2, 100/totalImages);
  var oldval = parseFloat(getElem("meter").getAttribute('width'));
  if (isNaN(oldval)) oldval = 0;
  var weight = 0.5;
  smartpct = (weight * smartpct + (1-weight) * oldval);
  if (pct == 100) smartpct = 100;
    
  if (!isNaN(smartpct)) {
    getElem("meter").setAttribute("width", smartpct + '%');
  }
  var title = getElem("progress_title");
  while (title.firstChild) title.removeChild(title.firstChild);

  title.appendChild(document.createTextNode(pct.toFixed(2) + "% " + imageFiles.length + "/" + totalImages + ""));
  // fade it out as it approaches finish
  //title.setAttribute("fill-opacity", (pct > 90) ? ((100-pct)*5)/100 : 1);

  getElem("meter2").setAttribute("width", 100 * (totalImages == 0 ? 0 : ((currentImage+1)/totalImages)) + '%');
  
  var title = getElem("page");
  while (title.firstChild) title.removeChild(title.firstChild);
  title.appendChild(document.createTextNode(  (currentImage+1) + "/" + totalImages  ));
  
  
  if (pct > 0) {
    getElem("nav").className = "";
    getElem("progress").className = "";
  }
}

// attempts to read the file that the user has chosen
function getFile(evt) {
  var inp = evt.target;
  var filelist = inp.files;
  if (filelist.length == 1) {
    closeBook();
    
    var start = (new Date).getTime();

    var fr = new FileReader();
    fr.onload = function() {
      var ab = fr.result;
      var h = new Uint8Array(ab, 0, 10);
      var pathToBitJS = "bitjs/";
      var unarchiver = null;
      if (h[0] == 0x52 && h[1] == 0x61 && h[2] == 0x72 && h[3] == 0x21) { //Rar!
        unarchiver = new bitjs.archive.Unrarrer(ab, pathToBitJS);
      } else if (h[0] == 80 && h[1] == 75) { //PK (Zip)
        unarchiver = new bitjs.archive.Unzipper(ab, pathToBitJS);
      } else { // Try with tar
        unarchiver = new bitjs.archive.Untarrer(ab, pathToBitJS);
      }
      // Listen for UnarchiveEvents.
      if (unarchiver) {
        unarchiver.addEventListener(bitjs.archive.UnarchiveEvent.Type.PROGRESS,
          function(e) {
            var percentage = e.currentBytesUnarchived / e.totalUncompressedBytesInArchive;
            totalImages = e.totalFilesInArchive;
            setProgressMeter(percentage);
            // display nav
            lastCompletion = percentage * 100;
            
          });
        unarchiver.addEventListener(bitjs.archive.UnarchiveEvent.Type.EXTRACT,
          function(e) {
            // convert DecompressedFile into a bunch of ImageFiles
            if (e.unarchivedFile) {
              var f = e.unarchivedFile;
              // add any new pages based on the filename
              if (imageFilenames.indexOf(f.filename) == -1) {
                imageFilenames.push(f.filename);
                imageFiles.push(new ImageFile(f.filename, createURLFromArray(f.fileData), f));
              }
            }
            
            // hide logo
            getElem("logo").setAttribute("style", "display:none");

            // display first page if we haven't yet
            if (imageFiles.length == currentImage + 1) {
              updatePage();
            }            
          });
        unarchiver.addEventListener(bitjs.archive.UnarchiveEvent.Type.FINISH,
          function(e) {
            var diff = ((new Date).getTime() - start)/1000;
            console.log("Unarchiving done in " + diff + "s");
            
          })
        unarchiver.start();
      } else {
        alert("Some error");
      }
    };
    fr.readAsArrayBuffer(filelist[0]);
  }
}


function createURLFromArray(array) {
  var bb, url;
  var bb = (typeof BlobBuilder == 'function' ? (new BlobBuilder()) : //Chrome 8
             (typeof WebKitBlobBuilder == 'function' ? (new WebKitBlobBuilder()) : //Chrome 12
               (typeof MozBlobBuilder == 'function' ? (new MozBlobBuilder()) : //Firefox 6
             null)));
  if (!bb) return false;
  bb.append(array.buffer);
  var offset = array.byteOffset, len = array.byteLength;
  var blob = bb.getBlob();
  
  if (blob.webkitSlice) { //Chrome 12
    blob = blob.webkitSlice(offset, offset + len);
  } else if(blob.mozSlice) { //Firefox 5
    blob = blob.mozSlice(offset, offset + len);
  } else if(blob.slice) { //
    blob = blob.slice(2, 3).length == 1 ? 
      blob.slice(offset, offset + len) : //future behavior
      blob.slice(offset, len); //Old behavior
  }
  
  var url = (typeof createObjectURL == 'function' ? createObjectURL(blob) : //Chrome 9?
              (typeof createBlobURL == 'function' ? createBlobURL(blob) : //Chrome 8
                ((typeof URL == 'object' && typeof URL.createObjectURL == 'function') ? URL.createObjectURL(blob) : //Chrome 15? Firefox
                  ((typeof webkitURL == 'object' && typeof webkitURL.createObjectURL == 'function') ? webkitURL.createObjectURL(blob) : //Chrome 10
                    ''))));
  return url;
}


function updatePage() {
  var title = getElem("page");
  while (title.firstChild) title.removeChild(title.firstChild);
  title.appendChild(document.createTextNode(  (currentImage+1) + "/" + totalImages  ));
  
  getElem("meter2").setAttribute("width", 100 * (totalImages == 0 ? 0 : ((currentImage+1)/totalImages)) + '%');
  if (imageFiles[currentImage]) {
    setImage(imageFiles[currentImage].dataURI);
  } else {
    setImage('loading');
  }
}

function setImage(url) {
  var canvas = getElem('mainImage'), 
      x = canvas.getContext('2d');
  document.getElementById('mainText').style.display = 'none';
  if (url == 'loading') {
    updateScale(true);
    canvas.width = innerWidth - 100;
    canvas.height = 200;
    x.fillStyle = 'red';
    x.font = '50px sans-serif';
    x.strokeStyle = 'black';
    x.fillText("Loading Page #"+(currentImage+1), 100, 100)
  } else {
    if (document.body.scrollHeight/innerHeight > 1) {
      document.body.style.overflowY = 'scroll';
    }
    
    var img = new Image();
    img.onerror = function() {
      canvas.width = innerWidth - 100;
      canvas.height = 300;
      updateScale(true);
      x.fillStyle = 'orange';
      x.font = '50px sans-serif';
      x.strokeStyle = 'black';
      x.fillText("Page #"+(currentImage+1)+" ("+imageFiles[currentImage].filename+")", 100, 100)
      x.fillStyle = 'red';
      x.fillText("Is corrupt or not an image", 100, 200);
      
      if (/(html|htm)$/.test(imageFiles[currentImage].filename)) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
          document.getElementById('mainText').style.display = '';
          document.getElementById('mainText').innerHTML = '<iframe style="width:100%;height:700px;border:0" src="data:text/html,'+escape(xhr.responseText)+'"></iframe>';
        }
        xhr.send(null);
      } else if (!/(jpg|jpeg|png|gif)$/.test(imageFiles[currentImage].filename) && imageFiles[currentImage].data.uncompressedSize < 10*1024) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function() {
          document.getElementById('mainText').style.display = '';
          document.getElementById('mainText').innerText = xhr.responseText;
        };
        xhr.send(null);
      }
    };
    img.onload = function() {
      var h = img.height, 
          w = img.width, 
          sw = w, 
          sh = h;
      rotateTimes =  (4 + rotateTimes) % 4;
      x.save();
      if (rotateTimes % 2 == 1) { sh = w; sw = h;}
      canvas.height = sh;
      canvas.width = sw;
      x.translate(sw/2, sh/2);
      x.rotate(Math.PI/2 * rotateTimes);
      x.translate(-w/2, -h/2);
      if (vflip) {
        x.scale(1, -1)
        x.translate(0, -h);
      }
      if (hflip) {
        x.scale(-1, 1)
        x.translate(-w, 0);
      }
      canvas.style.display = 'none';
      scrollTo(0,0);
      x.drawImage(img, 0, 0);
      
      updateScale();
        
      canvas.style.display = '';
      document.body.style.overflowY = '';
      x.restore();
    };
    img.src = url;
  };
}

function showPreview() {
  if (/fullscreen/.test(getElem("header").className)) {
    getElem("header").className += ' preview';
    setTimeout(function() {
      getElem("header").className += ' previewout';
      setTimeout(function() {
        getElem("header").className = getElem("header").className.replace(/previewout|preview/g,'');
      }, 1000);
    }, 1337);
  }
}

function showPrevPage() {
  currentImage--;
  if (currentImage < 0) currentImage = imageFiles.length - 1;
  updatePage();
  //showPreview();
  //getElem("prev").focus();
}

function showNextPage() {
  currentImage++;
  
  if (currentImage >= Math.max(totalImages, imageFiles.length)) currentImage = 0;
  updatePage();
  //showPreview();
  //getElem("next").focus();
}

function toggleToolbar() {
  var s = /fullscreen/.test(getElem("header").className);
  getElem("header").className = s?'':'fullscreen';
  //getElem("toolbarbutton").innerText = s?'-':'+';
  updateScale();
}

function closeBook() {
  if (worker) worker.terminate();
  currentImage = 0;
  imageFiles = [];
  imageFilenames = [];
  totalImages = 0;
  lastCompletion = 0;
  // clear file upload
  resetFileUploader();
  
  // display logo
  getElem("logo").setAttribute("style", "display:block");
  
  getElem("nav").className = "hide";
  getElem("progress").className = "hide";
  
  getElem("meter").setAttribute("width", '0%');
  
  setProgressMeter(0);
  updatePage();
}

function updateScale(clear) {
  getElem('mainImage').style.width='';
  getElem('mainImage').style.height='';
  getElem('mainImage').style.maxWidth='';
  getElem('mainImage').style.maxHeight='';
  var maxheight = innerHeight - 15;
  if (!/fullscreen/.test(getElem("header").className)) {
    maxheight -= 25;
  }
  if (clear || fitMode == Key.N) {
  } else if (fitMode == Key.B) {
    getElem('mainImage').style.maxWidth = '100%';
    getElem('mainImage').style.maxHeight = maxheight+'px'
  } else if(fitMode == Key.H) {
    getElem('mainImage').style.height = maxheight+'px'
  } else if(fitMode == Key.W) {
    getElem('mainImage').style.width = '100%';
  }
  saveSettings();
}

var canKeyNext = true, canKeyPrev = true;

function keyHandler(evt) {
  var code = evt.keyCode;
  if (code == Key.O) {
    getElem('filechooser').click();
  }
  if (getComputedStyle(getElem("progress")).display == 'none') return;
  canKeyNext = ((document.body.offsetWidth+document.body.scrollLeft)/ document.body.scrollWidth) >= 1;
  canKeyPrev = (scrollX <= 0);

  if (evt.ctrlKey || evt.shiftKey || evt.metaKey) return;
  switch(code) {
    case Key.X:
      toggleToolbar();
      break;
    case Key.LEFT:
      if(canKeyPrev) showPrevPage();
      break;
    case Key.RIGHT:
      if(canKeyNext) showNextPage();
      break;
    case Key.L:
      rotateTimes--;
      updatePage();
      break;
    case Key.R:
      rotateTimes++;
      updatePage();
      break;
    case Key.F:
      if (!hflip && !vflip) {
        hflip = true;
      } else if(hflip == true) {
        vflip = true;
        hflip = false;
      } else if(vflip == true) {
        vflip = false;
      }
      updatePage();
      break;
    case Key.W:
      fitMode = Key.W;
      updateScale();
      break;
    case Key.H:
      fitMode = Key.H;
      updateScale();
      break;
    case Key.B:
      fitMode = Key.B;
      updateScale();
      break;
    case Key.N:
      fitMode = Key.N;
      updateScale();
      break;
    default:
      //console.log("KeyCode = " + code);
      break;
  }
}

// attaches a change event listener to the file input control
function init() {
  if (!window.FileReader) {
    alert("Sorry, kthoom will not work with your browser because it does not support the File API.  Please try kthoom with Chrome 12+ or Firefox 7+");
  }
  else {
    initProgressMeter();
    document.body.className += /AppleWebKit/.test(navigator.userAgent)?' webkit':'';
    resetFileUploader();
    loadSettings();
    // add key handler
    document.addEventListener("keydown", keyHandler, false);
    window.addEventListener("resize", function() {
      var f = (screen.width - innerWidth < 4 && screen.height - innerHeight < 4);
      getElem("header").className = f?'fullscreen':'';
      updateScale();
    }, false);
  }
}

