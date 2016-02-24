/* globals Mustache, profilesSectionSearch, appRouter, isServer */
;(function (namespace) {
  // templates
  var profileTemplate = document.getElementById('profileTemplate').innerHTML
  var broadcastingProfileTemplate = document.getElementById('broadcastingProfileTemplate').innerHTML
  var songlistItemTemplate = document.getElementById('songlistItemTemplate').innerHTML
  var postslistItemTemplate = document.getElementById('postslistItemTemplate').innerHTML

  // function to insert user info into drawer header
  namespace.insertUserInfoIntoDrawerHeader = function (userInfo) {
    document.getElementById('drawer-panel_header_user-name').innerHTML =
      userInfo.first_name + ' ' + userInfo.last_name
    if (isServer) {
      var xhr = new window.XMLHttpRequest()
      xhr.open('GET', userInfo.photo_50, true)
      xhr.responseType = 'blob'
      xhr.onload = function () {
        document.getElementById('drawer-panel_header_user-avatar').src =
          window.URL.createObjectURL(this.response)
      }
      xhr.send()
    } else {
      document.getElementById('drawer-panel_header_user-avatar').src = userInfo.photo_50
    }
  }

  // function to insert items into songlist
  namespace.insertItemsIntoSonglist = function (args) {
    if (!args.songInfo) return

    var songlistInnerHTML = args.songInfo.reduce(function (songlistInnerHTML, current) {
      return songlistInnerHTML + Mustache.render(songlistItemTemplate, current)
    }, '')

    if (!args.position) args.position = 'beforeend'
    var songlistToInsertInto = document.getElementById(args.songlistId)
    songlistToInsertInto.insertAdjacentHTML(args.position, songlistInnerHTML)
  }

  // function to insert items into postslist
  namespace.insertItemsIntoPostslist = function (args) {
    var parser = new window.DOMParser()

    var postslistInnerHTML = args.postsInfo.reduce(function (postslistInnerHTML, current) {
      if (!isAudioAttachedToPost(current)) return postslistInnerHTML

      var post = parser.parseFromString(Mustache.render(postslistItemTemplate, current), 'text/html')
      post.querySelector('.postlists_item_songlist').innerHTML =
        current.attachments.reduce(function (songlistInnerHTML, current) {
          if (current.type !== 'audio') return songlistInnerHTML
          else {
            return songlistInnerHTML + Mustache.render(songlistItemTemplate, current.audio)
          }
        }, '')

      return postslistInnerHTML + post.body.innerHTML
    }, '')

    if (!args.position) args.position = 'beforeend'
    document.getElementById(args.postslistId).insertAdjacentHTML(args.position, postslistInnerHTML)
  }

  function isAudioAttachedToPost (postsInfoItem) {
    var audioAttachedToPost = false
    if (!postsInfoItem.attachments) return audioAttachedToPost
    postsInfoItem.attachments.forEach(function (attachment) {
      if (attachment.type === 'audio') audioAttachedToPost = true
    })
    return audioAttachedToPost
  }

  // function to insert items into profileslist
  namespace.insertItemsIntoProfileslist = function (args) {
    var profileslistInnerHTML = args.profilesInfo.reduce(function (profileslistInnerHTML, current) {
      return profileslistInnerHTML + Mustache.render(profileTemplate, current)
    }, '')

    if (!args.position) args.position = 'beforeend'
    document.getElementById(args.profileslistId).insertAdjacentHTML(args.position, profileslistInnerHTML)
  }

  // function to insert items into broadcastingProfileslist
  namespace.insertItemsIntoBroadcastingProfileslist = function (args) {
    var broadcastingProfileslistInnerHTML = args.profilesInfo.reduce(function (broadcastingProfileslistInnerHTML, current) {
      return broadcastingProfileslistInnerHTML + Mustache.render(broadcastingProfileTemplate, current)
    }, '')

    if (!args.position) args.position = 'beforeend'
    document.getElementById(args.profileslistId).insertAdjacentHTML(args.position, broadcastingProfileslistInnerHTML)
  }

  // args {"selector"}
  namespace.removeElem = function (args) {
    var elemsToDelete = document.querySelectorAll(args.selector)
    Array.prototype.forEach.call(elemsToDelete, function (elem) {
      elem.remove()
    })
  }

  // args {"selector", "event", "flags"}
  namespace.dispatchEventOnElem = function (args) {
    var elemToDispatchEventOn = document.querySelector(args.selector)
    if (elemToDispatchEventOn) {
      elemToDispatchEventOn.dispatchEvent(new window.Event(args.event, args.flags))
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"selector", "value"}
  namespace.setElemValue = function (args) {
    var elemToSetValueTo = document.querySelector(args.selector)
    if (elemToSetValueTo) {
      elemToSetValueTo.value = args.value
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"selector", "html"}
  namespace.setElemInnerHTML = function (args) {
    var elemToSetInnerHTMLTo = document.querySelector(args.selector)
    if (elemToSetInnerHTMLTo) {
      elemToSetInnerHTMLTo.innerHTML = args.html
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"selector", "className"}
  namespace.addClassToElem = function (args) {
    var elemsToAddClassTo = document.querySelectorAll(args.selector)
    if (!elemsToAddClassTo.length) {
      throw new Error("Can't find elements by selector: " + args.selector)
    }
    Array.prototype.forEach.call(elemsToAddClassTo, function (elemToAddClassTo) {
      if (elemToAddClassTo.classList.contains(args.className)) return
      elemToAddClassTo.className += ' ' + args.className
    })
  }

  // args {"selector", "className"}
  namespace.removeClassFromElem = function (args) {
    var elemsToRemoveClassFrom = document.querySelectorAll(args.selector)
    if (!elemsToRemoveClassFrom.length) {
      throw new Error("Can't find elements by selector: " + args.selector)
    }
    Array.prototype.forEach.call(elemsToRemoveClassFrom, function (elemToRemoveClassFrom) {
      if (elemToRemoveClassFrom.classList.contains(args.className)) {
        elemToRemoveClassFrom.classList.remove(args.className)
      }
    })
  }

  // args {"selector", "attrName", "attrValue"}
  namespace.addAttributeToElem = function (args) {
    var elemToAddAttributeTo = document.querySelector(args.selector)
    if (elemToAddAttributeTo) {
      elemToAddAttributeTo.setAttribute(args.attrName, args.attrValue)
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"selector", "attrName"}
  namespace.removeAttributeFromElem = function (args) {
    var elemToRemoveAttributeFrom = document.querySelector(args.selector)
    if (elemToRemoveAttributeFrom) {
      elemToRemoveAttributeFrom.removeAttribute(args.attrName)
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"selector"}
  namespace.cleanElemContent = function (args) {
    var elemToCleanContent = document.querySelector(args.selector)
    if (elemToCleanContent) {
      elemToCleanContent.innerHTML = ''
    } else {
      throw new Error("Can't find element by selector: " + args.selector)
    }
  }

  // args {"html", "parentElemSelector"}
  namespace.prependElemWithHTML = function (args) {
    var elemToPrepend = document.querySelector(args.parentElemSelector)
    if (elemToPrepend) {
      elemToPrepend.insertAdjacentHTML('afterbegin', args.html)
    } else {
      throw new Error("Can't find element by selector: " + args.parentElemSelector)
    }
  }

  var materialSnackbar = document.querySelector('#material-snackbar')
  namespace.showToast = function (opts) {
    materialSnackbar.MaterialSnackbar.showSnackbar({
      'message': opts.innerText,
      'timeout': opts.duration
    })
  }

  var spinner = document.getElementById('spinner')
  namespace.showSpinner = function () { spinner.hidden = false }
  namespace.hideSpinner = function () { spinner.hidden = true }

  // args {"propertyName", "propertyValue"}
  namespace.setGlobalVariable = function (args) {
    window[args.propertyName] = args.propertyValue
  }

  namespace.updateProfilesSectionSearch = function () {
    profilesSectionSearch.friends.update()
    profilesSectionSearch.groups.update()
    profilesSectionSearch.broadcasting.update()
  }

  // args {"title"}
  namespace.setProfileSectionTitle = function (args) {
    if (!args.title) appRouter.navigateTo('#profiles-section')
    document.getElementById('profile-section_title').innerHTML = args.title
    document.getElementById('drawer-panel_nav_link_profile').innerHTML = args.title
  }

  namespace.getProfileSectionTitle = function () {
    return document.getElementById('profile-section_title').innerHTML
  }

  // args {"currentUserId"}
  namespace.setProfileSectionCurrentUserId = function (args) {
    document.getElementById('profiles-section').dataset.currentUserId = args.currentUserId
  }

  namespace.getProfileSectionCurrentUserId = function () {
    return document.getElementById('profiles-section').dataset.currentUserId
  }

  namespace.cleanPlayer = function () {
    this.changeSliderValue({
      'selector': '#player-controller_song-range',
      'value': 0
    })
    this.cleanElemContent({
      'selector': '#player-controller_song-info'
    })
    this.cleanElemContent({
      'selector': '#player-controller_current-time'
    })
    this.cleanElemContent({
      'selector': '#player-controller_song-duration'
    })
    this.setPlayPauseBtnIcon({
      'icon': 'play_arrow'
    })
  }

  // args {"icon"}
  namespace.setPlayPauseBtnIcon = function (args) {
    document.querySelector('#player-controller_play-pause-btn_icon').innerHTML = args.icon
  }

  // args {"sectionId"}
  namespace.navigateTo = function (args) {
    appRouter.navigateTo(args.sectionId)
  }

  // args {"selector", "value"}
  namespace.changeSliderValue = function (args) {
    var slider = document.querySelector(args.selector)
    slider.value = +args.value
  }

  // args {"rules"[Array]}
  namespace.injectStyles = function (args) {
    var style = document.createElement('style')
    style.appendChild(document.createTextNode(''))
    document.head.appendChild(style)
    args.rules.forEach(function (rule) {
      style.sheet.insertRule(rule, 0)
    })
  }
}(this.domManipulations = this.domManipulations || {}))
