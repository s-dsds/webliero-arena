initFirebase();

function announce(msg, player, color, style, sound = 1) {
	window.WLROOM.sendAnnouncement(msg, typeof player =='undefined' || player == null?null:player.id, color!=null?color:0xb2f1d3, style !=null?style:"", sound);
}

function announceEmphasizeToPlayerOnly(msg, player, color, style, sound = 1) {
	for (let p of window.WLROOM.getPlayerList()) {
		if (p.id==player.id) {
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

console.log(roomLink);