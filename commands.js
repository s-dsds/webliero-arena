COMMAND_REGISTRY.init(window.WLROOM, {});


COMMAND_REGISTRY.add("stats", ["!stats #num#: gets stats for player currently logged in or yourself if you don't give any num"], (player, idx, needle) => {
    let a = ""
   
    if (typeof idx=="undefined" || idx.trim()=="") {
        a = auth.get(player.id)
    } else if (allPlayers.has(idx.trim())) {
        a = idx.trim()
    } else if (idx[0]!="#" || isNaN(idx.substr(1)) || !auth.has(parseInt(idx.substr(1)))) {
        announce("wrong player id, use #playername to get i ", player, 0xFFF0000);
        return false;
    } else {
        a = auth.get(parseInt(idx.substr(1)))
    }

    let s = getStats(a);
    if (typeof s == "undefined" || s == null) {
        announce(`no stats for this player yet`, player, 0xFFF0000);
        return false;
    }
    printStats(s);
    return false;
}, false);

COMMAND_REGISTRY.add("top5", ["!top5: gets top five players by ELO"], (player) => {
	return printRank(1,5);
}, false);

function printRank(min, max) {
	let start = --min;
	for (let i =start; i<max; i++) {
		printELO(getStats(rankElo[i]));
	}
    return false;
}
COMMAND_REGISTRY.add("rank", ["!rank #num1 #num2: gets max five players by ELO between num1 and num2 (not required)"], (player, numS1, numS2) => {
	if (typeof numS1=="undefined" || numS1.trim()=="" || isNaN(numS1) ) {
		return printRank(1,5);
	}
	if (typeof numS2=="undefined" || numS2.trim()=="" || isNaN(numS2) ) {
		numS2=numS1;
	}
	let num1 = parseInt(numS1);
	let num2 = parseInt(numS2);
	// swap numbers
	if (num2<num1) {
		num2 = [num1, num1 = num2][0];
	}
	if (num2-num1>4) {
		num2=num1+4;
	}
	return printRank(num1,num2);    
}, false);

COMMAND_REGISTRY.add("admin", ["!admin: if you're entitled to it, you get admin"], (player) => {
    let a = auth.get(player.id);
    if (admins.has(a) ) {
		window.WLROOM.setPlayerAdmin(player.id, true);
	}
    return false;
}, false);

/** room events */
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