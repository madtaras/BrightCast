module.exports = function (totalSeconds, divider) {
  if (!divider) divider = ':'

  var hours = Math.floor(totalSeconds / 3600)
  var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60)
  var seconds = totalSeconds - (hours * 3600) - (minutes * 60)

  // round seconds
  seconds = Math.floor(seconds)

  var result = ''

  if (hours) {
    hours < 10 ? result += '0' + hours : result += hours
    result += divider
  }

  (hours && (minutes < 10)) ? result += '0' + minutes : result += minutes
  result += divider

  result += seconds < 10 ? '0' + seconds : seconds

  return result
}
