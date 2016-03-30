/* globals chrome */
module.exports = function (user_id, remoteManipulations, vkRequest) {
  // set value of volume-range
  chrome.storage.local.get(['volumeRangeValue'], function (data) {
    if (data.volumeRangeValue !== null && data.volumeRangeValue !== undefined) {
      document.querySelector('#player-controller_volume-range').value = +data.volumeRangeValue
    }
  })

  if (!navigator.onLine) {
    setTimeout(function () {
      remoteManipulations.showToast({
        'innerText': chrome.i18n.getMessage('connectToTheInternetAndRestartApp') || 'Connect to the internet and restart the app',
        'duration': 9999999
      })
    }, 700)
    throw new Error('No internet connection')
  }

  // stats
  vkRequest.send({'method': 'stats.trackVisitor'})

  var MY_AUDIOS_TO_LOAD = 120

  remoteManipulations.showSpinner()
  vkRequest.send({
    'method': 'execute.getDataForAppInit',
    'requestParams': {
      'my_audios_to_load': MY_AUDIOS_TO_LOAD
    }
  }).then(function (response) {
    remoteManipulations.insertUserInfoIntoDrawerHeader(response.userInfo)
    remoteManipulations.insertItemsIntoSonglist({
      'songlistId': 'my-audios-section_songlist',
      'songInfo': response.userAudios.items
    })
    document.body.classList.add('user-audios-loaded')
    var myAudiosSectionLoadMoreBtn = document.getElementById('my-audios-section_load-more-songs-btn')
    var myAudioSectionSonglist = document.getElementById('my-audios-section_songlist')

    // hide load-more-songs-btn if there aren't anymore audios to load
    if (+response.userAudiosCount < (MY_AUDIOS_TO_LOAD + 1)) {
      remoteManipulations.addAttributeToElem({
        'selector': '#my-audios-section_load-more-songs-btn',
        'attrName': 'hidden',
        'attrValue': 'true'
      })
    } else {
      myAudioSectionSonglist.dataset.userAudiosCount = response.userAudiosCount
      myAudioSectionSonglist.dataset.userAudiosLoaded = MY_AUDIOS_TO_LOAD
      myAudiosSectionLoadMoreBtn.addEventListener('click', function () {
        remoteManipulations.showSpinner()
        vkRequest.send({
          'method': 'audio.get',
          'requestParams': {
            'count': 20,
            'offset': myAudioSectionSonglist.dataset.userAudiosLoaded
          }
        }).then(function (audioData) {
          remoteManipulations.insertItemsIntoSonglist({
            'songlistId': 'my-audios-section_songlist',
            'songInfo': audioData.items
          })

          myAudioSectionSonglist.dataset.userAudiosLoaded = +myAudioSectionSonglist.dataset.userAudiosLoaded + 20

          // 6000 is vk limit
          if (!(myAudioSectionSonglist.children.length < +myAudioSectionSonglist.dataset.userAudiosCount) ||
            !(myAudioSectionSonglist.children.length < 6000)) {
            remoteManipulations.addAttributeToElem({
              'selector': '#my-audios-section_load-more-songs-btn',
              'attrName': 'hidden',
              'attrValue': 'true'
            })
          }

          remoteManipulations.hideSpinner()
        }).catch(function (err) {
          remoteManipulations.hideSpinner()
          remoteManipulations.showToast({
            'innerText': chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
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
    remoteManipulations.insertItemsIntoProfileslist({
      'profileslistId': 'profiles-section_friends-profiles',
      'profilesInfo': response.friendsWithOpenedAudios
    })

    response.userGroups.items.forEach(function (currentValue, index, array) {
      array[index].profileId = '-' + array[index].id
      array[index].profileType = 'group'
      array[index].profileTitle = array[index].name
    })
    remoteManipulations.insertItemsIntoProfileslist({
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
      remoteManipulations.insertItemsIntoBroadcastingProfileslist({
        'profileslistId': 'profiles-section_broadcasting-profiles',
        'profilesInfo': response.broadcastingFriends
      })
    }
    remoteManipulations.updateProfilesSectionSearch()

    remoteManipulations.injectStyles({
      'rules': [
        '.player-controller_add-songs-to-audios-btn[data-current-song-id^="' + user_id + '"] {' +
          'pointer-events: none;' +
          'display: none;' +
        '}'
      ]
    })

    remoteManipulations.hideSpinner()

    document.querySelector('#drawer-panel').style.display = 'flex'
    document.querySelector('#content').style.display = 'block'
    document.querySelector('.appLoading').classList.add('moveOut')
  }).catch(function (err) {
    remoteManipulations.hideSpinner()

    document.querySelector('#drawer-panel').style.display = 'flex'
    document.querySelector('#content').style.display = 'block'
    document.querySelector('.appLoading').classList.add('moveOut')
    var errMsg
    if (+err.error_code === 5) {
      errMsg = chrome.i18n.getMessage('userAuthorizationFailed') || 'Error occurred :( Please sign out and sign in again.'
    } else {
      errMsg = chrome.i18n.getMessage('errorOccurred') || 'Error occurred'
    }
    remoteManipulations.showToast({
      'innerText': errMsg,
      'duration': 9999999
    })
    console.error(err)
  })
}
