/* globals chrome */
;(function () {
  require('../common/material.js')
  require('./desktopLocalization.js')

  var materialSnackbar = document.querySelector('#material-snackbar')
  var vkAuthWindow = document.getElementById('auth-page_vk-auth-window')
  var signInBtn = document.getElementById('auth-page_sign-in-btn')
  var authUrl = 'https://oauth.vk.com/authorize?client_id=5142990&' +
    'redirect_uri=https://oauth.vk.com/blank.html&' +
    'display=page&scope=audio,friends,groups,status,offline&' +
    'response_type=token&v=5.40&revoke=1'
  var userAuthData = {}

  // allow users to open links from webview (it is blocked by default)
  vkAuthWindow.addEventListener('newwindow', function (e) {
    e.preventDefault()
    window.open(e.targetUrl, '_blank')
  })

  signInBtn.addEventListener('click', function () {
    vkAuthWindow.src = authUrl
    vkAuthWindow.classList.add('active')

    vkAuthWindow.addEventListener('loadredirect', function vkAuthWindowUpdateListener (e) {
      if (e.newUrl.indexOf('oauth.vk.com/blank.html') > -1) {
        vkAuthWindow.removeEventListener('loadredirect', vkAuthWindowUpdateListener)

        userAuthData.vkAccessToken = getUrlParameterValue(e.newUrl, 'access_token')
        userAuthData.vkUserID = getUrlParameterValue(e.newUrl, 'user_id')

        if (userAuthData.vkAccessToken && userAuthData.vkUserID) {
          chrome.storage.local.set(userAuthData, function () {
            window.dispatchEvent(new window.CustomEvent('successfulAuth'))
          })
        } else {
          vkAuthWindow.classList.remove('active')
          vkAuthWindow.src = ''
          materialSnackbar.MaterialSnackbar.showSnackbar({
            'message': chrome.i18n.getMessage('smthWentWrongTryAgain') || 'Something went wrong. Please, try again.'
          })
        }
      }
    })
  })

  function getUrlParameterValue (url, parameterName) {
    var urlParameters = url.substr(url.indexOf('#') + 1)
    var parameterValue = ''
    var index
    var temp

    urlParameters = urlParameters.split('&')

    for (index = 0; index < urlParameters.length; index += 1) {
      temp = urlParameters[index].split('=')

      if (temp[0] === parameterName) {
        return temp[1]
      }
    }

    return parameterValue
  }
})()
