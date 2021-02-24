const SPLASH_STATE = 0;
const GAME_RUNNING_STATE = 1;

var currState = SPLASH_STATE;

function isSplash() { return currState==SPLASH_STATE; }

function hasActivePlayers() {
    console.log('act',getActivePlayers().length != 0);
	return getActivePlayers().length != 0;
}

function getActivePlayers() {
	return window.WLROOM.getPlayerList().filter(p => p.team !=0);
}

function isFull() { return getActivePlayers().length>=2; }