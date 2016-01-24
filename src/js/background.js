/* globals chrome */

chrome.app.runtime.onLaunched.addListener(function () {
  chrome.storage.local.get(['vkAccessToken', 'vkUserID'], function (userAuthData) {
    if (userAuthData.vkAccessToken && userAuthData.vkUserID) {
      openMainPage()
    } else {
      openSignInPage()
    }
  })

  function objectToRequestParam (obj) {
    return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
  }

  function openMainPage () {
    chrome.app.window.create('desktopApp.html', {
      'id': 'main-page',
      'state': 'maximized',
      'frame': {
        'color': '#000'
      },
      'innerBounds': {
        'minWidth': 360,
        'minHeight': 540
      }
    }, function () {
      var mainPage = chrome.app.window.get('main-page')
      mainPage.contentWindow.addEventListener('logOut', function () {
        mainPage.close()
      })
      mainPage.onClosed.addListener(function () {
        chrome.storage.local.get(['vkAccessToken', 'vkUserID'], function (userAuthData) {
          var requestOptions = {
            'access_token': userAuthData.vkAccessToken,
            'user_id': userAuthData.vkUserID,
            'audio': ''
          }
          window.fetch('https://api.vk.com/method/audio.setBroadcast' + objectToRequestParam(requestOptions))
        })
      })
    })
  }

  function openSignInPage () {
    chrome.app.window.create('desktopSignIn.html', {
      'id': 'sign-in-page',
      'state': 'maximized',
      'frame': {
        'color': '#000'
      },
      'innerBounds': {
        'minWidth': 360,
        'minHeight': 540
      }
    }, function () {
      var signInPage = chrome.app.window.get('sign-in-page')
      signInPage.contentWindow.addEventListener('successfulAuth', function () {
        signInPage.close()
        openMainPage()
      })
    })
  }
})
