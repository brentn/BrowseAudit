(function() {
  'use strict';
  const TIMEOUT = 5000;
  const ACTIVITY_TIMEOUT = 10000;
  const SYNC_TIMEOUT = 60000;
  const STORE = 'http://it--lxn2048:8000';
  var monitors = [];
  var userInteraction = false;
  var currentUrl = '';
  var user = '';
  var timer = null;
  var activityTimer = null;

  var updateMonitor = function(monitor) {
    if (monitor.enabled) {
      if (userInteraction) {
        monitor.timer += (TIMEOUT/1000);
        console.debug('Timing',monitor.title,(monitor.timer/60).toFixed(1),"mins");
      }
      timer = window.setTimeout(updateMonitor, TIMEOUT, monitor);
    }
  }

  var activateMonitor = function() {
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function(tabs) {
      tabs.forEach(function(tab) {
        var monitor = findMonitor(tab.url);
        if (! monitor) {
          monitor = {
            url: tab.url,
            title: new URL(tab.url).hostname,
            enabled: true,
            date: new Date(),
            timer: 0
          };
          console.log("Monitoring", monitor.title);
          monitors.push(monitor);
        }
        window.clearTimeout(timer);
        currentUrl = tab.url;
        timer = window.setTimeout(updateMonitor, TIMEOUT, monitor)
      });
    })
  }

  function findMonitor(url) {
    return monitors.find(function(monitor) {return monitor.url === url});
  }

  function dateString(date) {
    if (date instanceof Date) {
      return (date.getMonth()+1)+'/'+date.getDate()+'/'+date.getFullYear();
    }
    return '00/00/00';
  }

  function loadMonitors() {
    monitors = [];
    var date = dateString(new Date());
    chrome.storage.local.get(date, function(json) {
      try {
        monitors = JSON.parse(json[date]);
        console.debug('loaded',monitors.length,'records')
      } catch (ex) {
        monitors = [];
      }
    });
  }

  var saveMonitors = function() {
    if (monitors.length > 0) {
      var dataObj = {};
      dataObj[dateString(monitors[0].date)] = JSON.stringify(monitors);
      chrome.storage.local.set(dataObj);
      console.debug('saved',monitors.length,'records')
    }
  }

  var syncData = function() {
    chrome.storage.local.get(null, function(data) {
      try {
        for (var date in data) {
          var postId = Math.random() * Number.MAX_SAFE_INTEGER;
          if (data.hasOwnProperty(date)) {
            var postData = {
              user: user,
              postId: postId,
              date: date,
              data: data[date]
            }
            $.ajax(STORE + '/addRecords', {
              method: 'POST',
              data: postData,
              success: function(response) {
                if (response == postId) {
                  console.debug('uploaded',JSON.parse(data[date]).length,'records.');
                  chrome.storage.local.remove(date);
                  loadMonitors();
                }
              },
            });
          }
        }
      } catch(ex) {}
    })
    window.setTimeout(syncData, SYNC_TIMEOUT);
  }

  function startSync() {
    window.setTimeout(syncData, SYNC_TIMEOUT);
  }

  function idle() {
    console.debug('User is idle');
    userInteraction = false;
    saveMonitors();
  }
  function active() {
    //console.debug('User is active');
    window.clearTimeout(activityTimer);
    userInteraction = true;
    activityTimer = window.setTimeout(idle, ACTIVITY_TIMEOUT);
  }

  function init() {
    chrome.windows.onCreated.addListener(activateMonitor);
    chrome.windows.onFocusChanged.addListener(activateMonitor);
    chrome.windows.onRemoved.addListener(saveMonitors);
    chrome.tabs.onActivated.addListener(activateMonitor);
    chrome.tabs.onUpdated.addListener(activateMonitor);
    chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
      if (sender.tab) { active(); }
    });
    chrome.identity.getProfileUserInfo(function(userInfo) { user = userInfo.email; })
    loadMonitors();
    startSync();
  }

  init();
})();
