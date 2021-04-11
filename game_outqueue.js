const REASON_OUT_MAX = 0;
const REASON_OUT_LOOSE = 1;
const REASON_NOT_OUT_TIE = 2;

class Out {
    constructor(reasonOut, player) {
        this.reasonOut = reasonOut
        this.player = player
    }
    isOut() {
        return this.player!=null
    }
}

class OutQueue {
    constructor() {
        this.currentOut = null;
        this.lastGames = [];        
    }
    resetOut() {
        this.currentOut = null;
    }
    computeScores(scores) {
        if (scores == null || scores.length!=2) {
            this.currentOut = null;
            return this.currentOut
        }
        let s0 = scores[0].score.score;
        let s1 = scores[1].score.score;
        if (this.lastGames.length>=maxGames) {
            this.lastGames.shift();
        }
        this.lastGames.push(scores);
        
        if (s0==s1) {
            for (let s of scores) {
                if (this.#hasPlayedTooMuch(s.player)) {
                    this.currentOut = new Out(REASON_OUT_MAX, s.player)
                    return this.currentOut
                }
            }
            this.currentOut = new Out(REASON_NOT_OUT_TIE, null)
            return this.currentOut
        }
        let winner = (s0 > s1)?0:1;
        let looser = winner?0:1;
        if (this.#hasPlayedTooMuch(scores[winner].player)) {
            this.currentOut = new Out(REASON_OUT_MAX, scores[winner].player)
                return this.currentOut
        }
        this.currentOut = new Out(REASON_OUT_LOOSE, scores[looser].player)
        return this.currentOut
    }
    #hasPlayedTooMuch(player) {
        return this.lastGames.filter(s => s.filter(g => g.team!=0 && g.player.auth==player.auth).length>0 ).length>=maxGames
    }
    
    getChangeSet() {
        return this.currentOut;
    }
}

var currentOutQueue = new OutQueue();

function notifyNextPlayer() {
    let out = currentOutQueue.getChangeSet();
    if (out==null) {
        return;
    }
    if (out.reasonOut==REASON_NOT_OUT_TIE) {
        announce(`>> TIE, both players stay in the game <<`);
        return;
    }
    let player = playerqueue.getNextPlayer();
    let outmsg = "";
    if (out.reasonOut==REASON_OUT_MAX) {  
        outmsg = `${out.player.name} (max game played)`;
    } else if (out.reasonOut==REASON_OUT_LOOSE) {
        outmsg = `${out.player.name} who lost`;
    }
    if (player!=null) {  
        announceEmphasizeToPlayerOnly(`>> @${player.name} is to enter the arena next replacing ${outmsg}<<`,player,0xDD91C6,"bold", 2);
    }
    
}