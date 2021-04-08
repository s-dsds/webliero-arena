var currentGame = null;
var lastLoser = null;

class Game {
    constructor(startTime, startingplayers, mapName) {
        this.startTime = startTime;
        this.startingplayers = startingplayers;
        this.playerEvents = [];
        this.playerKills = [];
        this.finalScores = [];
        this.mapName = mapName;
      }
      addKill(killed, killer) {
        this.playerKills.push({
                event_time:Date.now(), killed:resolvePlayerInfo(killed)
            });
      }
      removePlayer(player, reason) {
        this.playerEvents.push({event_time:Date.now(), event:"exit", reason:reason, player:resolvePlayerInfo(player)});
      }
      addPlayerTeamChange(player, from, to) {
        if (to==0) {
            this.removePlayer(player, "spectating");
            return;
        }
        if (from==0) {
            this.playerEvents.push({event_time:Date.now(), event:"join_game", to:to, player:resolvePlayerInfo(player)});
            return;
        }
        this.playerEvents.push({event_time:Date.now(), event:"team_change", from:from, to:to, player:resolvePlayerInfo(player)});
      }
      addFinalScores(scores) {
        this.finalScores = scores;
      }
}

function addKill(killed, killer) {
    if (currentGame!=null) {
        currentGame.addKill(killed, killer);
    }
}

function removePlayerFromGame(player, reason) {
    if (currentGame!=null) {
        currentGame.removePlayer(player, reason);
    }
}

function addPlayerTeamChange(player, from, to) {
    if (currentGame!=null) {
        currentGame.addPlayerTeamChange(player, from, to);
    }
}

function startScoreLogs() {
    if (isFull()) {
        console.log("start log");
        lastLoser = null;
        currentGame = new Game(Date.now(), window.WLROOM.getPlayerList(), currentMapName);
    }
}

function flushScoreLogs() {
    if (currentGame!=null) {
        const alpha = window.WLROOM.getTeamScore(1);
        const bravo = window.WLROOM.getTeamScore(2);
        console.log("team_scores",alpha,bravo);
        let scores = window.WLROOM.getPlayerList().map(p => {return {player:resolvePlayerInfo(p),team:p.team,score: window.WLROOM.getPlayerScore(p.id)};});
        console.log("scores", scores);
        currentGame.addFinalScores(scores);
        writeGameStats("game_end",currentGame);
        currentGame=null;
        return scores;
    }
    return null;
}

function resolvePlayerInfo(player) {
    return {name:player.name,auth:auth.get(player.id), id: player.id};
}


function loserReducer(a, c) {
  if (a.score.score<c.score.score) {
        return a;
  }
  return c;
  
}

function computeLoser(scores) {
    if (scores == null) {
        lastLoser = null;
        return
    }
    lastLoser = scores.filter(e => e.team!=0).reduce(loserReducer);
}

function getLoser() {
    return lastLoser;
}