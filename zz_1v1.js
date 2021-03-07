initFirebase();

window.WLROOM.onPlayerJoin = (player) => {
	if (admins.has(player.auth) ) {
		window.WLROOM.setPlayerAdmin(player.id, true);
	}
	auth.set(player.id, player.auth);
	writeLogins(player);

	announce("Welcome to the duel arena", player, 0xFF2222, "bold");

	if (isFull()) {
		announce("game is running already, if you want to play type !join to enter the waiting queue", player, 0xDD2222);
	}
	
	announce("please join us on discord if you're not there yet! "+CONFIG.discord_invite, player, 0xDD00DD, "italic");
	if (player.auth){		
		auth.set(player.id, player.auth);
	}
}

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
	if (loser != null && !playerqueue.isEmpty() && isFull()) {
		window.WLROOM.setPlayerTeam(loser.id, 0);
		playerqueue.add(loser);
		let pe = playerqueue.shift();
		window.WLROOM.setPlayerTeam(pe.id, 1);
	}	
	next();
}

window.WLROOM.onPlayerTeamChange = function(p, bp) {
	setLock(isFull());
	playerqueue.remove(p);
	if (typeof bp!='undefined' && bp !==null && p.id==bp.id && isFull()) {
		console.log("restarting game to get correct start score");
		window.WLROOM.restartGame();
	}	
}

function announce(msg, player, color, style) {
	window.WLROOM.sendAnnouncement(msg, player.id, color!=null?color:0xb2f1d3, style !=null?style:"", 1);
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