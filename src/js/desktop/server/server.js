/* globals chrome */
var http = require('./http.js')
var qr = require('./qr.js')

var server = new http.Server()
var wsServer = new http.WebSocketServer(server)

function chooseFreePortAndListen (port) {
  chrome.socket.connect(socketPortTesterId, 'localhost', port, function (result) {
    if (result === 0) {
      chrome.socket.disconnect(socketPortTesterId)
      chooseFreePortAndListen(port + 1)
    } else {
      chrome.socket.destroy(socketPortTesterId)
      server.listen(port)
      chrome.system.network.getNetworkInterfaces(function (networkInterfaces) {
        networkInterfaces.forEach(function (networkInterface) {
          if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(networkInterface.address)) {
            var address = networkInterface.address + ':' + port
            document.getElementById('settings-section_connection-info_address').innerText = address
            qr.canvas({
              'canvas': document.getElementById('settings-section-qr-code'),
              'value': 'http://' + address
            })
            if (navigator.platform.indexOf('Win') > -1) {
              document.querySelector('.settings-section_for-windows-only-msg').hidden = false
            }
            document.querySelector('#settings-section_connection-info').classList.add('is-upgraded')
          }
        })
      })
    }
  })
}

var socketPortTesterId
var basePort = 52121

chrome.socket.create('tcp', null, function (createInfo) {
  socketPortTesterId = createInfo.socketId
  chooseFreePortAndListen(basePort)
})

server.addEventListener('request', function (req) {
  var url = req.headers.url
  if (url === '/') {
    url = '/public/mobileApp.html'
  } else if (url === '/localization') {
    var currentLocale = chrome.i18n.getUILanguage()
    if (currentLocale.indexOf('uk') > -1) {
      url = '/public/_locales/uk/messages.json'
    } else if (currentLocale.indexOf('ru') > -1) {
      url = '/public/_locales/ru/messages.json'
    } else {
      url = '/public/_locales/en/messages.json'
    }
  } else {
    url = '/public' + url
  }
  req.serveUrl(url)
  return true
})

var connectedSockets = []
exports.onSocketConnection = null

exports.objToRequestParam = function (obj) {
  return '?' + Object.keys(obj).reduce(function (a, k) { a.push(k + '=' + encodeURIComponent(obj[k])); return a }, []).join('&')
}
exports.requestParamToObj = function (query) {
  query = query.substring(query.indexOf('?') + 1).split('&')
  var params = {}
  var pair
  var d = decodeURIComponent
  for (var i = query.length - 1; i >= 0; i--) {
    pair = query[i].split('=')
    params[d(pair[0])] = d(pair[1])
  }
  return params
}

wsServer.addEventListener('request', function (req) {
  var socket = req.accept()
  connectedSockets.push(socket)

  if (exports.onSocketConnection) exports.onSocketConnection(socket)
  socket.addEventListener('close', function () {
    for (var i = 0; i < connectedSockets.length; i++) {
      if (connectedSockets[i] === socket) {
        connectedSockets.splice(i, 1)
        break
      }
    }
  })
  return true
})

exports.sendRemoteManipulationsMsg = function (options) {
  connectedSockets.forEach(function (socket) {
    socket.send('remoteManipulations' + exports.objToRequestParam({
      'func': options.func,
      'args': JSON.stringify(options.args)
    }))
  })
}
