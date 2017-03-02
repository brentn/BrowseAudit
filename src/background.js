(function(window) {
  'use strict';

  const TIMEOUT=5000;
  const APPID='BrowseAudit';
  var userInteraction = true;
  var monitors = [];

  var refreshMonitor = function(monitor) {
    if (userInteraction) {
      monitor.timer ++;
      console.debug("Timing:", monitor.url, monitor.timer);
    } else {
      console.debug("Paused:", monitor.url);
    }
    if (monitor.isActive) {
      window.setTimeout(refreshMonitor, TIMEOUT, monitor);
    } else {
      removeMonitor(monitor);
    }
  }

  var setupMonitor = function(url) {
    var monitor = null;
    monitors.forEach(function(item) {
      if (item.url === url) {
        monitor = item;
        return;
      }
    });
    if (monitor === null) {
      console.log('New monitor:', url);
      monitor = {
       date: new Date(),
       url:url,
       isActive:true,
       timer:0
     };
     monitors.push(monitor);
     window.setTimeout(refreshMonitor, TIMEOUT, monitor);
    }
  }

  var removeMonitor = function(monitor) {
    console.log('Removing monitor for',monitor.url);
    var index = monitors.indexOf(monitor);
    if (index>=0) {
      monitors.splice(index, 1);
    }
  }

  var cleanupMonitors = function() {
    var validMonitors = [];
    var today = new Date().toDateString();
    chrome.tabs.query({}, function(tabs) {
      monitors.forEach(function(monitor) {
        if (monitor.date.toDateString() != today) {
          monitor.isActive = false;
        }
        if (monitor.isActive) {
          var hasOpenTab = false;
          tabs.forEach(function(tab) {
            if (monitor.url == tab.url) {
              validMonitors.push(monitor);
              hasOpenTab = true;
              return;
            }
          });
          if (! hasOpenTab) {
            monitor.isActive = false;
          }
        }
      });
      console.log("cleaning up",monitors.length-validMonitors.length,"of",monitors.length,"monitors")
      monitors = validMonitors;
    })
  }

  var monitorTab = function() {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, function(tabs) {
        tabs.forEach(function(tab) {
          var title = new URL(tab.url).hostname;
          setupMonitor(title)
        })
    })
  }

  function setupTabListeners() {
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (sender.tab) {
        console.debug('user activity: ', message.activity);
        userInteraction = message.activity;
      }
    });
    chrome.tabs.onActivated.addListener(monitorTab);
    chrome.tabs.onUpdated.addListener(monitorTab);
    chrome.tabs.onRemoved.addListener(cleanupMonitors)
  }

  setupTabListeners();
})(window);
