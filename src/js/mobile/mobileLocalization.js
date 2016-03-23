var localization = {}

var localizationRequest = new window.XMLHttpRequest()
localizationRequest.open('GET', 'localization', true)
localizationRequest.send()
localizationRequest.onload = function () {
  localization.msgs = JSON.parse(localizationRequest.responseText)
  var objects = document.getElementsByTagName('*')
  Array.prototype.forEach.call(objects, function (object) {
    if (object.dataset && object.dataset.i18nContent) {
      object.innerHTML = localization.msgs[object.dataset.i18nContent].message || object.innerHTML
    }
  })
}

module.exports = localization
