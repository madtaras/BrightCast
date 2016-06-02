/* global chrome */
chrome.storage.local.get(['vkUserID', 'vkAccessToken'], function (localStorageData) {
  // Loading modules
  var componentHandler = require('../common/material.js')
  var guid = require('../common/functions/guid.js')
  var Arrive = require('../common/arrive.js') // eslint-disable-line no-unused-vars
  var server = require('./server/server.js')
  var vkRequest = require('./vkRequest.js')(localStorageData.vkUserID, localStorageData.vkAccessToken, '5.40')
  var remoteManipulations = require('../common/remoteManipulations.js')
  var player = require('./player.js')(remoteManipulations, server, vkRequest)
  require('./desktopLocalization.js')
  require('./shortcuts.js')

  // Setting up a server
  server.onSocketConnection = function (socket) {
    function sendRemoteManipulationsMsgToSocket (options) {
      options.socket.send('remoteManipulations' + server.objToRequestParam({
        'func': options.func,
        'args': JSON.stringify(options.args)
      }))
    }

    sendRemoteManipulationsMsgToSocket({
      'socket': socket,
      'func': 'showSpinner'
    })

    socket.addEventListener('message', function (e) {
      var requestParams = server.requestParamToObj(e.data)
      if (e.data.indexOf('remoteManipulations?') === 0) {
        if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
          requestParams.args = JSON.parse(requestParams.args)
        }
        remoteManipulations[requestParams.func](requestParams.args)
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
    })

    vkRequest.send({
      'method': 'execute.getDataForAppInit',
      'requestParams': {
        'my_audios_to_load': document.querySelector('#my-audios-section_songlist').children.length
      }
    }).then(function (response) {
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'insertUserInfoIntoDrawerHeader',
        'args': response.userInfo
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setGlobalVariable',
        'args': {
          'propertyName': 'vkUserID',
          'propertyValue': localStorageData.vkUserID
        }
      })

      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'insertItemsIntoSonglist',
        'args': {
          'songInfo': response.userAudios.items,
          'songlistId': 'my-audios-section_songlist'
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'addClassToElem',
        'args': {
          'selector': 'body',
          'className': 'user-audios-loaded'
        }
      })
      if (document.querySelector('#my-audios-section_load-more-songs-btn').hidden) {
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'addAttributeToElem',
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
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'insertItemsIntoProfileslist',
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
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'insertItemsIntoProfileslist',
        'args': {
          'profileslistId': 'profiles-section_groups-profiles',
          'profilesInfo': response.userGroups.items
        }
      })

      if (player.loop) {
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'addClassToElem',
          'args': {
            'selector': '#player-controller_loop-btn',
            'className': 'loop-true'
          }
        })
      }
      if (player.shuffle) {
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'addClassToElem',
          'args': {
            'selector': '#player-controller_shuffle-btn',
            'className': 'shuffle-true'
          }
        })
      }
      if (player.broadcast) {
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'addClassToElem',
          'args': {
            'selector': '#player-controller_broadcast-btn',
            'className': 'broadcast-true'
          }
        })
      }

      var playPauseCurrentIcon = document.querySelector('#player-controller_play-pause-btn_icon').innerHTML
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setPlayPauseBtnIcon',
        'args': {
          'icon': playPauseCurrentIcon
        }
      })

      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'changeSliderValue',
        'args': {
          'selector': '#player-controller_song-range',
          'value': document.querySelector('#player-controller_song-range').value
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'changeSliderValue',
        'args': {
          'selector': '#player-controller_volume-range',
          'value': document.querySelector('#player-controller_volume-range').value
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_current-time',
          'html': document.querySelector('#player-controller_current-time').innerHTML
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setElemInnerHTML',
        'args': {
          'selector': '#player-controller_song-duration',
          'html': document.querySelector('#player-controller_song-duration').innerHTML
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setElemInnerHTML',
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
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'insertItemsIntoBroadcastingProfileslist',
          'args': {
            'profileslistId': 'profiles-section_broadcasting-profiles',
            'profilesInfo': response.broadcastingFriends
          }
        })
        remoteManipulations.insertItemsIntoBroadcastingProfileslist({
          'profileslistId': 'profiles-section_broadcasting-profiles',
          'profilesInfo': response.broadcastingFriends
        })
      }
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'updateProfilesSectionSearch'
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'injectStyles',
        'args': {
          'rules': [
            '.player-controller_add-songs-to-audios-btn[data-current-song-id^="' + localStorageData.vkUserID + '"] {' +
            'pointer-events: none;' +
            'display: none;' +
            '}'
          ]
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'addAttributeToElem',
        'args': {
          'selector': '#player-controller_add-songs-to-audios-btn',
          'attrName': 'data-current-song-id',
          'attrValue': document.querySelector('#player-controller_add-songs-to-audios-btn').dataset.currentSongId
        }
      })

      if (player.currentSong) {
        sendRemoteManipulationsMsgToSocket({
          'socket': socket,
          'func': 'addClassToElem',
          'args': {
            'selector': 'div[data-song-class="' + player.currentSong.dataset.songClass + '"]',
            'className': 'current'
          }
        })
        if (player.currentSong.classList.contains('is-playing')) {
          sendRemoteManipulationsMsgToSocket({
            'socket': socket,
            'func': 'addClassToElem',
            'args': {
              'selector': 'div[data-song-class="' + player.currentSong.dataset.songClass + '"]',
              'className': 'is-playing'
            }
          })
        }
      }

      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'hideSpinner'
      })
    })

    // if opened some profile in profile section copy it to client
    var profileSectionSonglist = document.getElementById('profile-section_songlist')
    var profileSectionPostslist = document.getElementById('profile-section_postslist')
    if (profileSectionSonglist.children.length || profileSectionPostslist.children.length) {
      var profileSectionTitle = remoteManipulations.getProfileSectionTitle()
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'setProfileSectionTitle',
        'args': { 'title': profileSectionTitle }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'prependElemWithHTML',
        'args': {
          'html': profileSectionSonglist.innerHTML,
          'parentElemSelector': '#profile-section_songlist'
        }
      })
      sendRemoteManipulationsMsgToSocket({
        'socket': socket,
        'func': 'prependElemWithHTML',
        'args': {
          'html': profileSectionPostslist.innerHTML,
          'parentElemSelector': '#profile-section_postslist'
        }
      })
    }
  }

  /**
   * Search section logic.
   */
  var searchSectionSonglist = document.getElementById('search-section_songlist')
  searchSectionSonglist.dataset.audiosLoaded = 0
  var seacrhSectionSearchInput = document.getElementById('search-section_search-input')
  seacrhSectionSearchInput.addEventListener('change', function (event) {
    seacrhSectionSearchInput.dataset.currentValue = event.currentTarget.value
    if (!event.currentTarget.value) {
      server.sendRemoteManipulationsMsg({
        'func': 'setElemValue',
        'args': {
          'selector': '#search-section_search-input',
          'value': ''
        }
      })
      return
    }

    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'setElemValue',
      'args': {
        'selector': '#search-section_search-input',
        'value': event.currentTarget.value
      }
    })

    vkRequest.send({
      'method': 'audio.search',
      'requestParams': {
        'q': event.currentTarget.value,
        'auto_complete': 1,
        'sort': 2,
        'search_own': 0,
        'count': 20
      }
    }).then(function (searchData) {
      var searchSectionSonglist = document.getElementById('search-section_songlist')
      searchSectionSonglist.dataset.audiosLoaded = 20

      remoteManipulations.cleanElemContent({
        'selector': '#search-section_songlist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'cleanElemContent',
        'args': {
          'selector': '#search-section_songlist'
        }
      })

      remoteManipulations.insertItemsIntoSonglist({
        'songlistId': 'search-section_songlist',
        'songInfo': searchData.items
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoSonglist',
        'args': {
          'songlistId': 'search-section_songlist',
          'songInfo': searchData.items
        }
      })

      if (searchData.count === 0) {
        remoteManipulations.addAttributeToElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#search-section_load-more-songs-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      } else {
        remoteManipulations.removeAttributeFromElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeAttributeFromElem',
          'args': {
            'selector': '#search-section_load-more-songs-btn',
            'attrName': 'hidden'
          }
        })
      }

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  var searchSectionLoadMoreBtn = document.getElementById('search-section_load-more-songs-btn')
  searchSectionLoadMoreBtn.addEventListener('click', function () {
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    vkRequest.send({
      'method': 'audio.search',
      'requestParams': {
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
        remoteManipulations.addAttributeToElem({
          'selector': '#search-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#search-section_load-more-songs-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      }
      remoteManipulations.insertItemsIntoSonglist({
        'songlistId': 'search-section_songlist',
        'songInfo': searchData.items
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoSonglist',
        'args': {
          'songlistId': 'search-section_songlist',
          'songInfo': searchData.items
        }
      })
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  /**
   * Handling clicks on all songlist elements.
   */
  function handleClickOnSonglist (event) {
    var target = event.target
    while (target !== this) {
      if (target.classList.contains('songlist_item_menu-btn')) {
        event.stopPropagation()
        openContextMenuOnSonglistItem(target, event)
        return
      } else if (target.classList.contains('songlist_item_menu-btn_icon')) {
        event.stopPropagation()
        openContextMenuOnSonglistItem(target.parentNode, event)
        return
      } else if (target.classList.contains('current') && target.classList.contains('songlist_item')) {
        player.togglePlayPause()
        return
      } else if (target.classList.contains('songlist_item')) {
        player.playSong(target)
        return
      }
      target = target.parentNode
    }
  }

  document.body.arrive('.songlist', function () {
    this.addEventListener('click', handleClickOnSonglist)
  })

  Array.prototype.forEach.call(document.querySelectorAll('.songlist'), function (songlist) {
    songlist.addEventListener('click', handleClickOnSonglist)
  })

  document.querySelector('#profiles-section_broadcasting-profiles').addEventListener('click', function (event) {
    var target = event.target
    while (target !== this) {
      if (target.classList.contains('broadcasting-profiles_item')) {
        player.playSong(target.querySelector('.songlist_item'))
        return
      }
      target = target.parentNode
    }
  })

  // Downloading songs
  function downloadAudioByUrl (audioUrl, songTitle, songClass){
    var xhr = new XMLHttpRequest()
        xhr.open("GET", audioUrl, true)
      /*xhr.onerror = function(err){
        $('#'+songClass).css({
          'width':'100%',
          'background': 'rgb(180,25,25)'
        });
      }
      xhr.onprogress = function(xhrProgressEvent){
        $('#'+songClass).css({
          'width': ((xhrProgressEvent.loaded / xhrProgressEvent.total) * 100) + '%',
        });
      }*/
      xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
          var hyperlink = document.createElement('a')
          hyperlink.href = audioUrl
          hyperlink.target = '_blank'
          hyperlink.download = songTitle

          var mouseEvent = new MouseEvent('click', {
              view: window,
              bubbles: true,
              cancelable: true
          });
          hyperlink.dispatchEvent(mouseEvent)
        }
      }
    xhr.send()
  }

  function openContextMenuOnSonglistItem (menuBtn, event) {
    hideContextMenu()
    event.stopPropagation()

    var songlistItemElem = menuBtn.parentNode
    var contextMenuContent = ''
    // check if song is in user's audios and add appropriate message
    if (songlistItemElem.dataset.songClass.indexOf(localStorageData.vkUserID) === 0) {
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
      downloadAudioByUrl(songlistItemElem.dataset.songUrl, songlistItemElem.dataset.songTitle, songlistItemElem.dataset.songClass)
    })
  }

  function hideContextMenu () {
    var contextMenu = document.querySelector('.mdl-menu__container')
    if (contextMenu !== null) contextMenu.remove()
  }

  // args {"songlistItemSelector"}
  function sendRequestAndRemoveAudio (args) {
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    var songlistItemElem = document.querySelector(args.songlistItemSelector)
    if (!songlistItemElem) {
      console.error('No elements by selector')
      return
    }

    vkRequest.send({
      'method': 'audio.delete',
      'requestParams': {
        'audio_id': songlistItemElem.dataset.songClass.split('_')[1],
        'owner_id': songlistItemElem.dataset.songClass.split('_')[0]

      }
    }).then(function (response) {
      if (response !== 1) throw new Error('Сталася помилка')
      remoteManipulations.removeElem({
        'selector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'removeElem',
        'args': {
          'selector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'
        }
      })
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('deleted') || 'Deleted'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('deleted') || 'Deleted'
        }
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  }

  // args {"songlistItemSelector"}
  function sendRequestAndAddAudio (args) {
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    var songlistItemElem = document.querySelector(args.songlistItemSelector)
    if (!songlistItemElem) {
      console.error('No elements by selector')
      return
    }

    vkRequest.send({
      'method': 'audio.add',
      'requestParams': {
        'audio_id': songlistItemElem.dataset.songClass.split('_')[1],
        'owner_id': songlistItemElem.dataset.songClass.split('_')[0]
      }
    }).then(function (response) {
      if (typeof response !== 'number') throw new Error('Сталася помилка')
      var newSonglistItemElem = songlistItemElem.cloneNode(true)
      newSonglistItemElem.dataset.songClass = localStorageData.vkUserID + '_' + response

      remoteManipulations.prependElemWithHTML({
        'html': newSonglistItemElem.outerHTML,
        'parentElemSelector': '#my-audios-section_songlist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'prependElemWithHTML',
        'args': {
          'html': newSonglistItemElem.outerHTML,
          'parentElemSelector': '#my-audios-section_songlist'
        }
      })
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('added') || 'Added'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('added') || 'Added'
        }
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  }

  document.getElementById('profiles-section').children[1].addEventListener('click', function () {
    var profilesSectionSearchInput = document.getElementById('profiles-section_search-input')
    profilesSectionSearchInput.value = ''
    profilesSectionSearchInput.dispatchEvent(new window.Event('change'))
  })

  // show message on online and offline events
  window.addEventListener('online', function () {
    remoteManipulations.showToast({
      'innerText': chrome.i18n.getMessage('internetConnectionEstablished') || 'Internet connection established'
    })
    server.sendRemoteManipulationsMsg({
      'func': 'showToast',
      'args': {
        'innerText': chrome.i18n.getMessage('internetConnectionEstablished') || 'Internet connection established'
      }
    })
  }, false)
  window.addEventListener('offline', function () {
    remoteManipulations.showToast({
      'innerText': chrome.i18n.getMessage('internetConnectionLost') || 'Internet connection lost',
      'duration': 10000
    })
    server.sendRemoteManipulationsMsg({
      'func': 'showToast',
      'args': {
        'innerText': chrome.i18n.getMessage('internetConnectionLost') || 'Internet connection lost',
        'duration': 10000
      }
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

    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })
    vkRequest.send({
      'method': 'execute.getProfileAudioAndWallData',
      'requestParams': {
        'owner_id': profileId
      }
    }).then(function (response) {
      // songslist items templating
      remoteManipulations.cleanElemContent({
        'selector': '#profile-section_songlist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'cleanElemContent',
        'args': {
          'selector': '#profile-section_songlist'
        }
      })
      remoteManipulations.insertItemsIntoSonglist({
        'songlistId': 'profile-section_songlist',
        'songInfo': response.userAudios.items
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoSonglist',
        'args': {
          'songlistId': 'profile-section_songlist',
          'songInfo': response.userAudios.items
        }
      })

      if (response.userAudiosCount < 21) {
        remoteManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#profile-section_load-more-songs-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      } else {
        remoteManipulations.removeAttributeFromElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeAttributeFromElem',
          'args': {
            'selector': '#profile-section_load-more-songs-btn',
            'attrName': 'hidden'
          }
        })
        profileSectionSonglist.dataset.userAudiosCount = response.userAudiosCount
        profileSectionSonglist.dataset.userAudiosLoaded = 20
      }

      // wall posts templating
      profileSectionPostslist.dataset.postsLoaded = 20
      remoteManipulations.cleanElemContent({
        'selector': '#profile-section_postslist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'cleanElemContent',
        'args': {
          'selector': '#profile-section_postslist'
        }
      })
      remoteManipulations.insertItemsIntoPostslist({
        'postslistId': 'profile-section_postslist',
        'postsInfo': response.wallPosts.items
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoPostslist',
        'args': {
          'postslistId': 'profile-section_postslist',
          'postsInfo': response.wallPosts.items
        }
      })
      if (document.getElementById('profile-section_postslist').children.length === 0) {
        remoteManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#profile-section_load-more-posts-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      } else {
        remoteManipulations.removeAttributeFromElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'removeAttributeFromElem',
          'args': {
            'selector': '#profile-section_load-more-posts-btn',
            'attrName': 'hidden'
          }
        })
      }

      remoteManipulations.setProfileSectionTitle({'title': profileName})
      server.sendRemoteManipulationsMsg({
        'func': 'setProfileSectionTitle',
        'args': {'title': profileName}
      })
      remoteManipulations.setProfileSectionCurrentUserId({'currentUserId': profileId})
      server.sendRemoteManipulationsMsg({
        'func': 'setProfileSectionCurrentUserId',
        'args': {'currentUserId': profileId}
      })
      remoteManipulations.navigateTo({'sectionId': '#profile-section'})
      server.sendRemoteManipulationsMsg({
        'func': 'navigateTo',
        'args': {'sectionId': '#profile-section'}
      })

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
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
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    vkRequest.send({
      'method': 'audio.get',
      'requestParams': {
        'owner_id': remoteManipulations.getProfileSectionCurrentUserId(),
        'offset': profileSectionSonglist.dataset.userAudiosLoaded,
        'count': 20
      }
    }).then(function (response) {
      remoteManipulations.insertItemsIntoSonglist({
        'songlistId': 'profile-section_songlist',
        'songInfo': response.items
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoSonglist',
        'args': {
          'songlistId': 'profile-section_songlist',
          'songInfo': response.items
        }
      })

      profileSectionSonglist.dataset.userAudiosLoaded = +profileSectionSonglist.dataset.userAudiosLoaded + 20

      // 6000 is vk limit
      if (!(+profileSectionSonglist.dataset.userAudiosLoaded < +profileSectionSonglist.dataset.userAudiosCount) ||
        !(+profileSectionSonglist.dataset.userAudiosLoaded < 6000)) {
        remoteManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-songs-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#profile-section_load-more-songs-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      }

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  profileSectionLoadMorePostsBtn.addEventListener('click', function () {
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    var previousPostsCount = profileSectionPostslist.children.length

    vkRequest.send({
      'method': 'wall.get',
      'requestParams': {
        'owner_id': remoteManipulations.getProfileSectionCurrentUserId(),
        'offset': +profileSectionPostslist.dataset.postsLoaded,
        'count': 20
      }
    }).then(function (response) {
      remoteManipulations.insertItemsIntoPostslist({
        'postsInfo': response.items,
        'postslistId': 'profile-section_postslist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoPostslist',
        'args': {
          'postsInfo': response.items,
          'postslistId': 'profile-section_postslist'
        }
      })

      profileSectionPostslist.dataset.postsLoaded = +profileSectionPostslist.dataset.postsLoaded + 20

      if (previousPostsCount === profileSectionPostslist.children.length) {
        remoteManipulations.addAttributeToElem({
          'selector': '#profile-section_load-more-posts-btn',
          'attrName': 'hidden',
          'attrValue': 'true'
        })
        server.sendRemoteManipulationsMsg({
          'func': 'addAttributeToElem',
          'args': {
            'selector': '#profile-section_load-more-posts-btn',
            'attrName': 'hidden',
            'attrValue': 'true'
          }
        })
      }

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  document.querySelector('#drawer-panel_header').addEventListener('click', function () {
    remoteManipulations.navigateTo({'sectionId': '#my-audios-section'})
  })

  document.querySelector('#log-out-btn').addEventListener('click', function () {
    chrome.storage.local.remove(['vkAccessToken', 'vkUserID'], function () {
      window.dispatchEvent(new window.CustomEvent('logOut'))
    })
  })

  // update broadcastingList on click on tab
  document.querySelector('#profiles-section_tabs_broadcasting-tab').addEventListener('click', function () {
    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })
    vkRequest.send({
      'method': 'audio.getBroadcastList',
      'requestParams': {
        'active': 1
      }
    }).then(function (response) {
      remoteManipulations.cleanElemContent({
        'selector': '#profiles-section_broadcasting-profiles'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'cleanElemContent',
        'args': {
          'selector': '#profiles-section_broadcasting-profiles'
        }
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

      remoteManipulations.insertItemsIntoBroadcastingProfileslist({
        'profileslistId': 'profiles-section_broadcasting-profiles',
        'profilesInfo': response
      })
      server.sendRemoteManipulationsMsg({
        'func': 'insertItemsIntoBroadcastingProfileslist',
        'args': {
          'profileslistId': 'profiles-section_broadcasting-profiles',
          'profilesInfo': response
        }
      })

      remoteManipulations.updateProfilesSectionSearch()
      server.sendRemoteManipulationsMsg({
        'func': 'updateProfilesSectionSearch'
      })

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  document.querySelector('#player-controller_add-songs-to-audios-btn').addEventListener('click', function (event) {
    if (event.currentTarget.dataset.currentSongId.indexOf(localStorageData.vkUserID) === 0) return

    remoteManipulations.showSpinner()
    server.sendRemoteManipulationsMsg({
      'func': 'showSpinner'
    })

    var songId = event.currentTarget.dataset.currentSongId

    vkRequest.send({
      'method': 'audio.add',
      'requestParams': {
        'audio_id': songId.split('_')[1],
        'owner_id': songId.split('_')[0]
      }
    }).then(function (response) {
      if (typeof response !== 'number') throw new Error('Сталася помилка')
      var newSonglistItemElem = player.currentSong.cloneNode(true)
      newSonglistItemElem.dataset.songClass = localStorageData.vkUserID + '_' + response

      remoteManipulations.prependElemWithHTML({
        'html': newSonglistItemElem.outerHTML,
        'parentElemSelector': '#my-audios-section_songlist'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'prependElemWithHTML',
        'args': {
          'html': newSonglistItemElem.outerHTML,
          'parentElemSelector': '#my-audios-section_songlist'
        }
      })

      remoteManipulations.addAttributeToElem({
        'selector': '#player-controller_add-songs-to-audios-btn',
        'attrName': 'data-current-song-id',
        'attrValue': localStorageData.vkUserID + '_' + response
      })
      server.sendRemoteManipulationsMsg({
        'func': 'addAttributeToElem',
        'args': {
          'selector': '#player-controller_add-songs-to-audios-btn',
          'attrName': 'data-current-song-id',
          'attrValue': localStorageData.vkUserID + '_' + response
        }
      })

      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('added') || 'Added'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('added') || 'Added'
        }
      })
    }).catch(function (err) {
      remoteManipulations.hideSpinner()
      server.sendRemoteManipulationsMsg({
        'func': 'hideSpinner'
      })
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
      })
      server.sendRemoteManipulationsMsg({
        'func': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
        }
      })
      console.error(err)
    })
  })

  document.querySelector('#settings-section_connection-info_address').addEventListener('click', function (e) {
    copyTextToClipboard('http://' + e.currentTarget.innerHTML)
    remoteManipulations.showToast({
      'innerText': chrome.i18n.getMessage('copiedToClipboard') || 'Copied to clipboard'
    })
  })

  function copyTextToClipboard (text) {
    var copyFrom = document.createElement('textarea')
    copyFrom.textContent = text
    document.body.appendChild(copyFrom)
    copyFrom.select()
    document.execCommand('copy')
    document.body.removeChild(copyFrom)
  }

  require('./appInit')(localStorageData.vkUserID, remoteManipulations, vkRequest)
})
