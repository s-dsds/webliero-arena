COMMAND_REGISTRY.init(window.WLROOM, {});

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
	let out = currentOutQueue.getChangeSet();
	console.log('onGameEnd2isfull', isFull(), JSON.stringify(out));
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
	
	if (bp !== null && isFull()) { // this is when the player manually clicked "join" or an admin pushed him in
		console.log("restarting game to get correct start score");
		window.WLROOM.restartGame();
	}	
}