/* globals chrome */
var elements = document.getElementsByTagName('*')
Array.prototype.forEach.call(elements, function (element) {
  if (element.dataset && element.dataset.i18nContent) {
    element.innerHTML = chrome.i18n.getMessage(element.dataset.i18nContent) || element.innerHTML
  }
})
