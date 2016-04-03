# vkRequest docs

```javascript
vkRequest.send(options).then(onFulfilled, onRejected)
```

**vkRequest.send options:**

* options.method {String} - method of VK API (https://vk.com/dev/methods)
* requestParams {Object} - object with params for VK API method

**You don't need to set access token and API version in each request**

### Example

`https://api.vk.com/method/audio.search?q=Muse&auto_complete=1&sort=2&search_own=0&count=20`

```javascript
vkRequest.send({
  'method': 'audio.search',
  'requestParams': {
    'q': 'Muse',
    'auto_complete': 1,
    'sort': 2,
    'search_own': 0,
    'count': 20
  }
}).then(function (searchData) {
  // handling response
}, function (err) {
  // handling error
})
```
