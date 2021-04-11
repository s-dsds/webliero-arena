var counts = {};
var userGames = {};
var allPlayers = new Map();
var gameLength = 120;
var rankElo = [];
var mergedAuth = {
	//"yskXT4e7xq6mBflgmJ05ttXX6qQz7roaR9Tpv0mp9H0" : "2XLHD0QhcMds4lpA7TPItxqrQ1BSmZow7bRgS9r_Q5U", //flagworm
	"s8Qki_441HNtsggfG2SNNzoRdSOHT6KOdT84qR-fQow" : "hfsBIRyuR4BcNYWUL__qbxIqRp0CuH-Od4tqnRekvkE", //kami
	"xGV6_nQIfyBRPqmxClALDlUdl9RxL4eiP9eKE0EvE08": "U2B9CG8CrqdrRwYGsRlv4SeuvjozuVatCa1YU3oiFtA",//dsds
}

function listenForStatsEvents() {
    statsRef.on('child_added', addNewStat);
    statsRef.on('child_changed', addNewStat);	
}

function addNewStat(childSnapshot) {
	var v = childSnapshot.val();
	var k = childSnapshot.key;

  addStat(k,v);

}

function addStat(k,v) {
	let o = {};
	
	o.startTime =  new Date(v.stats.startTime);
	
	o.endTime =  new Date(parseInt(k));
	
	
	/*
		[ {
			"player" : {
			  "auth" : "yskXT4e7xq6mBflgmJ05ttXX6qQz7roaR9Tpv0mp9H0",
			  "name" : "🏴🐛"
			},
			"team" : 0
		  }, {
			"player" : {
			  "auth" : "yskXT4e7xq6mBflgmJ05ttXX6qQz7roaR9Tpv0mp9H0",
			  "name" : "🏴🐛"
			},
			"score" : {
			  "deaths" : 4,
			  "kills" : 6,
			  "score" : 3
			},
			"team" : 1
		  }, {
			"player" : {
			  "auth" : "JX6nyOYNH_Fyg92oQVxyEkuDoalBjmdF0AtnLCMN03M",
			  "name" : "FlaglessWorm"
			},
			"score" : {
			  "deaths" : 7,
			  "kills" : 4,
			  "score" : 0
			},
			"team" : 1
		  } ]
	  */
	  if (typeof v.stats.finalScores == "object") {
		  let activePlayers = v.stats.finalScores.filter(e => e.team!=0);
		  /*-- validation */
		  if (activePlayers.length!=2) {
			console.log(`game with ${activePlayers.length} players detected`);
			return;
		  }
		  if (activePlayers.filter(e => !(e.score.kills==0&&e.score.deaths==0)).length==0) {
			console.log(`game with no kills or deaths detected`, v.stats.finalScores);
			return;
		  }
		  let diffSE = Math.abs((o.startTime - o.endTime)/1000);
		  if (!(diffSE > gameLength-5 && diffSE < gameLength+30) && activePlayers.filter(e => (e.score.score==0)).length==0) {
				console.log(`game invalidated`, v.stats.finalScores, diffSE, o.startTime, k);
				return;
		  }
		  if (activePlayers.filter(e => (e.score.kills>7||e.score.score>7)).length>0) {
			console.log(`detected a game with bad config (flagworm?))`, v.stats.finalScores);
			return;
		  }
		  
		  /*-- count all actual games */
		  var d = o.startTime.toISOString().split('T')[0];
			if (typeof counts[d] == 'undefined') {
				 counts[d] = 1;
			} else {
				counts[d]++;
			}
		 /* stats */
		 let stats = "";
		  let currWin = "";
		  let currScore = null;
		  let reduced = [];
	  	  activePlayers.forEach((e,i,a) => {
			let p = e.player;
			let pa = p.auth;
			if (e.team!=0) {
				allPlayers.set(p.auth, p.name);
				if (typeof userGames[p.auth] == 'undefined') {
					rankElo.push(p.auth);
					userGames[p.auth] = { played: 1, won:0, lost:0, tie:0, elo:1500, cumulative:{score:e.score.score,kills:e.score.kills,deaths:e.score.deaths}, games:[], avg: {score:0, kills:0, deaths:0}};
				} else {
					userGames[p.auth].played++;
					userGames[p.auth].cumulative.score += e.score.score;
					userGames[p.auth].cumulative.kills += e.score.kills;
					userGames[p.auth].cumulative.deaths += e.score.deaths;
				}
				if (reduced.indexOf(e.score.score)==-1) {
					reduced.push(e.score.score);
				}
				if (e.score.score>=(currScore??0)) {
					currWin=p.auth;										
					currScore=e.score.score;
				}
			}			
		  });
		  
		  
		  if (reduced.length==1) { /* tie */
				stats="tie";
		  }
		  activePlayers.forEach((e,i,a) => {
				let p = e.player;
				let op = i==0? a[1].player:a[0].player;
				if (stats!="tie") {
					stats=currWin==p.auth?"won":"lost";
				}
				/* basic ranking score => adds 2 if won, adds 1 if tie, 0 if lost */
				switch (stats) {
					case "tie":
						userGames[p.auth].tie++;
						userGames[p.auth].elo = Elo.getNewRating(userGames[p.auth].elo, userGames[op.auth].elo, 0.5) 
						break;
					case "won":
						userGames[p.auth].won++;
						userGames[p.auth].elo = Elo.getNewRating(userGames[p.auth].elo, userGames[op.auth].elo, 1) 
						break;
					case "lost":
						userGames[p.auth].lost++;
						userGames[p.auth].elo = Elo.getNewRating(userGames[p.auth].elo, userGames[op.auth].elo, 0) 
						break;
					default:
						break;				
				}
				/* not rounded averages */
				userGames[p.auth].avg =  {
					score: userGames[p.auth].cumulative.score/userGames[p.auth].played,
					kills: userGames[p.auth].cumulative.kills/userGames[p.auth].played,
					deaths: userGames[p.auth].cumulative.deaths/userGames[p.auth].played,
				}
				userGames[p.auth].games.push({start:o.startTime, end:o.endTime, finalScores: activePlayers, computed:stats});
			});
			rankElo.sort(compareByElo)
	  }
	  
}

