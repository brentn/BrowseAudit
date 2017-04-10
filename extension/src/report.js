(function() {
  'use strict';
  const URL = 'http://it--lxn2048:8000';

  function displayReport(data) {
    var report = $("<div>")
    report.append($("<span class='loading' style='text-align:center'>loading...</span>"))
    report.append($('<h2>Report</h2>'));
    var users = getUsersFrom(data);
    var maxTime = users.reduce(function(a, b) { return (a>b.time?a:b.time) }, 0);
    users.forEach(function(user) {
      report.append(userReport(data, user, maxTime));
    });
    $('body').append(report);
    $('.expandable').hide();
    $('.toggle').off('click').on('click', toggle);
  }

  var toggle = function(evt) {
    var sender = evt.currentTarget;
    $(sender).children('.expandable').toggle();
    evt.stopPropagation();
  }

  function userReport(data, user, maxTime) {
    var report = $("<div class='user'>");
    var body = $("<div>");
    body.append($("<h3 title='" + user.name + "'>" + user.name.split('@')[0] + '</h3>'));
    var dates = getDatesFrom(data, user);
    dates.forEach(function(date) {
      body.append($('<blah>'))
      body.append(dateReport(data, user, date));
    })
    body.append('<hr/>')
    report.append(body);
    return report;
  }

  function dateReport(data, user, date) {
    var report = $("<div class='date'>");
    var header = $("<div class='toggle'>");
    var body = $("<div class='expandable'>");
    header.append($('<b>'+date.string+'</b>'));
    header.append($('<span class="total">' + getTimeString(date.time) + '</span>'));
    header.append(body);
    var domains = getDomainsFrom(data, user, date);
    var maxTime = domains.reduce(function(a, b) {return (a>b.time?a:b.time); }, 0);
    domains.forEach(function(domain) {
      body.append(domainReport(data, user, date, domain, maxTime))
    });
    report.append(header);
    return report;
  }

  function domainReport(data, user, date, domain, maxTime) {
    var report = $("<div class='domain'>");
    var header = $('<div class="toggle">');
    var body = $("<div class='expandable'>");
    header.append($('<h4>'+domain.hostname+'</h4>'));
    header.append($("<progress value='"+domain.time+"' max='"+maxTime+"'>"));
    header.append($("<span class='progress total'>"+getTimeString(domain.time)+"</span>"))
    header.append(body);
    var details = getDetailsFrom(data, user, date, domain);
    details.forEach(function(detail) {
      body.append($("<a href='"+detail.url+"' title='"+detail.url+"' target='_blank' onclick='$(this).stopPropagation();'>"+domain.hostname+'</a>'));
      body.append($("<span class='total'>" + getTimeString(detail.time) + "</span>"));
      body.append($('<br/>'));
    })
    report.append(header);
    return report;
  }

  function displayError() {
      $('body').empty();
      $('body').append($("<h3>Can't&nbsp;find&nbsp;the&nbsp;server</h3>"));
  }

  function getUsersFrom(data) {
    var users = [];
    data.forEach(function(item) {
      var user = users.find(function(u) { return u.name === item.user; });
      if (! user) {
        user = {
          name: item.user,
          time: 0
        };
        users.push(user);
      }
      user.time += item.time;
    });
    return users.sort(function(a, b) {return b.name>a.name?-1:1});
  }

  function getDatesFrom(data, user) {
    var dates = [];
    data.forEach(function(item) {
      if (item.user === user.name) {
        var dateString = getDateString(item.date);
        var date = dates.find(function(d) { return d.string === dateString; });
        if (! date) {
          date = {
            date: item.date,
            string: dateString,
            time: 0
          };
          dates.push(date);
        }
        date.time += item.time;
      }
    });
    return dates.sort(function(a, b) {return b.date>a.date?1:-1});
  }

  function getDomainsFrom(data, user, date) {
    var domains = [];
    data.forEach(function(item) {
      if (item.user === user.name && getDateString(item.date) === date.string) {
        var hostname = getHostname(item.url);
        var domain = domains.find(function(d) { return d.hostname === hostname; });
        if (! domain) {
          domain = {
            hostname: hostname,
            time: 0
          };
          domains.push(domain);
        }
        domain.time += item.time;
      }
    });
    return domains.sort(function(a, b) { return b.time-a.time;});
  }

  function getDetailsFrom(data, user, date, domain) {
    var details = [];
    data.forEach(function(item) {
      if (item.user === user.name && getDateString(item.date) === date.string && getHostname(item.url) === domain.hostname) {
          details.push(item);
      }
    });
    return details;
  }

  function getDateString(date) {
    if (date) {
      var d = new Date(date);
      return (d.getMonth()+1)+'/'+d.getDate()+'/'+d.getFullYear();
    }
    return '00/00/00';
  }

  function getTimeString(time) {
    var hours = Math.floor(time/3600);
    var minutes = Math.round((time%3600)/60);
    return (hours>0?hours + " hrs ":"") + minutes + " mins";
  }

  function getHostname(url) {
    return url.split('/')[2];
  }

  function getRecords() {
    $('.loading').show();
    $.ajax(URL, {
      method: 'GET',
      success: function(data) {
        displayReport(data);
        $('.loading').hide();
      },
      error: function() {
        displayError();
        $('.loading').hide();
      }
    });
  }

  function init() {
    getRecords();
  }

  init();
})();
