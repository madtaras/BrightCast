var Slideout = require('./slideout.min.js')
var routes = {}

var currentSection = document.getElementById('my-audios-section')
var currentDrawerPanelNavLink = document.querySelector('.drawer-panel_nav_link[data-open="#my-audios-section"]')
var drawerPanel = document.getElementById('drawer-panel')

routes.navigateTo = function (sectionId) {
  currentSection.classList.remove('current')
  currentDrawerPanelNavLink.classList.remove('current')

  if (document.documentElement.clientWidth <= 1024) {
    slideout.close()
  }

  currentSection = document.querySelector(sectionId)
  currentDrawerPanelNavLink = document.querySelector('.drawer-panel_nav_link[data-open="' + sectionId + '"]')

  currentSection.classList.add('current')
  currentDrawerPanelNavLink.classList.add('current')

  if (drawerPanel.classList.contains('is-visible')) {
    drawerPanel.classList.remove('is-visible')
  }
}

Array.prototype.forEach.call(document.querySelectorAll('.drawer-panel_nav_link'), function (drawerPanelNavLink) {
  drawerPanelNavLink.addEventListener('click', function (event) {
    routes.navigateTo(event.target.dataset.open)
  })
})

var slideout = new Slideout({
  'panel': document.getElementById('content'),
  'menu': document.getElementById('drawer-panel'),
  'padding': 240
})

if (document.documentElement.clientWidth > 1024) {
  setTimeout(function () {
    slideout.open()
    // check if code is executed on BrightCast desktop
  }, (window.chrome && window.chrome.socket) ? 200 : 0)
}

window.addEventListener('resize', function () {
  if (document.documentElement.clientWidth > 1024) {
    slideout.open()
  }
})

window.addEventListener('resize', function () {
  if (document.documentElement.clientWidth <= 1024) {
    slideout.close()
  }
})

Array.prototype.forEach.call(document.querySelectorAll('.section_header_drawer-toggle-btn'), function (button) {
  button.addEventListener('click', function () {
    slideout.toggle()
  })
})

module.exports = routes
