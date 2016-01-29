/* globals chrome, vkRequest, vkAccessToken, vkUserID, domManipulations, sendDomManipulationsMessage,
connectedSockets */
chrome.storage.local.get(['vkAccessToken', 'vkUserID'], function (userAuthData) {
  window.vkAccessToken = userAuthData.vkAccessToken
  window.vkUserID = userAuthData.vkUserID

  var MY_AUDIOS_TO_LOAD = 120

  domManipulations.showSpinner()
  vkRequest.send({
    'method': 'execute.getDataForAppInit',
    'requestParams': {
      'access_token': vkAccessToken,
      'user_id': vkUserID,
      'my_audios_to_load': MY_AUDIOS_TO_LOAD
    }
  }).then(function (response) {
    domManipulations.insertUserInfoIntoDrawerHeader(response.userInfo)
    domManipulations.insertItemsIntoSonglist({
      'songlistId': 'my-audios-section_songlist',
      'songInfo': response.userAudios.items
    })
    document.body.classList.add('user-audios-loaded')
    var myAudiosSectionLoadMoreBtn = document.getElementById('my-audios-section_load-more-songs-btn')
    var myAudioSectionSonglist = document.getElementById('my-audios-section_songlist')

    // hide load-more-songs-btn if there aren't anymore audios to load
    if (+response.userAudiosCount < (MY_AUDIOS_TO_LOAD + 1)) {
      domManipulations.addAttributeToElem({
        'selector': '#my-audios-section_load-more-songs-btn',
        'attrName': 'hidden',
        'attrValue': 'true'
      })
    } else {
      myAudioSectionSonglist.dataset.userAudiosCount = response.userAudiosCount
      myAudioSectionSonglist.dataset.userAudiosLoaded = MY_AUDIOS_TO_LOAD
      myAudiosSectionLoadMoreBtn.addEventListener('click', function () {
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
            'count': 20,
            'offset': myAudioSectionSonglist.dataset.userAudiosLoaded
          }
        }).then(function (audioData) {
          domManipulations.insertItemsIntoSonglist({
            'songlistId': 'my-audios-section_songlist',
            'songInfo': audioData.items
          })
          connectedSockets.forEach(function (socket) {
            sendDomManipulationsMessage({
              'socket': socket,
              'function': 'insertItemsIntoSonglist',
              'args': {
                'songlistId': 'my-audios-section_songlist',
                'songInfo': audioData.items
              }
            })
          })

          myAudioSectionSonglist.dataset.userAudiosLoaded = +myAudioSectionSonglist.dataset.userAudiosLoaded + 20

          // 6000 is vk limit
          if (!(myAudioSectionSonglist.children.length < +myAudioSectionSonglist.dataset.userAudiosCount) ||
            !(myAudioSectionSonglist.children.length < 6000)) {
            domManipulations.addAttributeToElem({
              'selector': '#my-audios-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            })
            connectedSockets.forEach(function (socket) {
              sendDomManipulationsMessage({
                'socket': socket,
                'function': 'addAttributeToElem',
                'args': {
                  'selector': '#my-audios-section_load-more-songs-btn',
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
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Сталася помилка'
          })
          connectedSockets.forEach(function (socket) {
            sendDomManipulationsMessage({
              'socket': socket,
              'function': 'showToast',
              'args': {
                'innerText': chrome.i18n.getMessage('errorOccurred') || 'Сталася помилка'
              }
            })
          })
          console.error(err)
        })
      })
    }

    response.friendsWithOpenedAudios.forEach(function (currentValue, index, array) {
      array[index].profileId = array[index].id
      array[index].profileType = 'person'
      array[index].profileTitle = array[index].first_name + ' ' + array[index].last_name
    })
    domManipulations.insertItemsIntoProfileslist({
      'profileslistId': 'profiles-section_friends-profiles',
      'profilesInfo': response.friendsWithOpenedAudios
    })

    response.userGroups.items.forEach(function (currentValue, index, array) {
      array[index].profileId = '-' + array[index].id
      array[index].profileType = 'group'
      array[index].profileTitle = array[index].name
    })
    domManipulations.insertItemsIntoProfileslist({
      'profileslistId': 'profiles-section_groups-profiles',
      'profilesInfo': response.userGroups.items
    })

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
    if (response.broadcastingFriends) {
      domManipulations.insertItemsIntoBroadcastingProfileslist({
        'profileslistId': 'profiles-section_broadcasting-profiles',
        'profilesInfo': response.broadcastingFriends
      })
    }
    domManipulations.updateProfilesSectionSearch()

    domManipulations.injectStyles({
      'rules': [
        '.player-controller_add-songs-to-audios-btn[data-current-song-id^="' + vkUserID + '"] {' +
          'pointer-events: none;' +
          'display: none;' +
        '}'
      ]
    })

    domManipulations.hideSpinner()
  }).catch(function (err) {
    domManipulations.hideSpinner()
    domManipulations.showToast({
      'innerText': chrome.i18n.getMessage('errorOccurred') || 'Сталася помилка'
    })
    connectedSockets.forEach(function (socket) {
      sendDomManipulationsMessage({
        'socket': socket,
        'function': 'showToast',
        'args': {
          'innerText': chrome.i18n.getMessage('errorOccurred') || 'Сталася помилка'
        }
      })
    })
    console.error(err)
  })
})
