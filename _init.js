var admins = new Set(CONFIG.admins);
var maxGames = CONFIG.max_games_in_a_row;

let auth = new Map();
var fdb;

var commentsRef;
var notifsRef;

var commands;
var roomLink;

(async function () {
	console.log("Running Server...");
	var room = WLInit({
		token: window.WLTOKEN,
		roomName: CONFIG.room_name,
		maxPlayers: CONFIG.max_players,	
		public: CONFIG.public
	});

	room.setSettings({
		scoreLimit: 10,
		timeLimit: 10,
		gameMode: "lms",
		levelPool: "arenasBest",
		respawnDelay: 3,
		bonusDrops: "health",
		teamsLocked: false,
	});
	window.WLROOM = room;

	room.onRoomLink = (link) => {roomLink =link};
	room.onCaptcha = () => console.log("Invalid token");
})();