(function() {
  'use strict';

  const TIMEOUT=5000;
  var timer = null;

  function startTimer() {
    timer = window.setTimeout(function() {
      chrome.runtime.sendMessage({activity: false});
    }, TIMEOUT);
  }
  function resetTimer() {
    window.clearTimeout(timer);
    chrome.runtime.sendMessage({activity: true});
    startTimer();
  }
  function setupTimer() {
      document.addEventListener('mousemove', resetTimer, false);
      document.addEventListener('mousedown', resetTimer, false);
      document.addEventListener('keypress', resetTimer, false);
      document.addEventListener('scroll', resetTimer, false);
      document.addEventListener('wheel', resetTimer, false);
      document.addEventListener('touchmove', resetTimer, false);
      document.addEventListener('pointermove', resetTimer, false);
  }

  setupTimer();
  startTimer();
})();
