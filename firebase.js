var fdb;
var commentsRef;
var notifsRef;
var modsRef;
var loginsRef;
var statsRef;
var poolRef;
var settingsRef;

function initFirebase() {
    async function load_scripts(script_urls) {
        function load(script_url) {
            return new Promise(function(resolve, reject) {
                if (load_scripts.loaded.has(script_url)) {
                    resolve();
                } else {
                    var script = document.createElement('script');
                    script.onload = resolve;
                    script.src = script_url
                    document.head.appendChild(script);
                }
            });
        }
        var promises = [];
        for (const script_url of script_urls) {
            promises.push(load(script_url));
        }
        await Promise.all(promises);
        for (const script_url of script_urls) {
            load_scripts.loaded.add(script_url);
        }
    }
    load_scripts.loaded = new Set();

    (async () => {
		await load_scripts([
			'https://www.gstatic.com/firebasejs/7.20.0/firebase-app.js',
			'https://www.gstatic.com/firebasejs/7.20.0/firebase-database.js',
		]);
		
		firebase.initializeApp(CONFIG.firebase);
		fdb = firebase.database();
		commentsRef = fdb.ref(`${CONFIG.room_id}/comments`);
        notifsRef = fdb.ref(`${CONFIG.room_id}/notifs`);
        loginsRef = fdb.ref(`${CONFIG.room_id}/logins`);
        statsRef = fdb.ref(`${CONFIG.room_id}/gamestats`);
        poolRef = fdb.ref(`${CONFIG.room_id}/pool`);
        settingsRef = fdb.ref(`${CONFIG.room_id}/settings`);
        listenForPoolEvents();
        listenForSettingsEvents();
        listenForStatsEvents();
		console.log('firebase ok');

	})();		
}


function writeLogins(p, type ="login") {
    const now = Date.now();

    let a = p.auth??auth.get(p.id)
    
    if (typeof a == 'undefined') {
        return
    }

    loginsRef.child(now).set({name: p.name, auth:a, type:type, formatted:(new Date(now).toLocaleString())});
}

function writeLog(p, msg) {
    const now = Date.now();
    commentsRef.child(now).set({name: p.name, auth:auth.get(p.id), msg:msg, formatted:(new Date(now).toLocaleString())});
}

function writeGameStats(event, stats) {
  const now = Date.now();
  statsRef.child(now).set({event: event, stats:stats});
}

/** mappool */
function listenForPoolEvents() {
    poolRef.on('child_added', loadnewMap);
    poolRef.on('child_changed', loadnewMap);
    poolRef.on('child_removed', removeMap);
}

function loadnewMap(childSnapshot) {
	var v = childSnapshot.val();
	var k = childSnapshot.key;

    mypool[k] = v;
    shufflePool();
	
	console.log("map `"+v+"` has been added to the pool");
    notifyAdmins("map `"+v+"` has been added to the pool");
}

function removeMap(childSnapshot) {
	var k = childSnapshot.key;
	var n = mypool[k];
    delete mypool[k];
    shufflePool();
	console.log("map `"+n+"` has been remove from the pool");
    notifyAdmins("map `"+n+"` has been remove from the pool");
}

/** settings */
function listenForSettingsEvents() {
    settingsRef.on('value', updateSettings);
}

function updateSettings(snapshot) {
    let v = snapshot.val();
    let sett = window.WLROOM.getSettings();
    for(let s in v) {
        sett[s] = v[s];
    } 
    sett.teamsLocked = isFull();
    window.WLROOM.setSettings(sett);
    window.settingsSnap = sett;
}

COMMAND_REGISTRY.add("reset", ["!reset: resets to last settings loaded from database"], (player) => {
    window.WLROOM.setSettings(window.settingsSnap);
    return false;
}, true);


COMMAND_REGISTRY.add("poolreload", ["!poolreload: reloads the map pool from database from database"], (player) => {
    poolRef = fdb.ref(`${CONFIG.room_id}/pool`);    
    listenForPoolEvents();
    mypool = {};
    mypoolIdx = [];
    return false;
}, true);