function parseBoolean (value, valueOnFailure) {
  switch (value) {
    case true:
    case 'true':
    case 1:
    case '1':
    case 'on':
    case 'yes':
      value = true
      break
    case false:
    case 'false':
    case 0:
    case '0':
    case 'off':
    case 'no':
      value = false
      break
    default:
      if (valueOnFailure !== undefined) {
        value = valueOnFailure
      } else {
        value = null
      }
      break
  }
  return value
}

function guid () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    /** @type {number} */ var r = Math.random() * 16 | 0
    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function getRandomIntFromTo (min, max) {
  var rand = min - 0.5 + Math.random() * (max - min + 1)
  rand = Math.round(rand)
  return rand
}

function secondsTohhmmss (totalSeconds, divider) {
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
