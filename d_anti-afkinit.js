AFK_HANDLER.init(window.WLROOM, {maxPlayers: CONFIG.max_players,});

COMMAND_REGISTRY.add("afk", ["!afk #seconds#: number of seconds allowed for afk, `afk 0` disables it, 1/4th of #seconds# will be used as grace time (eg for 20sec, 5sec grace time)"], (player, num) => {
    let n = (typeof num=='undefined')?'':num.trim();
    if (n == "" || isNaN(n)) {
        announce("you need to provide a number as argument, type `!help afk` for help", player, 0xFFF0000);
        return false;
    }
    n = parseInt(n)
    if (n==0) {
        AFK_HANDLER.loadSettings({        
            enabled: false,
        });
        announce(`afk detection was disabled`)
        return false;
    }
    let g = Math.round(n/4);
    AFK_HANDLER.loadSettings({
        timeout: n*1000,
        graceTime: g*1000,
        enabled: true,
    });
    announce(`afk detection was changed to ${n}seconds with ${g}seconds grace time`)
    return false;
}, true);
