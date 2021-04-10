initFirebase();

window.WLROOM.onPlayerLeave = function(player) {  
	writeLogins(player, "logout");
	playerqueue.remove(player);
	auth.delete(player.id);

	if (player.team!=0 && hasActivePlayers()) {
	   window.WLROOM.endGame();
	}
	setLock(isFull());
}

window.WLROOM.onGameEnd = function() {		
	let scores = flushScoreLogs();
	let out = currentOutQueue.computeScores(scores);
	notifyNextPlayer(out);
}

window.WLROOM.onPlayerKilled = function(killed, killer) {
	addKill(killed, killer);
}

window.WLROOM.onGameStart = function() {
	startScoreLogs()
}

window.WLROOM.onGameEnd2 = function() {
	let out = currentOutQueue.getChange();
	console.log('onGameEnd2isfull', isFull());
	console.log('onGameEnd2isfull', JSON.stringify(loser));
	if (out != null && !playerqueue.isEmpty() && out.isOut()) {
		moveToSpec(out.player);
		playerqueue.add(out.player);
		let pe = playerqueue.shift();
		console.log(`switching ${out.player.name} with ${pe.name}`);
		moveToGame(pe);
		// add another player if somehow one disappeared
		if (!isFull() && !playerqueue.isEmpty()) {
			let pe = playerqueue.shift();
			moveToGame(pe);
			console.log(`added ${pe.name} to complete the game`);
		}
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
	
	if (!bp == null && isFull()) { // this is when the player manually clicked "join" or an admin pushed him in
		console.log("restarting game to get correct start score");
		window.WLROOM.restartGame();
	}	
}

function announce(msg, player, color, style, sound = 1) {
	window.WLROOM.sendAnnouncement(msg, typeof player =='undefined' || player == null?null:player.id, color!=null?color:0xb2f1d3, style !=null?style:"", sound);
}

function announceEmphasizeToPlayerOnly(msg, player, color, style, sound = 1) {
	for (let p of window.WLROOM.getPlayerList()) {
		if (p.id=player.id) {
			announce(msg, p, color, style, sound)
		} else {
			announce(msg, p, null, '', 0)
		}
	}
	return;
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