function compareByElo(a,b) {
	if (userGames[a].elo>userGames[b].elo) {
		return -1;
	} 
	if (userGames[a].elo<userGames[b].elo) {
		return 1;
	}
	return 0;
}

function loadExistingStats() {
    statsRef.orderByKey().once('value', function(snapshot) {
        snapshot.forEach(addNewStat);
      });
      
}


//#Source https://bit.ly/2neWfJ2 
var toOrdinalSuffix = int => {
	digits = [int % 10, int % 100],
	ordinals = ['st', 'nd', 'rd', 'th'],
	oPattern = [1, 2, 3, 4],
	tPattern = [11, 12, 13, 14, 15, 16, 17, 18, 19];
  return oPattern.includes(digits[0]) && !tPattern.includes(digits[1])
	? int + ordinals[digits[0] - 1]
	: int + ordinals[3];
};

function getStats(auth) {
    if (typeof userGames[auth] == "undefined" || !allPlayers.has(auth)) {
        return null;
    }
	return {player:allPlayers.get(auth),stats:userGames[auth], eloRank:toOrdinalSuffix(rankElo.indexOf(auth)+1)};
}

function printStats(s) {
	announce(`> "${s.player}" played ${s.stats.played} | lost ${s.stats.lost} | won ${s.stats.won} | tie ${s.stats.tie}`, null, 0x5afba6);
	announce(`> ELO ${s.stats.elo} ranked ${s.eloRank} out of ${rankElo.length} players`, null, 0x5afba6);
	announce(`> cumulative score ${s.stats.cumulative.score} | kills ${s.stats.cumulative.kills} | deaths ${s.stats.cumulative.deaths}`,null, 0x5afba6);
	let avg = {
		score: Math.round(s.stats.avg.score * 100) / 100,
		kills: Math.round(s.stats.avg.kills * 100) / 100,
		deaths: Math.round(s.stats.avg.deaths * 100) / 100,
	}
	announce(`> average score ${avg.score} | kills ${avg.kills} | deaths ${avg.deaths}`,null, 0x5afba6);
}

function printELO(s) {
	announce(`> ${s.eloRank} -- "${s.player}" ELO ${s.stats.elo} with ${s.stats.played} games played`, null, 0x5afba6);

}

listenForStatsEvents();


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