module.exports = function (user_id, access_token, v) {
  var vkRequest = {}

  var BASE_URL = 'https://api.vk.com/method/'

  function objectToRequestParam (obj) {
    return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
  }

  var config = {}
  config.user_id = user_id
  config.access_token = access_token
  config.v = v

  vkRequest.send = function (requestOptions) {
    return new Promise(function (resolve, reject) {
      if (!requestOptions.requestParams) requestOptions.requestParams = {}
      requestOptions.requestParams.v = config.v
      requestOptions.requestParams.access_token = config.access_token
      requestOptions.requestParams.user_id = config.user_id
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

  return vkRequest
}
