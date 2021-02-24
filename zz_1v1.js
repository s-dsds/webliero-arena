initFirebase();

window.WLROOM.onPlayerJoin = (player) => {
	if (admins.has(player.auth) ) {
		window.WLROOM.setPlayerAdmin(player.id, true);
	}
	auth.set(player.id, player.auth);
	writeLogins(player);

	announce("Welcome to the duel arena", player, 0xFF2222, "bold");

	if (isFull()) {
		announce("game is running already, if you want to play wait for a player to leave the game", player, 0xDD2222);
	}
	
	announce("please join us on discord if you're not there yet! "+CONFIG.discord_invite, player, 0xDD00DD, "italic");
	if (player.auth){		
		auth.set(player.id, player.auth);
	}
}

window.WLROOM.onPlayerLeave = function(player) {  
	writeLogins(player, "logout");
	auth.delete(player.id);
	if (!hasActivePlayers()) {
	   flushScoreLogs();
	}
	setLock(isFull());
}


window.WLROOM.onPlayerChat = function (p, m) {
	console.log(p.name+" "+m);
	if (m[0] == "!") {
		let splitted=m.substr(1).split(' ');
		if ((p.admin && command(adminCommands, p, splitted)) 
				||	(command(voteCommands, p, splitted))) {
			return false;
		}
	}
	writeLog(p,m);
}


window.WLROOM.onGameEnd = function() {		
	flushScoreLogs();
}

window.WLROOM.onPlayerKilled = function(killed, killer) {
	addKill(killed, killer);
}

window.WLROOM.onGameStart = function() {
	startScoreLogs();
}

window.WLROOM.onGameEnd2 = function() {	
}

window.WLROOM.onPlayerTeamChange = function() {
	var act = hasActivePlayers();
	console.log(JSON.stringify(arguments));
	console.log(act);
	console.log(currState);

	setLock(isFull());
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