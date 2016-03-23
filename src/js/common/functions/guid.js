module.exports = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    /** @type {number} */ var r = Math.random() * 16 | 0
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16) // eslint-disable-line
  })
}
