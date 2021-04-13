window.WLROOM.onPlayerChat = function (p, m) {
	console.log(p.name+" "+m);
	writeLog(p,m);
}

window.WLROOM.onPlayerJoin = (player) => {
	if (Array.from(auth.values()).indexOf(player.auth)>-1) {
		writeLogins(player, "kicked_duped");
		window.WLROOM.kickPlayer(player.id, "duplicate player detected, this room doesn't allow you to connect twice for the queue to work correctly, sorry", false)
		return;
	}
	if (admins.has(player.auth) ) {
		window.WLROOM.setPlayerAdmin(player.id, true);
	}
	auth.set(player.id, player.auth);
	writeLogins(player);

	announce(CONFIG.motd, player, 0xFF2222, "bold");

	if (isFull()) {
		playerqueue.add(player)
		announce("game is running already, you've been automatically added to the queue, type !quit or !q to stay only as a spectator", player, 0xDD2222, "bold");
	} 

	announce("please join us on discord if you're not there yet! "+CONFIG.discord_invite, player, 0xDD00DD, "italic");
	if (player.auth){		
		auth.set(player.id, player.auth);
	}
}