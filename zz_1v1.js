initFirebase();

window.WLROOM.onPlayerLeave = function(player) {  
	writeLogins(player, "logout");
	playerqueue.remove(player);
	auth.delete(player.id);

	if (player.team!=0 && hasActivePlayers()) {
	   flushScoreLogs();
	   window.WLROOM.endGame();
	}
	setLock(isFull());
}

window.WLROOM.onGameEnd = function() {		
	let scores = flushScoreLogs();
	computeLoser(scores);
	notifyNextPlayer();

}

window.WLROOM.onPlayerKilled = function(killed, killer) {
	addKill(killed, killer);
}

window.WLROOM.onGameStart = function() {
	startScoreLogs();
}

window.WLROOM.onGameEnd2 = function() {
	let loser = getLoser();
	console.log('onGameEnd2isfull', isFull());
	console.log('onGameEnd2isfull', JSON.stringify(loser));
	if (loser != null && !playerqueue.isEmpty()) {
		window.WLROOM.setPlayerTeam(loser.player.id, 0);
		playerqueue.add(loser.player);
		let pe = playerqueue.shift();
		console.log(`switching ${loser.player.name} with ${pe.name}`);
		window.WLROOM.setPlayerTeam(pe.id, 1);
	}	
	next();
}

window.WLROOM.onPlayerTeamChange = function(p, bp) {
	setLock(isFull());
	if (p.team==0) {
		console.log(`${p.name} moved to spec`);
	} else {
		console.log(`${p.name} moved to game`);
		playerqueue.remove(p);
	}
	
	if (typeof bp!='undefined' && bp !==null && p.id==bp.id && isFull()) {
		console.log("restarting game to get correct start score");
		window.WLROOM.restartGame();
	}	
}

function announce(msg, player, color, style) {
	window.WLROOM.sendAnnouncement(msg, typeof player =='undefined' || player == null?null:player.id, color!=null?color:0xb2f1d3, style !=null?style:"", 1);
}

function notifyAdmins(msg, logNotif = false) {
	getAdmins().forEach((a) => { window.WLROOM.sendAnnouncement(msg, a.id); });
	if (logNotif) {
		notifsRef.push({msg:msg, time:Date.now(), formatted:(new Date(Date.now()).toLocaleString())});
	}
}

function getAdmins() {
	return window.WLROOM.getPlayerList().filter((p) => p.admin);
}

function moveAllPlayersToSpectator() {
    for (let p of window.WLROOM.getPlayerList()) {
        window.WLROOM.setPlayerTeam(p.id, 0);
    }
}

function setLock(b = true) {
	let sett = window.WLROOM.getSettings();
	sett.teamsLocked = b;
	window.WLROOM.setSettings(sett);
}