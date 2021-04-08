window.WLROOM.onPlayerChat = function (p, m) {
	console.log(p.name+" "+m);
	writeLog(p,m);
}

window.WLROOM.onPlayerJoin = (player) => {
	if (admins.has(player.auth) ) {
		window.WLROOM.setPlayerAdmin(player.id, true);
	}
	auth.set(player.id, player.auth);
	writeLogins(player);

	announce(CONFIG.motd, player, 0xFF2222, "bold");

	if (isFull()) {
		announce("game is running already, if you want to play type !join to enter the waiting queue", player, 0xDD2222);
	}
	
	announce("please join us on discord if you're not there yet! "+CONFIG.discord_invite, player, 0xDD00DD, "italic");
	if (player.auth){		
		auth.set(player.id, player.auth);
	}
}