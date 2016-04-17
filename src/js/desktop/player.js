/* globals chrome */
module.exports = function (remoteManipulations, server, vkRequest) {
  var secondsTohhmmss = require('../common/functions/secondsTohhmmss.js')
  var getRandomIntFromTo = require('../common/functions/getRandomIntFromTo.js')

  var player = {}

  // set up audio element
  player.elem = new window.Audio()
  player.elem.autoplay = false
  player.elem.preload = 'auto'
  player.elem.volume = 0.4

  // errors handling
  player.elem.onerror = function () {
    // if player was cleaned don't show error message
    if (document.querySelector('#player-controller_song-info').innerText === '') return

    remoteManipulations.showToast({
      'innerText': chrome.i18n.getMessage('songUnavailable') || 'Song unavailable'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'showToast',
      'args': {
        'innerText': chrome.i18n.getMessage('songUnavailable') || 'Song unavailable'
      }
    })

    if (navigator.onLine) document.querySelector('#player-controller_skip-next-btn').dispatchEvent(new window.Event('click'))
  }

  player.playSong = function (songlistItem) {
    // when need to start playing songs from other songlist
    if (!player.currentSonglist || (player.currentSonglist !== songlistItem.parentNode)) {
      if (document.querySelector('.songlist_item.current')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.current',
          'className': 'current'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.current',
            'className': 'current'
          }
        })
      }

      if (document.querySelector('.songlist_item.is-playing')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.is-playing',
            'className': 'is-playing'
          }
        })
      }

      player.currentSonglist = songlistItem.parentNode
      player.currentSong = null
    }

    if (player.currentSong) {
      if (document.querySelector('.songlist_item.current')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.current',
          'className': 'current'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.current',
            'className': 'current'
          }
        })
      }

      if (document.querySelector('.songlist_item.is-playing')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.is-playing',
            'className': 'is-playing'
          }
        })
      }
    }

    player.currentSong = songlistItem
    remoteManipulations.addClassToElem({
      'selector': 'div[data-song-class="' + songlistItem.dataset.songClass + '"]',
      'className': 'current'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'addClassToElem',
      'args': {
        'selector': 'div[data-song-class="' + songlistItem.dataset.songClass + '"]',
        'className': 'current'
      }
    })
    remoteManipulations.addClassToElem({
      'selector': '.songlist_item.current',
      'className': 'is-playing'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'addClassToElem',
      'args': {
        'selector': '.songlist_item.current',
        'className': 'is-playing'
      }
    })

    if (player.broadcast) player.setBroadcast(player.currentSong)

    remoteManipulations.setElemInnerHTML({
      'selector': '#player-controller_song-info',
      'html': songlistItem.dataset.songTitle.slice(0, 45)
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setElemInnerHTML',
      'args': {
        'selector': '#player-controller_song-info',
        'html': songlistItem.dataset.songTitle.slice(0, 45)
      }
    })

    remoteManipulations.addAttributeToElem({
      'selector': '#player-controller_add-songs-to-audios-btn',
      'attrName': 'data-current-song-id',
      'attrValue': songlistItem.dataset.songClass
    })
    server.sendRemoteManipulationsMsg({
      'func': 'addAttributeToElem',
      'args': {
        'selector': '#player-controller_add-songs-to-audios-btn',
        'attrName': 'data-current-song-id',
        'attrValue': songlistItem.dataset.songClass
      }
    })

    player.elem.currentTime = 0
    player.elem.src = songlistItem.dataset.songUrl
    player.elem.play()
    remoteManipulations.changeSliderValue({
      'selector': '#player-controller_song-range',
      'value': 0
    })
    server.sendRemoteManipulationsMsg({
      'func': 'changeSliderValue',
      'args': {
        'selector': '#player-controller_song-range',
        'value': 0
      }
    })

    remoteManipulations.setElemInnerHTML({
      'selector': '#player-controller_current-time',
      'html': '0:00'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setElemInnerHTML',
      'args': {
        'selector': '#player-controller_current-time',
        'html': '0:00'
      }
    })

    remoteManipulations.setElemInnerHTML({
      'selector': '#player-controller_song-duration',
      'html': secondsTohhmmss(+songlistItem.dataset.songDuration)
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setElemInnerHTML',
      'args': {
        'selector': '#player-controller_song-duration',
        'html': secondsTohhmmss(+songlistItem.dataset.songDuration)
      }
    })
  }

  player.setBroadcast = function (songlistItem) {
    var audio = songlistItem
      ? songlistItem.dataset.songClass
      : ''
    vkRequest.send({
      'method': 'audio.setBroadcast',
      'requestParams': {
        'audio': audio
      }
    })
  }

  player.elem.addEventListener('timeupdate', function (event) {
    remoteManipulations.setElemInnerHTML({
      'selector': '#player-controller_current-time',
      'html': secondsTohhmmss(event.target.currentTime, ':')
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setElemInnerHTML',
      'args': {
        'selector': '#player-controller_current-time',
        'html': secondsTohhmmss(event.target.currentTime, ':')
      }
    })

    remoteManipulations.changeSliderValue({
      'selector': '#player-controller_song-range',
      'value': event.target.currentTime / event.target.duration * 100
    })
    server.sendRemoteManipulationsMsg({
      'func': 'changeSliderValue',
      'args': {
        'selector': '#player-controller_song-range',
        'value': event.target.currentTime / event.target.duration * 100
      }
    })
  })

  // handle changes on song range
  document.querySelector('#player-controller_song-range').addEventListener('input', function (event) {
    if (isNaN(player.elem.duration)) return
    player.elem.currentTime = event.currentTarget.value * player.elem.duration / 100
  })

  // handle changes on volume range
  document.querySelector('#player-controller_volume-range').addEventListener('input', function (event) {
    // save value to set after next launch
    chrome.storage.local.set({'volumeRangeValue': event.target.value})

    server.sendRemoteManipulationsMsg({
      'func': 'changeSliderValue',
      'args': {
        'selector': '#player-controller_volume-range',
        'value': event.target.value
      }
    })
    player.elem.volume = event.target.value / 100
  })

  // clean player method
  player.clean = function () {
    remoteManipulations.cleanPlayer()
    server.sendRemoteManipulationsMsg({
      'func': 'cleanPlayer'
    })
    player.currentSong = null
    player.elem.src = ''
  }

  // play and pause events handling to change button appearance
  player.elem.addEventListener('play', function () {
    remoteManipulations.setPlayPauseBtnIcon({
      'icon': 'pause'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setPlayPauseBtnIcon',
      'args': {
        'icon': 'pause'
      }
    })
  })

  player.elem.addEventListener('pause', function () {
    remoteManipulations.setPlayPauseBtnIcon({
      'icon': 'play_arrow'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setPlayPauseBtnIcon',
      'args': {
        'icon': 'play_arrow'
      }
    })
  })

  document.querySelector('#player-controller_loop-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('loop-true')) {
      remoteManipulations.removeClassFromElem({
        'selector': '#player-controller_loop-btn',
        'className': 'loop-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'removeClassFromElem',
        'args': {
          'selector': '#player-controller_loop-btn',
          'className': 'loop-true'
        }
      })
      player.loop = false
    } else {
      remoteManipulations.addClassToElem({
        'selector': '#player-controller_loop-btn',
        'className': 'loop-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'addClassToElem',
        'args': {
          'selector': '#player-controller_loop-btn',
          'className': 'loop-true'
        }
      })
      player.loop = true
    }
  })
  document.querySelector('#player-controller_shuffle-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('shuffle-true')) {
      remoteManipulations.removeClassFromElem({
        'selector': '#player-controller_shuffle-btn',
        'className': 'shuffle-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'removeClassFromElem',
        'args': {
          'selector': '#player-controller_shuffle-btn',
          'className': 'shuffle-true'
        }
      })
      player.shuffle = false
    } else {
      remoteManipulations.addClassToElem({
        'selector': '#player-controller_shuffle-btn',
        'className': 'shuffle-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'addClassToElem',
        'args': {
          'selector': '#player-controller_shuffle-btn',
          'className': 'shuffle-true'
        }
      })
      player.shuffle = true
    }
  })
  document.querySelector('#player-controller_broadcast-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('broadcast-true')) {
      remoteManipulations.removeClassFromElem({
        'selector': '#player-controller_broadcast-btn',
        'className': 'broadcast-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'removeClassFromElem',
        'args': {
          'selector': '#player-controller_broadcast-btn',
          'className': 'broadcast-true'
        }
      })
      player.setBroadcast()
      player.broadcast = false
    } else {
      remoteManipulations.addClassToElem({
        'selector': '#player-controller_broadcast-btn',
        'className': 'broadcast-true'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'addClassToElem',
        'args': {
          'selector': '#player-controller_broadcast-btn',
          'className': 'broadcast-true'
        }
      })
      if (player.currentSong) player.setBroadcast(player.currentSong)
      player.broadcast = true
    }
  })

  player.playNextSong = function (event) {
    if (!player.currentSong) return

    // handling player 'ended' event
    if (player.loop && (event.target === player.elem)) {
      player.elem.currentTime = 0
      player.elem.play()
      return
    }

    // loop is false && only one item in songlist && songlist is not in post
    if (!player.loop && player.currentSonglist.children.length === 1 &&
      !player.currentSonglist.classList.contains('postlists_item_songlist')) {
      player.elem.pause()
      player.elem.currentTime = 0
      return
    }

    // shuffle is true && more than 1 elem in list
    if (player.shuffle && player.currentSonglist.children.length !== 1) {
      var nextSongNum = getRandomIntFromTo(0, player.currentSonglist.children.length - 1)
      player.playSong(player.currentSonglist.children[nextSongNum])
    } else {
      // shuffle is false && more than 1 elem in list
      if (player.currentSong.nextElementSibling) {
        player.playSong(player.currentSong.nextElementSibling)
      } else {
        // if songlist is in post and there is 1 or more posts below in postlists
        if (player.currentSonglist.classList.contains('postlists_item_songlist') &&
          player.currentSonglist.parentNode.nextElementSibling) {
          if (document.querySelector('.songlist_item.is-playing')) {
            remoteManipulations.removeClassFromElem({
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            })
            server.sendRemoteManipulationsMsg({
              'func': 'removeClassFromElem',
              'args': {
                'selector': '.songlist_item.is-playing',
                'className': 'is-playing'
              }
            })
          }
          if (document.querySelector('.songlist_item.current')) {
            remoteManipulations.removeClassFromElem({
              'selector': '.songlist_item.current',
              'className': 'current'
            })
            server.sendRemoteManipulationsMsg({
              'func': 'removeClassFromElem',
              'args': {
                'selector': '.songlist_item.current',
                'className': 'current'
              }
            })
          }
          var nextSonglist = player.currentSonglist.parentNode.nextElementSibling.querySelector('.songlist')
          nextSonglist.firstElementChild.dispatchEvent(new window.Event('click'))
        } else {
          // stop playing
          if (document.querySelector('.songlist_item.is-playing')) {
            remoteManipulations.removeClassFromElem({
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            })
            server.sendRemoteManipulationsMsg({
              'func': 'removeClassFromElem',
              'args': {
                'selector': '.songlist_item.is-playing',
                'className': 'is-playing'
              }
            })
          }
        }
      }
    }
  }

  player.playPreviousSong = function () {
    if (!player.currentSong) return

    if (player.currentSong.previousElementSibling) {
      player.playSong(player.currentSong.previousElementSibling)
    } else if (player.currentSonglist.classList.contains('postlists_item_songlist') &&
          player.currentSonglist.parentNode.previousElementSibling) {
      // if songlist is in post and there is 1 or more posts above in postlists
      if (document.querySelector('.songlist_item.is-playing')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.is-playing',
            'className': 'is-playing'
          }
        })
      }
      if (document.querySelector('.songlist_item.current')) {
        remoteManipulations.removeClassFromElem({
          'selector': '.songlist_item.current',
          'className': 'current'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.current',
            'className': 'current'
          }
        })
      }
      var nextSonglist = player.currentSonglist.parentNode.previousElementSibling.querySelector('.songlist')
      nextSonglist.firstElementChild.dispatchEvent(new window.Event('click'))
    }
  }

  player.togglePlayPause = function () {
    if (player.elem.paused) {
      if (!player.currentSong) {
        if (myAudioSectionSonglist.firstElementChild) {
          player.playSong(myAudioSectionSonglist.firstElementChild)
        }
      } else {
        player.elem.play()
        remoteManipulations.addClassToElem({
          'selector': '.songlist_item.current',
          'className': 'is-playing'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addClassToElem',
          'args': {
            'selector': '.songlist_item.current',
            'className': 'is-playing'
          }
        })
      }
    } else {
      player.elem.pause()
      remoteManipulations.removeClassFromElem({
        'selector': '.songlist_item.is-playing',
        'className': 'is-playing'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'removeClassFromElem',
        'args': {
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        }
      })
    }
  }

  var myAudioSectionSonglist = document.querySelector('#my-audios-section_songlist')
  player.elem.addEventListener('ended', player.playNextSong)
  document.querySelector('#player-controller_skip-previous-btn').addEventListener('click', player.playPreviousSong)
  document.querySelector('#player-controller_skip-next-btn').addEventListener('click', player.playNextSong)
  document.querySelector('#player-controller_play-pause-btn').addEventListener('click', player.togglePlayPause)

  return player
}
