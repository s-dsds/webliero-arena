var AFK_HANDLER = (function () {
  // roughly inspired by AFK detection by https://github.com/Fonsan/webliero-server-plugins/
  const chainFunction = (object, attribute, func) => {
    const original = object[attribute]
    if (original) {
      object[attribute] = (...arguments) => {
        let or = original.apply(object, arguments)
        let r = func.apply(object, arguments)
        if (false==r || false==or) {
          return false;
        }
      }
    } else {
      object[attribute] = func
    }
  }
  
  const log = (...arguments) => {
    console.log(...arguments.map(x => JSON.stringify(x)))
  }
  
  let room = null
  
  let settings = {
    motd: `motd`,
    motd_color: 0x00A9D0,
    spectatorTeam: 0,
    timeout: 20000,
    graceTime: 5000,
    hotTimeout: 3000,
    kickAFKSpectatorWhenFull: true,
    maxPlayers: 0,
    enabled: true,
  } //default settings
  
  const loadSettings = (confArgs) => {
    settings = {
      ...settings,
      ...confArgs
    }
    settings.motd = `Anti-AFK plugin is enabled, you'll be moved to spectating if you stay more that ${settings.timeout / 1000} seconds inactive in the game except if you're alone`;
  }
  const execMotd = (player) => {
    if (!settings.motd) {
      return
    }
    room.sendAnnouncement(settings.motd, player.id, settings.motd_color)
  }
  const playingPlayers = {}
  const hotPlayers = {}
  const kickCandidates = {}
  const evictPlayer = (playerId) => {
    if (!settings.enabled || !isFull()) {
      return;
    }
    const message = `You will be moved to spectators due too inactivity in ${settings.graceTime / 1000} seconds, please move`
    room.sendAnnouncement(message, playerId, 0xFFFF00, "bold", 2)
    const currentTimeout = playingPlayers[playerId]
    setTimeout(() => {
      const player = room.getPlayer(playerId)
      if (player && player.team != settings.spectatorTeam && playingPlayers[playerId] == currentTimeout) {
        room.sendAnnouncement(`Moving ${player.name} to spectators due to inactivity`, null, 0xDDDDDD)
        const reason = `You were afk for more than ${settings.timeout / 1000} seconds, moving you to spectators`
        room.sendAnnouncement(reason, playerId, 0xFF0000, "bold", 2);
        room.setPlayerTeam(playerId, 0)
        kickCandidates[playerId] = new Date()
      }
    }, settings.graceTime)
  }
  const clearPlayerTimeout = (playerId) => {
    if(playingPlayers[playerId]) {
      clearTimeout(playingPlayers[playerId])
    }
    delete playingPlayers[playerId]
  }
  const resetPlayerTimeout = (playerId) => {
    clearPlayerTimeout(playerId)
    playingPlayers[playerId] = setTimeout(evictPlayer.bind(null, playerId), settings.timeout - settings.graceTime)
  }
  
  const activate = (player) => {
    if (!hotPlayers[player.id]) {
      hotPlayers[player.id] = setTimeout(() => {
        delete hotPlayers[player.id]
      }, settings.hotTimeout)
      if (playingPlayers[player.id]) {
        resetPlayerTimeout(player.id)
      }
    }
  }
  
  const purgeInactiveSpectators = () => {
    if (!settings.kickAFKSpectatorWhenFull) {
      return;
    }
    const list = room.getPlayerList();
    if (list.length >= settings.maxPlayers) {
      let oldest = null;
      for(let playerId in kickCandidates) {
        if (!oldest) {
          oldest = playerId
        } else if (kickCandidates[playerId] < kickCandidates[oldest]) {
          oldest = playerId
        }
      }
      if (oldest) {
        room.sendAnnouncement(`Server full, kicking oldest afk spectator %{room.getPlayer(oldest).name}`, null, 0xDDDDDD)
        room.kickPlayer(oldest, 'Server full, kicking oldest afk spectator')
      }
    }
  }
  
  const removePlayer = (player) => {
    delete kickCandidates[player.id]
    clearPlayerTimeout(player.id)
  }

  const handleTeamChange = (player) => {
    if (player.team == settings.spectatorTeam) {
      clearPlayerTimeout(player.id)
    } else {
      delete kickCandidates[player.id]
      resetPlayerTimeout(player.id)
    }
  }
  
  
  
  const init = (argRoom, confArgs) => {        
    if (window.AFKLUGIN) {
      log('afk plugin is already loaded, you can change settings use AFK_HANDLER.loadSettings()', settings)
      return
    }
    room=argRoom 
    
    loadSettings(confArgs)
    log('loading afk plugin', settings)
    window.AFKLUGIN = true
    
    
    chainFunction(room, 'onPlayerJoin', execMotd) 
    chainFunction(room, 'onPlayerJoin', purgeInactiveSpectators)
    chainFunction(room, 'onPlayerTeamChange', handleTeamChange)
    
    chainFunction(room, 'onPlayerActivity', activate)
    chainFunction(room, 'onPlayerChat', activate)
    
    chainFunction(room, 'onPlayerLeave', removePlayer)
  }
  
  return {
    init: init,
    loadSettings: loadSettings,
  }})()