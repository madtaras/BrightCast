module.exports = function (value, valueOnFailure) {
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
