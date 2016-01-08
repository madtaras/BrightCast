;(function (namespace) {
  var BASE_URL = 'https://api.vk.com/method/'

  function objectToRequestParam (obj) {
    return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
  }

  namespace.send = function (requestOptions) {
    return new Promise(function (resolve, reject) {
      requestOptions.requestParams.v = '5.40'
      var requestUrl = BASE_URL + requestOptions.method + objectToRequestParam(requestOptions.requestParams)

      window.fetch(requestUrl).then(function (response) {
        return response.json()
      }).then(function (parsedResponse) {
        if (parsedResponse.response) resolve(parsedResponse.response)
        else reject(parsedResponse.error)
      }).catch(function (err) {
        reject(err)
      })
    })
  }
})(this.vkRequest = this.vkRequest || {})

/* usage
vkRequest.send({
    'method': 'execute.getDataForAppInit',
    'requestParams': {
        'access_token': vkAccessToken,
        'user_id': vkUserID
    }).then(function (response) { console.log(response) })
*/
