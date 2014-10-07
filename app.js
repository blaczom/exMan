var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));

app.use(cookieParser());
app.use(session({ secret:'unHapy8',resave:true, saveUninitialized:true}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

var rest = require('./routes/rest');
var exTools = require('./routes/extools');

app.use('/', express.Router().get('/', function(req, res){res.redirect('/partials/index.html')}));
app.use('/rest', rest);
app.use('/extools', exTools);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var gDB = require('./db');
app.db=gDB;

app.rtnErr = function(aMsg, aErr) {
  var strErr, strMsg;
  ((typeof aMsg) == 'object') ? strMsg = JSON.stringify(aMsg) : strMsg = aMsg;
  ((typeof aErr) == 'object') ? strErr = JSON.stringify(aErr): strErr = aErr;
  return { "rtnInfo": strMsg, rtnCode: -1, "alertType": 0, error: strErr, exObj:{} }
};
app.rtnMsg = function(aMsg) {
  return { "rtnInfo": aMsg, rtnCode: 1, "alertType": 0, error: [], exObj:{} }
};

app.logInfo = function()
{
  console.log(arguments);
};


module.exports = app;
