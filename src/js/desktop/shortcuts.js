var playPauseBtn = document.querySelector('#player-controller_play-pause-btn')
var skipPrevBtn = document.querySelector('#player-controller_skip-previous-btn')
var skipNextBtn = document.querySelector('#player-controller_skip-next-btn')
var volumeRange = document.querySelector('#player-controller_volume-range')

var searcSection = document.querySelector('#search-section')
var searchSection_searchInput = document.querySelector('#search-section_search-input')

var profilesSection = document.querySelector('#profiles-section')
var profilesSection_searchInput = document.querySelector('#profiles-section_search-input')

var remember_volumeRange

chrome.commands.onCommand.addListener(function(command) {

  if (command === 'play-pause') {
      // Play/Pause
      playPauseBtn.dispatchEvent(new window.Event('click'))
  } else if (command === 'skip-prev') {
      // Skip prev
      skipPrevBtn.dispatchEvent(new window.Event('click'))
  } else if (command === 'skip-nex') {
      // Skip nex
      skipNextBtn.dispatchEvent(new window.Event('click'))
  } else if (command === 'mute') {
      // Mute

      remember_volumeRange = volumeRange.value

      if (volumeRange.value != 0 ) {
        remember_volumeRange = volumeRange.value
        volumeRange.value = 0
        volumeRange.dispatchEvent(new window.Event('input'))
      } else {
        volumeRange.value = remember_volumeRange
        volumeRange.dispatchEvent(new window.Event('input'))
      }
  }

});

document.addEventListener('keydown', function(e) {
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
    } else if (e.keyCode === 70) {
        // key f
        if (searcSection.classList.contains('current')) {
            if (searchSection_searchInput == document.activeElement) {
                searchSection_searchInput.blur()
            } else {
                searchSection_searchInput.focus()
            }
        } else if (profilesSection.classList.contains('current')) {
            if (profilesSection_searchInput == document.activeElement) {
                profilesSection_searchInput.blur()
            } else {
                profilesSection_searchInput.focus()
            }
        }
    }
})
