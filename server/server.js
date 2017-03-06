const RECORDS_FILE = __dirname + '/data/records.json';

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require('fs');

var app = express();
app.use(express.static('resources'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var records=null;
var loadRecords = function() {fs.readFile(RECORDS_FILE, 'utf8', function(err, json) {
    if (err) {
      console.log('Error reading records')
      records = null;
    } else {
      records = JSON.parse(json);
    }
  });
};

app.get('/', function(request, response) {
  response.send(JSON.stringify(records));
});

app.post('/addRecords', function(request, response) {
  if (records === null) { loadRecords() }
  else {
    var user = request.body.user;
    var data = JSON.parse(request.body.data);
    data.forEach(function(item) {
      console.log('adding',item.url.split('/')[2],item.timer);
      var record = records.find(function(r) { return r.user === user && r.date === item.date && r.url === item.url; });
      if (! record) {
        record = {
          user: user,
          date: item.date,
          url: item.url,
          timer: 0
        }
        records.push(record);
      }
      record.timer += item.timer;
    });
    fs.writeFile(RECORDS_FILE, JSON.stringify(records), 'utf8');
    response.send(request.body.postId);
  }
});

loadRecords();
app.listen(8000);
