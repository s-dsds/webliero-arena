var mapCache = new Map();
var baseURL = "https://webliero.gitlab.io/webliero-maps";
var mypool = [
    "hellhole/arena711.lev",
    "hellhole/cathode.lev",
    "hellhole/deathruw.lev",
    "hellhole/fallout2.lev",
    "hellhole/Memory.lev",
    "hellhole/tiger.lev",
    "hellhole/Saloon.lev",
    "hellhole/Simple.lev",
    "hellhole/RU.LEV",
    "hellhole/pokol2.lev",
    //"hellhole/pyramid_1.lev",
    "hellhole/Cheese.lev",
    "hellhole/INDIA2.LEV",
    "hellhole/MITH.lev",
    "hellhole/TEMPLE27.LEV",

    "神風/2xring.png",
    "神風/cleanarena.png",
    "神風/cleanarena_inv.png",
    "神風/curry_a.png",
    "神風/curry_b.png",
    "神風/despair.png",
    "神風/kaboom.png",
    "神風/meow.png",
    "神風/pymid.png",
    "神風/remake2duel2.png",
    "神風/vpr_a.png",
    "神風/vpr_b.png",
    
    "kangaroo/yennefer.png",
    "kangaroo/giger3.png",
    "kangaroo/gonad2.png",
    "kangaroo/blat2.png",
    "kangaroo/poo_arena.png",
];

var currentMap = 0;
var currentMapName = "";

function loadPool(name) {
	(async () => {
	mypool = await (await fetch(baseURL + '/' +  name)).json();
	})();
}

async function getMapData(name) {
    let x = 504;
    let y = 350;

    let obj = mapCache.get(name)
    if (obj) {
      return obj;
    }
    if (name.split('.').pop()=="png") {    
       obj = await getPngMapData(name);
    } else {
        let buff = await (await fetch(baseURL + '/' +  name)).arrayBuffer();
        let arr = Array.from(new Uint8Array(buff)).slice(0, x*y);
        obj = {x:x,y:y,data:arr};
    }
    
    mapCache.set(name, obj)
    return obj;
}

var pixConvFailures = 0;
	
function getbestpixelValue(red,green,blue) {
    let colorVal = Array.prototype.slice.call(arguments).join("_");;
    if (invPal.get(colorVal)==undefined) {
            pixConvFailures++;		
            return 1;
            
        } 
        return invPal.get(colorVal);		
}

async function getPngMapData(name) {
    pixConvFailures = 0;
    let blob = await (await fetch(baseURL + '/' +  name)).blob();
    let img = new Image();
    const imageLoadPromise = new Promise(resolve => {        
      img.onload = resolve;
      img.src = URL.createObjectURL(blob);
    });
    await imageLoadPromise;

    let ret = {x:img.width, y: img.height, data:[]};
    let canvas = document.createElement("canvas");
    canvas.width  = ret.x;
    canvas.height = ret.y;
    let ctx = canvas.getContext("2d", {alpha: false});
    ctx.drawImage(img, 0, 0, ret.x, ret.y);
    
    let imgData = ctx.getImageData(0, 0, ret.x, ret.y);
    console.log("data len x y", imgData.data.length, ret.x, ret.y , ret.x * ret.y, imgData.data.length/4);
    for (let i = 0; i < imgData.data.length; i += 4) {
      ret.data.push(getbestpixelValue(imgData.data[i],imgData.data[i + 1],imgData.data[i + 2]));
    }
    console.log("pix failures", pixConvFailures);
    return ret;
}


function loadMap(name, data) {
    console.log(data.data.length);
    console.log(data.data[2]);
    let buff=new Uint8Array(data.data).buffer;
    window.WLROOM.loadRawLevel(name,buff, data.x, data.y);
}

function resolveNextMap() {
    currentMap=currentMap+1<mypool.length?currentMap+1:0;
    currentMapName = mypool[currentMap];
}

function next() {
    resolveNextMap();

    loadMapByName(currentMapName);
}


function loadMapByName(name) {
    console.log(name);
    (async () => {
        let data = await getMapData(name);
        
	    loadMap(name, data);
    })();
}


function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

function shufflePool() {
    shuffleArray(mypool)
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}


COMMAND_REGISTRY.add("map", ["!map #mapname#: load lev map from gitlab webliero.gitlab.io"], (player, ...name) => {
    let n = name.join(" ").trim();
    if (n == "") {
        announce("map name is empty ",player, 0xFFF0000);
    }
    currentMapName = n;
    loadMapByName(currentMapName);
    return false;
}, true);

COMMAND_REGISTRY.add("mapi", ["!mapi #index#: load map by pool index"], (player, idx) => {
    if (typeof idx=="undefined" || idx=="" || isNaN(idx) || idx>=mypool.length) {
        announce("wrong index, choose any index from 0 to "+(mypool.length-1),player, 0xFFF0000);
        return false;
    }
    currentMapName = mypool[idx];
    loadMapByName(currentMapName);
    return false;
}, true);

COMMAND_REGISTRY.add("clearcache", ["!clearcache: clears local map cache"], (player) => {
    mapCache = new Map();
    return false;
}, true);
