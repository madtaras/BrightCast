/* global domManipulations, http, vkRequest, vkAccessToken, vkUserID, chrome, parseBoolean, componentHandler, guid,
Jets, MutationSummary, secondsTohhmmss, getRandomIntFromTo, qr */
var isServer = true // eslint-disable-line no-unused-vars
;(function () {
  // localization
  (function () {
    var objects = document.getElementsByTagName('*')
    Array.prototype.forEach.call(objects, function (object) {
      if (object.dataset && object.dataset.i18nContent) {
        object.innerHTML = chrome.i18n.getMessage(object.dataset.i18nContent) || object.innerHTML
      }
    })
  })()

  window.addEventListener('load', function () {
    setTimeout(function () {
      document.querySelector('#drawer-panel').style.display = 'flex'
      document.querySelector('#content').style.display = 'block'
      document.querySelector('.appLoading').classList.add('moveOut')
    }, 700)
  })

  if (!navigator.onLine) {
    setTimeout(function () {
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('connectToTheInternetAndRestartApp') || 'Connect to the internet and restart the app',
        'duration': 9999999
      })
    }, 700)
    throw new Error('No internet connection')
  }

  var addressRegEx = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/

  function chooseAppPortAndListen (port) {
    chrome.socket.connect(socketPortTesterId, 'localhost', port, function (result) {
      if (result === 0) {
        chrome.socket.disconnect(socketPortTesterId)
        chooseAppPortAndListen(port + 1)
      } else {
        chrome.socket.destroy(socketPortTesterId)
        server.listen(port)
        chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
          networkInterfaces.forEach(function (networkInterface) {
            if (addressRegEx.test(networkInterface.address)) {
              var address = networkInterface.address + ':' + port
              document.getElementById('settings-section_connection-info_address').innerText = address
              qr.canvas({
                'canvas': document.getElementById('settings-section-qr-code'),
                'value': address
              })
              document.querySelector('#settings-section_connection-info').classList.add('is-upgraded')
            }
          })
        })
      }
    })
  }

  if (http.Server && http.WebSocketServer) {
    // Listen for HTTP connections.
    var server = new http.Server()
    var wsServer = new http.WebSocketServer(server)

    var socketPortTesterId
    var port = 52121

    chrome.socket.create('tcp', null, function (createInfo) {
      socketPortTesterId = createInfo.socketId
      chooseAppPortAndListen(port)
    })

    server.addEventListener('request', function (req) {
      var url = req.headers.url
      if (url === '/') {
        url = '/public/mobileApp.html'
      } else if (url === '/localization') {
        var currentLocale = chrome.i18n.getUILanguage()
        if (currentLocale.indexOf('uk') > -1) {
          url = '/public/_locales/uk/messages.json'
        } else if (currentLocale.indexOf('ru') > -1) {
          url = '/public/_locales/ru/messages.json'
        } else {
          url = '/public/_locales/en/messages.json'
        }
      } else {
        url = '/public' + url
      }
      // Serve the pages of this chrome application.
      req.serveUrl(url)
      return true
    })

    // A list of connected websockets.
    var connectedSockets = []
    window.connectedSockets = connectedSockets

    wsServer.addEventListener('request', function (req) {
      var socket = req.accept()
      connectedSockets.push(socket)

      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })

      socket.addEventListener('message', function (e) {
        handleSocketsMessage(e)
      })

      vkRequest.send({
        'method': 'execute.getDataForAppInit',
        'requestParams': {
          'access_token': vkAccessToken,
          'user_id': vkUserID,
          'my_audios_to_load': document.querySelector('#my-audios-section_songlist').children.length
        }
      }).then(function (response) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertUserInfoIntoDrawerHeader',
          'args': response.userInfo
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setGlobalVariable',
          'args': {
            'propertyName': 'vkUserID',
            'propertyValue': vkUserID
          }
        })

        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoSonglist',
          'args': {
            'songInfo': response.userAudios.items,
            'songlistId': 'my-audios-section_songlist'
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addClassToElem',
          'args': {
            'selector': 'body',
            'className': 'user-audios-loaded'
          }
        })
        if (document.querySelector('#my-audios-section_load-more-songs-btn').hidden) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#my-audios-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        }

        response.friendsWithOpenedAudios.forEach(function (currentValue, index, array) {
          array[index].profileId = array[index].id
          array[index].profileType = 'person'
          array[index].profileTitle = array[index].first_name + ' ' + array[index].last_name
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoProfileslist',
          'args': {
            'profileslistId': 'profiles-section_friends-profiles',
            'profilesInfo': response.friendsWithOpenedAudios
          }
        })

        response.userGroups.items.forEach(function (currentValue, index, array) {
          array[index].profileId = '-' + array[index].id
          array[index].profileType = 'group'
          array[index].profileTitle = array[index].name
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoProfileslist',
          'args': {
            'profileslistId': 'profiles-section_groups-profiles',
            'profilesInfo': response.userGroups.items
          }
        })

        if (player.loop) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addClassToElem',
            'args': {
              'selector': '#player-controller_loop-btn',
              'className': 'loop-true'
            }
          })
        }
        if (player.shuffle) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addClassToElem',
            'args': {
              'selector': '#player-controller_shuffle-btn',
              'className': 'shuffle-true'
            }
          })
        }
        if (player.broadcast) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addClassToElem',
            'args': {
              'selector': '#player-controller_broadcast-btn',
              'className': 'broadcast-true'
            }
          })
        }

        var playPauseCurrentIcon = document.querySelector('#player-controller_play-pause-btn_icon').innerHTML
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setPlayPauseBtnIcon',
          'args': {
            'icon': playPauseCurrentIcon
          }
        })

        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'changeSliderValue',
          'args': {
            'selector': '#player-controller_song-range',
            'value': document.querySelector('#player-controller_song-range').value
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'changeSliderValue',
          'args': {
            'selector': '#player-controller_volume-range',
            'value': document.querySelector('#player-controller_volume-range').value
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setElemInnerHTML',
          'args': {
            'selector': '#player-controller_current-time',
            'html': document.querySelector('#player-controller_current-time').innerHTML
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setElemInnerHTML',
          'args': {
            'selector': '#player-controller_song-duration',
            'html': document.querySelector('#player-controller_song-duration').innerHTML
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setElemInnerHTML',
          'args': {
            'selector': '#player-controller_song-info',
            'html': document.querySelector('#player-controller_song-info').innerHTML
          }
        })

        document.querySelector('#profiles-section_broadcasting-profiles').innerHTML = ''
        if (response.broadcastingFriends) {
          response.broadcastingFriends.forEach(function (currentValue, index, array) {
            if (currentValue.type === 'profile') {
              array[index].profileId = array[index].id
              array[index].profileType = 'person'
              array[index].profileTitle = array[index].first_name + ' ' + array[index].last_name
            } else {
              array[index].profileId = array[index].id
              array[index].profileType = 'group'
              array[index].profileTitle = array[index].name
            }
          })
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'insertItemsIntoBroadcastingProfileslist',
            'args': {
              'profileslistId': 'profiles-section_broadcasting-profiles',
              'profilesInfo': response.broadcastingFriends
            }
          })
          domManipulations.insertItemsIntoBroadcastingProfileslist({
            'profileslistId': 'profiles-section_broadcasting-profiles',
            'profilesInfo': response.broadcastingFriends
          })
        }
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'updateProfilesSectionSearch'
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'injectStyles',
          'args': {
            'rules': [
              '.player-controller_add-songs-to-audios-btn[data-current-song-id^="' + vkUserID + '"] {' +
                'pointer-events: none;' +
                'display: none;' +
              '}'
            ]
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addAttributeToElem',
          'args': {
            'selector': '#player-controller_add-songs-to-audios-btn',
            'attrName': 'data-current-song-id',
            'attrValue': document.querySelector('#player-controller_add-songs-to-audios-btn').dataset.currentSongId
          }
        })

        if (player.currentSong) {
          connectedSockets.forEach(function (socket) {
            sendDomManipulationsMessage({
              'socket': socket,
              'function': 'addClassToElem',
              'args': {
                'selector': 'div[data-song-class="' + player.currentSong.dataset.songClass + '"]',
                'className': 'current'
              }
            })
          })
          if (player.currentSong.classList.contains('is-playing')) {
            connectedSockets.forEach(function (socket) {
              sendDomManipulationsMessage({
                'socket': socket,
                'function': 'addClassToElem',
                'args': {
                  'selector': 'div[data-song-class="' + player.currentSong.dataset.songClass + '"]',
                  'className': 'is-playing'
                }
              })
            })
          }
        }

        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })

      // if opened some profile in profile section copy it to client
      var profileSectionSonglist = document.getElementById('profile-section_songlist')
      var profileSectionPostslist = document.getElementById('profile-section_postslist')
      if (profileSectionSonglist.children.length || profileSectionPostslist.children.length) {
        var profileSectionTitle = domManipulations.getProfileSectionTitle()
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setProfileSectionTitle',
          'args': {'title': profileSectionTitle}
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'prependElemWithHTML',
          'args': {
            'html': profileSectionSonglist.innerHTML,
            'parentElemSelector': '#profile-section_songlist'
          }
        })
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'prependElemWithHTML',
          'args': {
            'html': profileSectionPostslist.innerHTML,
            'parentElemSelector': '#profile-section_postslist'
          }
        })
      }
      // if there are songs in current playlist copy it to client
      var currentPlaylistSectionSonglist = document.getElementById('current-playlist-section_songlist')
      if (currentPlaylistSectionSonglist.innerHTML) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'prependElemWithHTML',
          'args': {
            'html': currentPlaylistSectionSonglist.innerHTML,
            'parentElemSelector': '#current-playlist-section_songlist'
          }
        })
      }

      // When a socket is closed, remove it from the list of connected sockets.
      socket.addEventListener('close', function () {
        for (var i = 0; i < connectedSockets.length; i++) {
          if (connectedSockets[i] === socket) {
            connectedSockets.splice(i, 1)
            break
          }
        }
      })
      return true
    })
  }

  function objToRequestParam (obj) {
    return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
  }

  function requestParamToObj (query) {
    query = query.substring(query.indexOf('?') + 1).split('&')
    var params = {}
    var pair
    var d = decodeURIComponent
    for (var i = query.length - 1; i >= 0; i--) {
      pair = query[i].split('=')
      params[d(pair[0])] = d(pair[1])
    }
    return params
  }

  function handleSocketsMessage (e) {
    var requestParams = requestParamToObj(e.data)
    if (e.data.indexOf('domManipulations?') === 0) {
      if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
        requestParams.args = JSON.parse(requestParams.args)
      }
      domManipulations[requestParams.function](requestParams.args)
    } else if (e.data.indexOf('sendRequestAndRemoveAudio?') === 0) {
      if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
        requestParams.args = JSON.parse(requestParams.args)
      }
      sendRequestAndRemoveAudio({
        'songlistItemSelector': requestParams.args.songlistItemSelector
      })
    } else if (e.data.indexOf('sendRequestAndAddAudio?') === 0) {
      if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
        requestParams.args = JSON.parse(requestParams.args)
      }
      sendRequestAndAddAudio({
        'songlistItemSelector': requestParams.args.songlistItemSelector
      })
    } else if (e.data.indexOf('downloadAudio?') === 0) {
      if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
        requestParams.args = JSON.parse(requestParams.args)
      }
      downloadAudioByUrl(requestParams.args.audioUrl, requestParams.args.songTitle)
    }
  }

  function sendDomManipulationsMessage (options) {
    options.socket.send('domManipulations' + objToRequestParam({
      'function': options.function,
      'args': JSON.stringify(options.args)
    }))
  }
  window.sendDomManipulationsMessage = sendDomManipulationsMessage

  /**
   * Search section logic.
   */
  var searchSectionSonglist = document.getElementById('search-section_songlist')
  searchSectionSonglist.dataset.audiosLoaded = 0
  var seacrhSectionSearchInput = document.getElementById('search-section_search-input')
  seacrhSectionSearchInput.addEventListener('change', function (event) {
    seacrhSectionSearchInput.dataset.currentValue = event.currentTarget.value
    if (!event.currentTarget.value) {
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setElemValue',
          'args': {
            'selector': '#search-section_search-input',
            'value': ''
          }
        })
      })
      return
    }

    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setElemValue',
        'args': {
          'selector': '#search-section_search-input',
          'value': event.currentTarget.value
        }
      })
    })

    vkRequest.send({
      'method': 'audio.search',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'q': event.currentTarget.value,
        'auto_complete': 1,
        'sort': 2,
        'search_own': 0,
        'count': 20
      }
    }).then(function (searchData) {
      var searchSectionSonglist = document.getElementById('search-section_songlist')
      searchSectionSonglist.dataset.audiosLoaded = 20
      if (parseBoolean(searchSectionSonglist.dataset.syncingWithCurrentPlaylistSection)) {
        delete searchSectionSonglist.dataset.syncingWithCurrentPlaylistSectionSonglist
      }

      domManipulations.cleanElemContent({
        'selector': '#search-section_songlist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'cleanElemContent',
          'args': {
            'selector': '#search-section_songlist'
          }
        })
      })

      domManipulations.insertItemsIntoSonglist({
        'songlistId': 'search-section_songlist',
        'songInfo': searchData.items
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoSonglist',
          'args': {
            'songlistId': 'search-section_songlist',
            'songInfo': searchData.items
          }
        })
      })

      if (searchData.count === 0) {
        domManipulations.addAttributeToElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#search-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      } else {
        domManipulations.removeAttributeFromElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeAttributeFromElem',
            'args': {
              'selector': '#search-section_load-more-songs-btn',
              'attrName': 'hidden'
            }
          })
        })
      }

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })

  var searchSectionLoadMoreBtn = document.getElementById('search-section_load-more-songs-btn')
  searchSectionLoadMoreBtn.addEventListener('click', function () {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })
    vkRequest.send({
      'method': 'audio.search',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'q': seacrhSectionSearchInput.dataset.currentValue,
        'auto_complete': 1,
        'sort': 2,
        'search_own': 0,
        'count': 10,
        'offset': searchSectionSonglist.dataset.audiosLoaded
      }
    }).then(function (searchData) {
      searchSectionSonglist.dataset.audiosLoaded = +searchSectionSonglist.dataset.audiosLoaded + 10
      if (searchData.count === 0) {
        domManipulations.addAttributeToElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#search-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      }
      domManipulations.insertItemsIntoSonglist({
        'songlistId': 'search-section_songlist',
        'songInfo': searchData.items
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoSonglist',
          'args': {
            'songlistId': 'search-section_songlist',
            'songInfo': searchData.items
          }
        })
      })
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })

  /**
   * Handling clicks on all songlist elements.
   */
  function handleClickOnSonglist (event) {
    if (event.target.classList.contains('songlist_item_menu-btn')) {
      event.stopPropagation()
      openContextMenuOnSonglistItem(event.target, event)
    } else if (event.target.classList.contains('songlist_item_menu-btn_icon')) {
      event.stopPropagation()
      openContextMenuOnSonglistItem(event.target.parentNode, event)
    } else if (event.currentTarget.classList.contains('current')) {
      document.querySelector('#player-controller_play-pause-btn').dispatchEvent(new window.Event('click'))
    } else {
      player.playSong(event.currentTarget)
    }
  }

  document.body.arrive('.songlist_item', function () {
    this.addEventListener('click', handleClickOnSonglist)
  })

  document.body.arrive('.broadcasting-profiles_item', function () {
    this.addEventListener('click', function () {
      this.querySelector('.songlist_item').dispatchEvent(new window.Event('click'))
    })
  })

  function downloadAudioByUrl (audioUrl, songTitle) {
    window.open('data:text/html;charset=utf-8,' +
      encodeURIComponent('<!doctype html><html><head> <meta charset="utf-8"> <title>Downloading song</title> <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"> <style>html, body{height: 100%; width: 100%; margin: 0; padding: 0;}body{background: #212121; color: #fff; font-family: serif; display: flex; flex-direction: column; align-items: center; justify-content: center; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;}.title{font-size: 3em; margin: 0;}.sub-title{font-size: 1.3em;}@media screen and (min-width: 400px){.title{font-size: 4em;}.sub-title{text-align: center;font-size: 1.6em;}}@media screen and (min-width: 500px){.title{font-size: 5.4em;}.sub-title{font-size: 2.1em;}}@media screen and (min-width: 600px){.title{font-size: 6em;}.sub-title{font-size: 2.3em;}}@media screen and (min-width: 700px){.title{font-size: 7em;}.sub-title{font-size: 2.4em;}}@media screen and (min-width: 800px){.title{font-size: 7.7em;}.sub-title{font-size: 2.45em;}}@media screen and (min-width: 1000px){.title{font-size: 9em;}.sub-title{font-size: 2.55em;}}</style></head><body> <h1 class="title">BrightCast</h1> <h3 class="sub-title">Downloading "' + songTitle + '"</h3> <a class="download-song" id="download-song" href="' + audioUrl + '" hidden download>Download</a> <script>document.querySelector(\'#download-song\').click() </script></body></html>'),
      null,
      'menubar=no,location=no,resizable=yes,status=yes'
    )
  }

  function openContextMenuOnSonglistItem (menuBtn, event) {
    hideContextMenu()
    event.stopPropagation()

    var songlistItemElem = menuBtn.parentNode
    var contextMenuContent = ''
    // check if song is in user's audios and add appropriate message
    if (songlistItemElem.dataset.songClass.indexOf(vkUserID) === 0) {
      contextMenuContent += '<li class="mdl-menu__item remove-from-audios">' +
      (chrome.i18n.getMessage('deleteSong') || 'Delete song') + '</li>'
    } else {
      contextMenuContent += '<li class="mdl-menu__item add-to-audios">' +
      (chrome.i18n.getMessage('addSong') || 'Add song') + '</li>'
    }
    contextMenuContent += '<li class="mdl-menu__item download">' +
      (chrome.i18n.getMessage('download') || 'Download') + '</li>'

    var menuBtnId = guid()
    menuBtn.id = menuBtnId
    document.body.insertAdjacentHTML('beforeend',
      '<ul class="mdl-menu mdl-menu--bottom-right mdl-js-menu mdl-js-ripple-effect"' +
      'for="' + menuBtnId + '">' + contextMenuContent + '</ul>')
    componentHandler.upgradeElement(document.querySelector('.mdl-menu'))
    menuBtn.dispatchEvent(new window.Event('click'))
    var menuContainer = document.querySelector('.mdl-menu__container')
    menuContainer.style.top = menuBtn.getBoundingClientRect().top + 'px'
    menuBtn.id = ''
    function hideContextMenuAndRemoveEventListener (e) {
      if (menuBtn.parentNode.parentNode) {
        menuBtn.parentNode.parentNode.removeEventListener('scroll', hideContextMenuAndRemoveEventListener)
      }
      document.body.removeEventListener('click', hideContextMenuAndRemoveEventListener)
      hideContextMenu()
    }
    document.body.addEventListener('click', hideContextMenuAndRemoveEventListener)
    menuBtn.parentNode.parentNode.parentNode.addEventListener('scroll', hideContextMenuAndRemoveEventListener)

    if (menuContainer.querySelector('.mdl-menu__item.remove-from-audios')) {
      menuContainer.querySelector('.mdl-menu__item.remove-from-audios').addEventListener('click', function () {
        sendRequestAndRemoveAudio({
          'songlistItemSelector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
        })
      })
    } else if (menuContainer.querySelector('.mdl-menu__item.add-to-audios')) {
      menuContainer.querySelector('.mdl-menu__item.add-to-audios').addEventListener('click', function () {
        sendRequestAndAddAudio({
          'songlistItemSelector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
        })
      })
    }
    menuContainer.querySelector('.mdl-menu__item.download').addEventListener('click', function () {
      downloadAudioByUrl(songlistItemElem.dataset.songUrl, songlistItemElem.dataset.songTitle)
    })
  }

  function hideContextMenu () {
    var contextMenu = document.querySelector('.mdl-menu__container')
    if (contextMenu !== null) contextMenu.remove()
  }

  // args {"songlistItemSelector"}
  function sendRequestAndRemoveAudio (args) {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })

    var songlistItemElem = document.querySelector(args.songlistItemSelector)
    if (!songlistItemElem) {
      console.error('No elements by selector')
      return
    }

    vkRequest.send({
      'method': 'audio.delete',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'audio_id': songlistItemElem.dataset.songClass.split('_')[1],
        'owner_id': songlistItemElem.dataset.songClass.split('_')[0]

      }
    }).then(function (response) {
      if (response !== 1) throw new Error('Сталася помилка')
      domManipulations.removeElem({
        'selector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'removeElem',
          'args': {
            'selector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
          }
        })
      })
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('deleted') || 'Deleted'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('deleted') || 'Deleted'
          }
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  }

  // args {"songlistItemSelector"}
  function sendRequestAndAddAudio (args) {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })

    var songlistItemElem = document.querySelector(args.songlistItemSelector)
    if (!songlistItemElem) {
      console.error('No elements by selector')
      return
    }

    vkRequest.send({
      'method': 'audio.add',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'audio_id': songlistItemElem.dataset.songClass.split('_')[1],
        'owner_id': songlistItemElem.dataset.songClass.split('_')[0]
      }
    }).then(function (response) {
      if (typeof response !== 'number') throw new Error('Сталася помилка')
      var newSonglistItemElem = songlistItemElem.cloneNode(true)
      newSonglistItemElem.dataset.songClass = vkUserID + '_' + response

      domManipulations.prependElemWithHTML({
        'html': newSonglistItemElem.outerHTML,
        'parentElemSelector': '#my-audios-section_songlist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'prependElemWithHTML',
          'args': {
            'html': newSonglistItemElem.outerHTML,
            'parentElemSelector': '#my-audios-section_songlist'
          }
        })
      })
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('added') || 'Added'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('added') || 'Added'
          }
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  }

  // search in friends and groups lists
  var profilesSectionSearch = {
    'friends': new Jets({
      searchTag: '#profiles-section_search-input',
      contentTag: '#profiles-section_friends-profiles'
    }),
    'groups': new Jets({
      searchTag: '#profiles-section_search-input',
      contentTag: '#profiles-section_groups-profiles'
    }),
    'broadcasting': new Jets({
      searchTag: '#profiles-section_search-input',
      contentTag: '#profiles-section_broadcasting-profiles'
    })
  }
  window.profilesSectionSearch = profilesSectionSearch
  document.getElementById('profiles-section').children[1].addEventListener('click', function () {
    var profilesSectionSearchInput = document.getElementById('profiles-section_search-input')
    profilesSectionSearchInput.value = ''
    profilesSectionSearchInput.dispatchEvent(new window.Event('change'))
  })

  // show message on online and offline events
  window.addEventListener('online', function () {
    domManipulations.showToast({
      'innerText': chrome.i18n.getMessage('internetConnectionEstablished') || 'Internet connection established'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('internetConnectionEstablished') || 'Internet connection established'
        }
      })
    })
  }, false)
  window.addEventListener('offline', function () {
    domManipulations.showToast({
      'innerText': chrome.i18n.getMessage('internetConnectionLost') || 'Internet connection lost',
      'duration': 10000
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('internetConnectionLost') || 'Internet connection lost',
          'duration': 10000
        }
      })
    })
  }, false)

  /**
   * Handling clicks on profiles-friends and profiles-groups
   */
  var profileSectionSonglist = document.querySelector('#profile-section_songlist')
  var profileSectionPostslist = document.querySelector('#profile-section_postslist')
  var profileSectionLoadMoreSongsBtn = document.getElementById('profile-section_load-more-songs-btn')
  var profileSectionLoadMorePostsBtn = document.getElementById('profile-section_load-more-posts-btn')

  function handleClickOnProfileslistItem (profileslistItem) {
    var profileId = profileslistItem.dataset.profileId
    var profileName = profileslistItem.querySelector('.profiles_item_title').innerText

    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })
    vkRequest.send({
      'method': 'execute.vkExecGetProfileAudioAndWallData',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'owner_id': profileId
      }
    }).then(function (response) {
      // songslist items templating
      domManipulations.cleanElemContent({
        'selector': '#profile-section_songlist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'cleanElemContent',
          'args': {
            'selector': '#profile-section_songlist'
          }
        })
      })
      domManipulations.insertItemsIntoSonglist({
        'songlistId': 'profile-section_songlist',
        'songInfo': response.userAudios.items
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoSonglist',
          'args': {
            'songlistId': 'profile-section_songlist',
            'songInfo': response.userAudios.items
          }
        })
      })

      if (response.userAudiosCount < 21) {
        domManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#profile-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      } else {
        domManipulations.removeAttributeFromElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeAttributeFromElem',
            'args': {
              'selector': '#profile-section_load-more-songs-btn',
              'attrName': 'hidden'
            }
          })
        })
        profileSectionSonglist.dataset.userAudiosCount = response.userAudiosCount
        profileSectionSonglist.dataset.userAudiosLoaded = 20
      }

      // wall posts templating
      profileSectionPostslist.dataset.postsLoaded = 20
      domManipulations.cleanElemContent({
        'selector': '#profile-section_postslist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'cleanElemContent',
          'args': {
            'selector': '#profile-section_postslist'
          }
        })
      })
      domManipulations.insertItemsIntoPostslist({
        'postslistId': 'profile-section_postslist',
        'postsInfo': response.wallPosts.items
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoPostslist',
          'args': {
            'postslistId': 'profile-section_postslist',
            'postsInfo': response.wallPosts.items
          }
        })
      })
      if (document.getElementById('profile-section_postslist').children.length === 0) {
        domManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#profile-section_load-more-posts-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      } else {
        domManipulations.removeAttributeFromElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeAttributeFromElem',
            'args': {
              'selector': '#profile-section_load-more-posts-btn',
              'attrName': 'hidden'
            }
          })
        })
      }

      domManipulations.setProfileSectionTitle({'title': profileName})
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setProfileSectionTitle',
          'args': {'title': profileName}
        })
      })
      domManipulations.setProfileSectionCurrentUserId({'currentUserId': profileId})
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'setProfileSectionCurrentUserId',
          'args': {'currentUserId': profileId}
        })
      })
      domManipulations.navigateTo({'sectionId': '#profile-section'})
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'navigateTo',
          'args': {'sectionId': '#profile-section'}
        })
      })

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  }

  document.getElementById('profiles-section_friends-profiles').addEventListener('click', function (event) {
    var eventTarget = event.target
    while (eventTarget !== event.currentTarget && eventTarget !== document.body) {
      if (eventTarget.classList.contains('profiles_item')) {
        handleClickOnProfileslistItem(eventTarget)
        break
      }
      eventTarget = eventTarget.parentNode
    }
  })
  document.getElementById('profiles-section_groups-profiles').addEventListener('click', function (event) {
    var eventTarget = event.target
    while (eventTarget !== event.currentTarget && eventTarget !== document.body) {
      if (eventTarget.classList.contains('profiles_item')) {
        handleClickOnProfileslistItem(eventTarget)
        break
      }
      eventTarget = eventTarget.parentNode
    }
  })

  /**
   * Handling clicks on profile-section-load-more-btns
   */

  profileSectionLoadMoreSongsBtn.addEventListener('click', function () {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })

    vkRequest.send({
      'method': 'audio.get',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'owner_id': domManipulations.getProfileSectionCurrentUserId(),
        'offset': profileSectionSonglist.dataset.userAudiosLoaded,
        'count': 20
      }
    }).then(function (response) {
      domManipulations.insertItemsIntoSonglist({
        'songlistId': 'profile-section_songlist',
        'songInfo': response.items
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoSonglist',
          'args': {
            'songlistId': 'profile-section_songlist',
            'songInfo': response.items
          }
        })
      })

      profileSectionSonglist.dataset.userAudiosLoaded = +profileSectionSonglist.dataset.userAudiosLoaded + 20

      // 6000 is vk limit
      if (!(+profileSectionSonglist.dataset.userAudiosLoaded < +profileSectionSonglist.dataset.userAudiosCount) ||
        !(+profileSectionSonglist.dataset.userAudiosLoaded < 6000)) {
        domManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#profile-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      }

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })

  profileSectionLoadMorePostsBtn.addEventListener('click', function () {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })

    var previousPostsCount = profileSectionPostslist.children.length

    vkRequest.send({
      'method': 'wall.get',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'owner_id': domManipulations.getProfileSectionCurrentUserId(),
        'offset': +profileSectionPostslist.dataset.postsLoaded,
        'count': 20
      }
    }).then(function (response) {
      domManipulations.insertItemsIntoPostslist({
        'postsInfo': response.items,
        'postslistId': 'profile-section_postslist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoPostslist',
          'args': {
            'postsInfo': response.items,
            'postslistId': 'profile-section_postslist'
          }
        })
      })

      profileSectionPostslist.dataset.postsLoaded = +profileSectionPostslist.dataset.postsLoaded + 20

      if (previousPostsCount === profileSectionPostslist.children.length) {
        domManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addAttributeToElem',
            'args': {
              'selector': '#profile-section_load-more-posts-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            }
          })
        })
      }

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })

  /**
   * Handling changes of currentPlaylist
   */
  var currentPlaylistSectionSonglist = document.getElementById('current-playlist-section_songlist')

  function handleAddedSonglistItemAndSyncWithCurrentPlaylistSonglist () {
    domManipulations.cleanElemContent({
      'selector': '#current-playlist-section_songlist'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'cleanElemContent',
        'args': {
          'selector': '#current-playlist-section_songlist'
        }
      })
    })
    domManipulations.prependElemWithHTML({
      'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
      'parentElemSelector': '#current-playlist-section_songlist'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'prependElemWithHTML',
        'args': {
          'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
          'parentElemSelector': '#current-playlist-section_songlist'
        }
      })
    })
  }

  function handleRemovedSonglistItemAndSyncWithCurrentPlaylistSonglist () {
    domManipulations.cleanElemContent({
      'selector': '#current-playlist-section_songlist'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'cleanElemContent',
        'args': {
          'selector': '#current-playlist-section_songlist'
        }
      })
    })
    domManipulations.prependElemWithHTML({
      'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
      'parentElemSelector': '#current-playlist-section_songlist'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'prependElemWithHTML',
        'args': {
          'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
          'parentElemSelector': '#current-playlist-section_songlist'
        }
      })
    })
  }

  var syncWithCurrentPlaylistObserver = new MutationSummary({ // eslint-disable-line no-unused-vars
    callback: function (summaries) {
      var changeSummary = summaries[0]

      changeSummary.added.forEach(function (newEl) {
        newEl.arrive('.songlist_item', handleAddedSonglistItemAndSyncWithCurrentPlaylistSonglist)
        newEl.leave('.songlist_item', handleRemovedSonglistItemAndSyncWithCurrentPlaylistSonglist)
        domManipulations.cleanElemContent({
          'selector': '#current-playlist-section_songlist'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'cleanElemContent',
            'args': {
              'selector': '#current-playlist-section_songlist'
            }
          })
        })
        domManipulations.prependElemWithHTML({
          'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
          'parentElemSelector': '#current-playlist-section_songlist'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'prependElemWithHTML',
            'args': {
              'html': document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]').innerHTML,
              'parentElemSelector': '#current-playlist-section_songlist'
            }
          })
        })
      })

      changeSummary.removed.forEach(function (removedEl) {
        removedEl.unbindArrive('.songlist_item', handleAddedSonglistItemAndSyncWithCurrentPlaylistSonglist)
        removedEl.unbindLeave('.songlist_item', handleRemovedSonglistItemAndSyncWithCurrentPlaylistSonglist)
        domManipulations.cleanElemContent({
          'selector': '#current-playlist-section_songlist'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'cleanElemContent',
            'args': {
              'selector': '#current-playlist-section_songlist'
            }
          })
        })
      })
    },
    queries: [{
      attribute: 'data-syncing-with-current-playlist-section-songlist'
    }]
  })

  /**
   * Player logic
   */
  var player = {}
  player.elem = new window.Audio()
  player.elem.autoplay = false
  player.elem.preload = 'auto'
  player.elem.volume = 0.4

  player.elem.onerror = function () {
    // if player was cleaned don't show error message
    if (document.querySelector('#player-controller_song-info').innerText === '') return

    domManipulations.showToast({
      'innerText': chrome.i18n.getMessage('songUnavailable') || 'Song unavailable'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('songUnavailable') || 'Song unavailable'
        }
      })
    })

    if (navigator.onLine) document.querySelector('#player-controller_skip-next-btn').dispatchEvent(new window.Event('click'))
  }

  player.currentSonglist = null

  player.playSong = function (songlistItem) {
    if (!songlistItem.parentNode) return

    if (!player.currentSonglist || ((player.currentSonglist.id !== songlistItem.parentNode.id) &&
      (currentPlaylistSectionSonglist.id !== songlistItem.parentNode.id))) {
      if (document.querySelector('.songlist_item.current')) {
        domManipulations.removeClassFromElem({
          'selector': '.songlist_item.current',
          'className': 'current'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeClassFromElem',
            'args': {
              'selector': '.songlist_item.current',
              'className': 'current'
            }
          })
        })
      }

      if (document.querySelector('.songlist_item.is-playing')) {
        domManipulations.removeClassFromElem({
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeClassFromElem',
            'args': {
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            }
          })
        })
      }

      player.currentSong = null
      if (player.currentSonglist) delete player.currentSonglist.dataset.syncingWithCurrentPlaylistSectionSonglist
      setTimeout(function () {
        songlistItem.parentNode.dataset.syncingWithCurrentPlaylistSectionSonglist = true
        player.currentSonglist = songlistItem.parentNode
      }, 1)
    }

    if (songlistItem.parentNode.id !== 'current-playlist-section_songlist') {
      setTimeout(function () {
        songlistItem = currentPlaylistSectionSonglist.querySelector('.songlist_item[data-song-class="' + songlistItem.dataset.songClass + '"]')
      }, 1)
    }

    player.previousSong = player.currentSong
    if (player.previousSong) {
      if (document.querySelector('.songlist_item.current')) {
        domManipulations.removeClassFromElem({
          'selector': '.songlist_item.current',
          'className': 'current'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeClassFromElem',
            'args': {
              'selector': '.songlist_item.current',
              'className': 'current'
            }
          })
        })
      }

      if (document.querySelector('.songlist_item.is-playing')) {
        domManipulations.removeClassFromElem({
          'selector': '.songlist_item.is-playing',
          'className': 'is-playing'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'removeClassFromElem',
            'args': {
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            }
          })
        })
      }
    }

    player.currentSong = songlistItem
    domManipulations.addClassToElem({
      'selector': 'div[data-song-class="' + songlistItem.dataset.songClass + '"]',
      'className': 'current'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'addClassToElem',
        'args': {
          'selector': 'div[data-song-class="' + songlistItem.dataset.songClass + '"]',
          'className': 'current'
        }
      })
    })
    domManipulations.addClassToElem({
      'selector': '.songlist_item.current',
      'className': 'is-playing'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'addClassToElem',
        'args': {
          'selector': '.songlist_item.current',
          'className': 'is-playing'
        }
      })
    })

    if (player.broadcast) player.setBroadcast(player.currentSong)

    domManipulations.setElemInnerHTML({
      'selector': '#player-controller_song-info',
      'html': songlistItem.dataset.songTitle.slice(0, 45)
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_song-info',
          'html': songlistItem.dataset.songTitle.slice(0, 45)
        }
      })
    })

    domManipulations.addAttributeToElem({
      'selector': '#player-controller_add-songs-to-audios-btn',
      'attrName': 'data-current-song-id',
      'attrValue': songlistItem.dataset.songClass
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'addAttributeToElem',
        'args': {
          'selector': '#player-controller_add-songs-to-audios-btn',
          'attrName': 'data-current-song-id',
          'attrValue': songlistItem.dataset.songClass
        }
      })
    })

    player.elem.currentTime = 0
    player.elem.src = songlistItem.dataset.songUrl
    player.elem.play()
    domManipulations.changeSliderValue({
      'selector': '#player-controller_song-range',
      'value': 0
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'changeSliderValue',
        'args': {
          'selector': '#player-controller_song-range',
          'value': 0
        }
      })
    })

    domManipulations.setElemInnerHTML({
      'selector': '#player-controller_current-time',
      'html': '0:00'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_current-time',
          'html': '0:00'
        }
      })
    })

    domManipulations.setElemInnerHTML({
      'selector': '#player-controller_song-duration',
      'html': secondsTohhmmss(+songlistItem.dataset.songDuration)
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_song-duration',
          'html': secondsTohhmmss(+songlistItem.dataset.songDuration)
        }
      })
    })
  }

  player.setBroadcast = function (songlistItem) {
    var audio = songlistItem
      ? songlistItem.dataset.songClass
      : ''
    vkRequest.send({
      'method': 'audio.setBroadcast',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'audio': audio
      }
    })
  }

  player.elem.addEventListener('timeupdate', function (event) {
    domManipulations.setElemInnerHTML({
      'selector': '#player-controller_current-time',
      'html': secondsTohhmmss(event.target.currentTime, ':')
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_current-time',
          'html': secondsTohhmmss(event.target.currentTime, ':')
        }
      })
    })

    domManipulations.changeSliderValue({
      'selector': '#player-controller_song-range',
      'value': event.target.currentTime / event.target.duration * 100
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'changeSliderValue',
        'args': {
          'selector': '#player-controller_song-range',
          'value': event.target.currentTime / event.target.duration * 100
        }
      })
    })
  })

  // handle changes on song range
  document.querySelector('#player-controller_song-range').addEventListener('input', function (event) {
    if (isNaN(player.elem.duration)) return
    player.elem.currentTime = event.currentTarget.value * player.elem.duration / 100
  })

  // handle changes on volume range
  document.querySelector('#player-controller_volume-range').addEventListener('input', function (event) {
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'changeSliderValue',
        'args': {
          'selector': '#player-controller_volume-range',
          'value': event.target.value
        }
      })
    })
    player.elem.volume = event.target.value / 100
  })

  // clean player method
  player.clean = function () {
    domManipulations.cleanPlayer()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'cleanPlayer'
      })
    })
    player.previousSong = null
    player.currentSong = null
    player.elem.src = ''
  }

  // play and pause events handling to change button appearance
  player.elem.addEventListener('play', function () {
    domManipulations.setPlayPauseBtnIcon({
      'icon': 'pause'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setPlayPauseBtnIcon',
        'args': {
          'icon': 'pause'
        }
      })
    })
  })

  player.elem.addEventListener('pause', function () {
    domManipulations.setPlayPauseBtnIcon({
      'icon': 'play_arrow'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'setPlayPauseBtnIcon',
        'args': {
          'icon': 'play_arrow'
        }
      })
    })
  })

  document.querySelector('#player-controller_loop-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('loop-true')) {
      domManipulations.removeClassFromElem({
        'selector': '#player-controller_loop-btn',
        'className': 'loop-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'removeClassFromElem',
          'args': {
            'selector': '#player-controller_loop-btn',
            'className': 'loop-true'
          }
        })
      })
      player.loop = false
    } else {
      domManipulations.addClassToElem({
        'selector': '#player-controller_loop-btn',
        'className': 'loop-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addClassToElem',
          'args': {
            'selector': '#player-controller_loop-btn',
            'className': 'loop-true'
          }
        })
      })
      player.loop = true
    }
  })
  document.querySelector('#player-controller_shuffle-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('shuffle-true')) {
      domManipulations.removeClassFromElem({
        'selector': '#player-controller_shuffle-btn',
        'className': 'shuffle-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'removeClassFromElem',
          'args': {
            'selector': '#player-controller_shuffle-btn',
            'className': 'shuffle-true'
          }
        })
      })
      player.shuffle = false
    } else {
      domManipulations.addClassToElem({
        'selector': '#player-controller_shuffle-btn',
        'className': 'shuffle-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addClassToElem',
          'args': {
            'selector': '#player-controller_shuffle-btn',
            'className': 'shuffle-true'
          }
        })
      })
      player.shuffle = true
    }
  })
  document.querySelector('#player-controller_broadcast-btn').addEventListener('click', function (event) {
    if (event.currentTarget.classList.contains('broadcast-true')) {
      domManipulations.removeClassFromElem({
        'selector': '#player-controller_broadcast-btn',
        'className': 'broadcast-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'removeClassFromElem',
          'args': {
            'selector': '#player-controller_broadcast-btn',
            'className': 'broadcast-true'
          }
        })
      })
      player.setBroadcast()
      player.broadcast = false
    } else {
      domManipulations.addClassToElem({
        'selector': '#player-controller_broadcast-btn',
        'className': 'broadcast-true'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addClassToElem',
          'args': {
            'selector': '#player-controller_broadcast-btn',
            'className': 'broadcast-true'
          }
        })
      })
      if (player.currentSong) player.setBroadcast(player.currentSong)
      player.broadcast = true
    }
  })

  player.playNextSong = function (event) {
    if (!player.currentSong || !document.querySelector('.songlist[data-syncing-with-current-playlist-section-songlist="true"]')) return

    if (!player.loop && player.currentSonglist && (player.currentSonglist.children.length === 1) &&
     !player.currentSonglist.classList.contains('postlists_item_songlist')) {
      player.elem.pause()
      player.elem.currentTime = 0
      return
    }

    if (player.loop && (event.target === player.elem)) {
      player.elem.currentTime = 0
      player.elem.play()
      return
    }

    if (player.shuffle && player.currentSonglist.children.length !== 1) {
      var nextSongNum = getRandomIntFromTo(0, currentPlaylistSectionSonglist.children.length - 1)
      player.playSong(currentPlaylistSectionSonglist.children[nextSongNum])
    } else {
      if (player.currentSong.nextElementSibling) {
        player.playSong(player.currentSong.nextElementSibling)
      } else {
        if (player.currentSonglist.classList.contains('postlists_item_songlist') &&
         player.currentSonglist.parentNode.nextElementSibling) {
          if (document.querySelector('.songlist_item.is-playing')) {
            domManipulations.removeClassFromElem({
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            })
            connectedSockets.forEach(function (socket) {
              sendDomManipulationsMessage({
                'socket': socket,
                'function': 'removeClassFromElem',
                'args': {
                  'selector': '.songlist_item.is-playing',
                  'className': 'is-playing'
                }
              })
            })
          }
          if (document.querySelector('.songlist_item.current')) {
            domManipulations.removeClassFromElem({
              'selector': '.songlist_item.current',
              'className': 'current'
            })
            connectedSockets.forEach(function (socket) {
              sendDomManipulationsMessage({
                'socket': socket,
                'function': 'removeClassFromElem',
                'args': {
                  'selector': '.songlist_item.current',
                  'className': 'current'
                }
              })
            })
          }
          var nextSonglist = player.currentSonglist.parentNode.nextElementSibling.querySelector('.songlist')
          nextSonglist.firstElementChild.dispatchEvent(new window.Event('click'))
        } else {
          if (document.querySelector('.songlist_item.is-playing')) {
            domManipulations.removeClassFromElem({
              'selector': '.songlist_item.is-playing',
              'className': 'is-playing'
            })
            connectedSockets.forEach(function (socket) {
              sendDomManipulationsMessage({
                'socket': socket,
                'function': 'removeClassFromElem',
                'args': {
                  'selector': '.songlist_item.is-playing',
                  'className': 'is-playing'
                }
              })
            })
          }
        }
      }
    }
  }

  player.playPreviousSong = function () {
    if (!player.previousSong) return
    player.playSong(player.previousSong)
  }

  var myAudioSectionSonglist = document.querySelector('#my-audios-section_songlist')
  player.elem.addEventListener('ended', player.playNextSong)
  document.querySelector('#player-controller_skip-previous-btn').addEventListener('click', player.playPreviousSong)
  document.querySelector('#player-controller_skip-next-btn').addEventListener('click', player.playNextSong)
  document.querySelector('#player-controller_play-pause-btn').addEventListener('click', function (event) {
    if (player.elem.paused) {
      if (!player.previousSong && !player.currentSong) {
        if (myAudioSectionSonglist.firstElementChild) {
          player.playSong(myAudioSectionSonglist.firstElementChild)
        } else {
          domManipulations.showToast({
            'innerText': chrome.i18n.getMessage('noSongsInPlaylist') || 'There aren\'t any songs in playlist'
          })
          connectedSockets.forEach(function (socket) {
            sendDomManipulationsMessage({
              'socket': socket,
              'function': 'showToast',
              'args': {
                'innerText': chrome.i18n.getMessage('noSongsInPlaylist') || 'There aren\'t any songs in playlist'
              }
            })
          })
        }
      } else {
        player.elem.play()
        domManipulations.addClassToElem({
          'selector': '.songlist_item.current',
          'className': 'is-playing'
        })
        connectedSockets.forEach(function (socket) {
          sendDomManipulationsMessage({
            'socket': socket,
            'function': 'addClassToElem',
            'args': {
              'selector': '.songlist_item.current',
              'className': 'is-playing'
            }
          })
        })
      }
    } else {
      player.elem.pause()
      domManipulations.removeClassFromElem({
        'selector': '.songlist_item.is-playing',
        'className': 'is-playing'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'removeClassFromElem',
          'args': {
            'selector': '.songlist_item.is-playing',
            'className': 'is-playing'
          }
        })
      })
    }
  })

  document.querySelector('#drawer-panel_header').addEventListener('click', function () {
    domManipulations.navigateTo({'sectionId': '#my-audios-section'})
  })

  document.querySelector('#log-out-btn').addEventListener('click', function () {
    chrome.storage.local.remove(['vkAccessToken', 'vkUserID'], function () {
      window.dispatchEvent(new window.CustomEvent('logOut'))
    })
  })

  // update broadcastingList on click on tab
  document.querySelector('#profiles-section_tabs_broadcasting-tab').addEventListener('click', function () {
    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })
    vkRequest.send({
      'method': 'audio.getBroadcastList',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'active': 1
      }
    }).then(function (response) {
      domManipulations.cleanElemContent({
        'selector': '#profiles-section_broadcasting-profiles'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'cleanElemContent',
          'args': {
            'selector': '#profiles-section_broadcasting-profiles'
          }
        })
      })

      response.forEach(function (currentValue, index, array) {
        if (currentValue.type === 'profile') {
          array[index].profileId = array[index].id
          array[index].profileType = 'person'
          array[index].profileTitle = array[index].first_name + ' ' + array[index].last_name
        } else {
          array[index].profileId = array[index].id
          array[index].profileType = 'group'
          array[index].profileTitle = array[index].name
        }
      })

      domManipulations.insertItemsIntoBroadcastingProfileslist({
        'profileslistId': 'profiles-section_broadcasting-profiles',
        'profilesInfo': response
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'insertItemsIntoBroadcastingProfileslist',
          'args': {
            'profileslistId': 'profiles-section_broadcasting-profiles',
            'profilesInfo': response
          }
        })
      })

      domManipulations.updateProfilesSectionSearch()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'updateProfilesSectionSearch'
        })
      })

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })

  document.querySelector('#player-controller_add-songs-to-audios-btn').addEventListener('click', function (event) {
    if (event.currentTarget.dataset.currentSongId.indexOf(vkUserID) === 0) return

    domManipulations.showSpinner()
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showSpinner'
      })
    })

    var songId = event.currentTarget.dataset.currentSongId

    vkRequest.send({
      'method': 'audio.add',
      'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID,
        'audio_id': songId.split('_')[1],
        'owner_id': songId.split('_')[0]
      }
    }).then(function (response) {
      if (typeof response !== 'number') throw new Error('Сталася помилка')
      var newSonglistItemElem = player.currentSong.cloneNode(true)
      newSonglistItemElem.dataset.songClass = vkUserID + '_' + response

      domManipulations.prependElemWithHTML({
        'html': newSonglistItemElem.outerHTML,
        'parentElemSelector': '#my-audios-section_songlist'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'prependElemWithHTML',
          'args': {
            'html': newSonglistItemElem.outerHTML,
            'parentElemSelector': '#my-audios-section_songlist'
          }
        })
      })

      domManipulations.addAttributeToElem({
        'selector': '#player-controller_add-songs-to-audios-btn',
        'attrName': 'data-current-song-id',
        'attrValue': vkUserID + '_' + response
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'addAttributeToElem',
          'args': {
            'selector': '#player-controller_add-songs-to-audios-btn',
            'attrName': 'data-current-song-id',
            'attrValue': vkUserID + '_' + response
          }
        })
      })

      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('added') || 'Added'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('added') || 'Added'
          }
        })
      })
    }).catch(function (err) {
      domManipulations.hideSpinner()
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'hideSpinner'
        })
      })
      domManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      connectedSockets.forEach(function (socket) {
        sendDomManipulationsMessage({
          'socket': socket,
          'function': 'showToast',
          'args': {
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
          }
        })
      })
      console.error(err)
    })
  })
}())
