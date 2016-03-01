/* globals domManipulations, componentHandler, vkUserID, Jets */
var isServer = false
;(function () {
  var localization = {}
  var localizationRequest = new window.XMLHttpRequest()
  localizationRequest.open('GET', 'localization', true)
  localizationRequest.send()
  localizationRequest.onload = function () {
    localization = JSON.parse(localizationRequest.responseText)
    var objects = document.getElementsByTagName('*')
    Array.prototype.forEach.call(objects, function (object) {
      if (object.dataset && object.dataset.i18nContent) {
        object.innerHTML = localization[object.dataset.i18nContent].message || object.innerHTML
      }
    })
  }

  var socket = new window.WebSocket(window.location.origin.replace(/^(https|http)/, 'ws'))

  socket.addEventListener('message', function handleSocketsMessage (e) {
    if (e.data.indexOf('domManipulations?') === 0) {
      var requestParams = requestParamToObj(e.data)
      if (requestParams.args && requestParams.args !== 'undefined' && requestParams.args !== 'null') {
        requestParams.args = JSON.parse(requestParams.args)
      }
      domManipulations[requestParams.function](requestParams.args)
    }
  })

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

  function sendDomManipulationsMessage (options) {
    options.socket.send('domManipulations' + objToRequestParam({
      'function': options.function,
      'args': JSON.stringify(options.args)
    }))
  }

  var searchSectionLoadMoreBtn = document.getElementById('search-section_load-more-songs-btn')
  searchSectionLoadMoreBtn.addEventListener('click', function () {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#search-section_load-more-songs-btn',
        'event': 'click'
      }
    })
  })

  var seacrhSectionSearchInput = document.getElementById('search-section_search-input')
  seacrhSectionSearchInput.addEventListener('change', function (e) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'setElemValue',
      'args': {
        'selector': '#search-section_search-input',
        'value': e.currentTarget.value
      }
    })
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#search-section_search-input',
        'event': 'change'
      }
    })
  })

  var myAudiosSectionLoadMoreBtn = document.getElementById('my-audios-section_load-more-songs-btn')
  myAudiosSectionLoadMoreBtn.addEventListener('click', function () {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#my-audios-section_load-more-songs-btn',
        'event': 'click'
      }
    })
  })

  function guid () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      /** @type {number} */ var r = Math.random() * 16 | 0
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
    })
  }

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
    } else {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'dispatchEventOnElem',
        'args': {
          'selector': 'div[data-song-class="' + event.currentTarget.dataset.songClass + '"]',
          'event': 'click',
          'flags': {bubbles: true}
        }
      })
    }
  }

  document.body.arrive('.songlist_item', function () {
    this.addEventListener('click', handleClickOnSonglist)
  })

  document.body.arrive('.broadcasting-profiles_item', function () {
    this.addEventListener('click', function () {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'dispatchEventOnElem',
        'args': {
          'selector': '.broadcasting-profiles_item[data-profile-id="' + this.dataset.profileId + '"] .songlist_item',
          'event': 'click'
        }
      })
    })
  })

  function openContextMenuOnSonglistItem (menuBtn, event) {
    hideContextMenu()
    event.stopPropagation()

    var songlistItemElem = menuBtn.parentNode
    var contextMenuContent = ''
    // check if song is in user's audios and add appropriate message
    if (songlistItemElem.dataset.songClass.indexOf(vkUserID) === 0) {
      contextMenuContent += '<li class="mdl-menu__item remove-from-audios">' +
      (localization.deleteSong.message || 'Видалити з моїх аудіозаписів') + '</li>'
    } else {
      contextMenuContent += '<li class="mdl-menu__item add-to-audios">' +
      (localization.addSong.message || 'Додати до моїх аудіозаписів') + '</li>'
    }
    contextMenuContent += '<li class="mdl-menu__item download">' +
      (localization.download.message || 'Скачати') + '</li>'

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
        socket.send('sendRequestAndRemoveAudio' + objToRequestParam({
          'args': JSON.stringify({
            'songlistItemSelector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'})
        }))
      })
    } else if (menuContainer.querySelector('.mdl-menu__item.add-to-audios')) {
      menuContainer.querySelector('.mdl-menu__item.add-to-audios').addEventListener('click', function () {
        socket.send('sendRequestAndAddAudio' + objToRequestParam({
          'args': JSON.stringify({
            'songlistItemSelector': 'div[data-song-class="' + songlistItemElem.dataset.songClass + '"]'})
        }))
      })
    }
    menuContainer.querySelector('.mdl-menu__item.download').addEventListener('click', function () {
      socket.send('downloadAudio' + objToRequestParam({
        'args': JSON.stringify({
          'audioUrl': songlistItemElem.dataset.songUrl,
          'songTitle': songlistItemElem.dataset.songTitle
        })
      }))
    })
  }

  function hideContextMenu () {
    var contextMenu = document.querySelector('.mdl-menu__container')
    if (contextMenu !== null) contextMenu.remove()
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

  /**
   * Handling clicks on profiles-friends and profiles-groups
   */
  function handleClickOnProfileslistItem (profileslistItem) {
    var profileId = profileslistItem.dataset.profileId
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': 'div[data-profile-id="' + profileId + '"]',
        'event': 'click',
        'flags': {bubbles: true}
      }
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
  var profileSectionLoadMoreSongsBtn = document.getElementById('profile-section_load-more-songs-btn')
  var profileSectionLoadMorePostsBtn = document.getElementById('profile-section_load-more-posts-btn')

  profileSectionLoadMoreSongsBtn.addEventListener('click', function () {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#profile-section_load-more-songs-btn',
        'event': 'click'
      }
    })
  })

  profileSectionLoadMorePostsBtn.addEventListener('click', function () {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#profile-section_load-more-posts-btn',
        'event': 'click'
      }
    })
  })

  /**
   * Player controller logic.
   */
  document.querySelector('#player-controller_song-range').addEventListener('input', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'changeSliderValue',
      'args': {
        'selector': '#player-controller_song-range',
        'value': event.target.value
      }
    })
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_song-range',
        'event': 'input'
      }
    })
  })

  document.querySelector('#player-controller_volume-range').addEventListener('input', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'changeSliderValue',
      'args': {
        'selector': '#player-controller_volume-range',
        'value': event.target.value
      }
    })
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_volume-range',
        'event': 'input'
      }
    })
  })
  document.querySelector('#player-controller_loop-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_loop-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#player-controller_shuffle-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_shuffle-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#player-controller_broadcast-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_broadcast-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#player-controller_skip-previous-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_skip-previous-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#player-controller_skip-next-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_skip-next-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#player-controller_play-pause-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_play-pause-btn',
        'event': 'click'
      }
    })
  })
  document.querySelector('#drawer-panel_header').addEventListener('click', function () {
    domManipulations.navigateTo({'sectionId': '#my-audios-section'})
  })

  document.querySelector('#profiles-section_tabs_broadcasting-tab').addEventListener('click', function () {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#profiles-section_tabs_broadcasting-tab',
        'event': 'click'
      }
    })
  })

  document.querySelector('#player-controller_add-songs-to-audios-btn').addEventListener('click', function (event) {
    sendDomManipulationsMessage({
      'socket': socket,
      'function': 'dispatchEventOnElem',
      'args': {
        'selector': '#player-controller_add-songs-to-audios-btn',
        'event': 'click'
      }
    })
  })

  // fix for ios Safari (can't close context menu when clicking on header)
  Array.prototype.forEach.call(document.querySelectorAll('.section_header'), function (sectionHeader) {
    sectionHeader.addEventListener('click', function () {
      document.body.dispatchEvent(new window.Event('click'))
    })
  })

  if (/iPad|iPhone|iPod/.test(navigator.platform)) {
    Array.prototype.forEach.call(document.querySelectorAll('.mdl-textfield--expandable'), function (textField) {
      textField.addEventListener('click', function () {
        this.classList.add('is-focused')
      })
    })
  }
}())
