;(function () {
  var playPauseBtn = document.querySelector('#player-controller_play-pause-btn')
  var skipPrevBtn = document.querySelector('#player-controller_skip-previous-btn')
  var skipNextBtn = document.querySelector('#player-controller_skip-next-btn')
  var volumeRange = document.querySelector('#player-controller_volume-range')

  document.addEventListener('keydown', function (e) {
    if (!e.ctrlKey && !e.metaKey) return

    if (e.keyCode === 32) {
      // space
      playPauseBtn.dispatchEvent(new window.Event('click'))
    } else if (e.keyCode === 37) {
      // arrow left
      skipPrevBtn.dispatchEvent(new window.Event('click'))
    } else if (e.keyCode === 39) {
      // arrow right
      skipNextBtn.dispatchEvent(new window.Event('click'))
    } else if (e.keyCode === 38) {
      // arrow up
      if (volumeRange.value < 100) volumeRange.value = +volumeRange.value + 5
      volumeRange.dispatchEvent(new window.Event('input'))
    } else if (e.keyCode === 40) {
      // arrow down
      if (volumeRange.value > 0) volumeRange.value = +volumeRange.value - 5
      volumeRange.dispatchEvent(new window.Event('input'))
    }
  })
})()
