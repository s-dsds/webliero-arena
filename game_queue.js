class PlayerEntry {
    constructor(auth, name, id) {
        this.auth = auth;
        this.name = name;
        this.id = id;
    }
}

class PlayerQueue {
    constructor() {
        this.q = [];
    }
    has(auth) {
        return typeof this.get(auth) != 'undefined';
    }
    get(auth) {
       return this.q.filter(e => auth==e.auth)[0];
    }
    getIdx(auth) {
        for(var i = 0; i < this.q.length; i ++) {
            if(this.q[i].auth === auth) {
                return i;
            }
        }
        return -1;
    }
    getPlayerCount() {
        return this.q.length;
    }
    add(player) {
        let a = auth.get(player.id);
        if (this.has(a)) {
            return false;
        }
        this.q.push(new PlayerEntry(a, player.name, player.id));
        return true;
    }
    remove(player) {
        let a = auth.get(player.id);
        if (!this.has(a)) {
            return false;
        }
        this.q =  this.q.filter(e => a!=e.auth);        
        return true;
    }
    isEmpty() {
        this.cleanQueue();
        return this.q.length==0;
    }
    cleanQueue() {
        this.q = this.q.filter(e => window.WLROOM.getPlayer(e.id)!=null );
    }
    getNextPlayer() {
        if (!this.isEmpty()) {
            return this.q[0];
        } 
        return null
    }
    shift() {
        this.cleanQueue();
        return this.q.shift();
    }
    getPlace(player) {
        this.cleanQueue();
        let a = auth.get(player.id);
        let pl = this.q.length;
        let idx = this.getIdx(a)
        return {
            playercount: pl,
            idx: idx,
            nextingame: idx==0,
            prevPlayer: (idx>0)? this.q[idx-1].name : false
        };
    }
}

var playerqueue = new PlayerQueue();

function moveToGame(player) {
    window.WLROOM.setPlayerTeam(player.id, 1);
}
function moveToSpec(player) {
    window.WLROOM.setPlayerTeam(player.id, 0);
}
function moveToGameIfSomeoneIsWaiting(force = false) {
    console.log("moveToGameIfSomeoneIsWaiting", !isFull(), hasActivePlayers(), !playerqueue.isEmpty(), (!isFull() && hasActivePlayers() && !playerqueue.isEmpty()))
    if ((force || (!isFull() && hasActivePlayers())) && !playerqueue.isEmpty()) {
        let pe = playerqueue.shift();
        console.log(`moving ${pe.name} to the game`);
        moveToGame(pe);
        window.WLROOM.restartGame();
    }
}
COMMAND_REGISTRY.add(["q", "quit"], ["!quit or !q: you'll be removed from the waiting queue & go back to spectating when you're in the game"], (player) => {
    if (playerqueue.remove(player)) { // if in queue, the player was not playing anyway
        announce(`>> ${player.name} was removed from the queue <<`);
        announce("you'll have to type !join to go back in queue", player);
        return false;
    } 
    announce("you'll have to type !join to play again", player);
    const full= player.team!=0 && isFull();
    moveToSpec(player);
    moveToGameIfSomeoneIsWaiting(full);
    return false;
}, false);


COMMAND_REGISTRY.add(["j","join"], ["!join or !j: you'll be added in the queue for next games"], (player) => {
    if (player.team != 0) {
        announce("you're already playing", player);
        return false;
    }
    if (!isFull()) {
        moveToGame(player);
        window.WLROOM.restartGame();
        return false;
    }
    if (playerqueue.add(player)) {
        let place = playerqueue.getPlace(player);
        let after = (place.prevPlayer!==false)?` after "${place.prevPlayer}"`:'';
        announce(`>> ${player.name} was added to the queue ${after} <<`);
        
    } else {
        announce("you're already in the queue", player);
    }

    return false;
}, false);

COMMAND_REGISTRY.add(["p","place"], ["!place or !p: shows your place in the current waiting queue"], (player) => {
    let place = playerqueue.getPlace(player);
    if (place.playercount == 0) {
        announce("the queue is empty", player);
        return;
    } else if (place.playercount == 1) {
        announce(`there's only one player in queue`, player);
    } else {
        announce(`there are ${place.playercount} players in queue`, player);
    }
    if (place.idx == -1) {
        announce("but sadly, you are not in the queue", player);
        return
    } else if (place.nextingame) {
        announce("you are the next player to enter the game", player);
    } else if (place.prevPlayer !==false){
        announce(`there are ${place.idx} players before you, you will play after "${place.prevPlayer}"`, player);
    }
    return false;
}, false);


