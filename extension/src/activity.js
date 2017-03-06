(function() {
  'use strict';

  var sendMessage = function() {
    chrome.runtime.sendMessage({activity: true});
  }

  document.addEventListener('mousemove', sendMessage, false);
  document.addEventListener('mousedown', sendMessage, false);
  document.addEventListener('keypress', sendMessage, false);
  document.addEventListener('scroll', sendMessage, false);
  document.addEventListener('wheel', sendMessage, false);
  document.addEventListener('touchmove', sendMessage, false);
  document.addEventListener('pointermove', sendMessage, false);
})();
