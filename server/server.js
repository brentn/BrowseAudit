const RECORDS_FILE = __dirname + '/data/records.json';

var mysql = require('mysql');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var fs = require('fs');

var app = express();
app.use(express.static('resources'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var pool = mysql.createPool({
  connectionLimit: 100,
  host: 'localhost',
  user: 'browseAudit',
  password: 'VkRhJb76C9PlGLzM',
  database: 'browseAudit',
  debug: false
});

app.get('/', function(request, response) {
  var today = new Date();
  var sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
  pool.getConnection(function(err, connection) {
    if (!err) {
      connection.query('SELECT * FROM visits WHERE date > ?',[sevenDaysAgo], function(err, rows) {
        if (!err) {
          connection.release();
          response.json(rows);
        } else {
          console.log('Error retrieving rows');
        }
      });
      connection.on('error', function(err) {
        connection.release();
        console.log("Error 2 retrieving data from database");
      })
    } else {
      console.log("Error 1 connecting to database");
    }
  })
});

app.post('/addRecords', function(request, response) {
  pool.getConnection(function(err, connection) {
    if (!err) {
      var user = request.body.user.split('@')[0].replace(/\./g,'') +'@'+ request.body.user.split('@')[1];
      var data = JSON.parse(request.body.data);
      data.forEach(function(item) {
        var date = new Date(new Date(item.date).setHours(0,0,0,0));
        console.log('adding',user,item.url.split('/')[2],item.timer);
        connection.query('SELECT * FROM visits WHERE user=? AND date=? AND url=?', [user, date, item.url], function(err, rows) {
          if (!err) {
            if (rows.length > 0) {
              var newTime = rows[0].time += item.timer;
              connection.query('UPDATE visits SET time = ? WHERE id = ?', [newTime, rows[0].id] , function(err) {
                if (err) {
                  console.log("Error updating record", err);
                }
              })
            } else {
              var newRecord = {
                user: user,
                date: new Date(item.date),
                startTime: new Date(item.date),
                url: item.url,
                time: item.timer
              }
              connection.query('INSERT INTO visits SET ?', newRecord, function(err) {
                if (err) {
                  console.log("Error inserting record", err);
                }
              })
            }
          } else {
            console.log("Error connection error 4",err);
          }
        });
      });
      connection.release();
      response.send(request.body.postId);
    } else {
      console.log("Error 3 connecting to database to add records");
    }
  });
});

app.listen(8000);
