/**
 * Created by blaczom on 2014/11/17.
 * log = require('./logger')
 * log.info(), log.err()
 */

var fs = require('fs');
var gFileLog = 'logger.txt', gb2file = true;
var gbShowInfo = true;
var info = function(){
  var ls_t = JSON.stringify(arguments);
  if (gbShowInfo) console.log(ls_t);
  if (gb2file) fs.appendFileSync(gFileLog, ls_t);
};
var err = function(){
  var l_a = ["--Err--"]; // ...
  l_a.push(arguments);
  var ls_t = JSON.stringify(l_a);
  console.log(ls_t);
  if (gb2file) fs.appendFileSync(gFileLog, ls_t);
};

function getDateTime(aTime, aOnlyDate){
  // 向后一天，用 new Date( new Date() - 0 + 1*86400000)
  // 向后一小时，用 new Date( new Date() - 0 + 1*3600000)
  if (!aTime) aTime = new Date();
  var l_date = new Array(aTime.getFullYear(), aTime.getMonth()  < 9 ? '0' + (aTime.getMonth() + 1) : (aTime.getMonth()+1), aTime.getDate() < 10 ? '0' + aTime.getDate() : aTime.getDate());
  if (aOnlyDate)
    return( l_date.join('-')) ; // '2014-01-02'
  else {
    var l_time = new Array(aTime.getHours() < 10 ? '0' + aTime.getHours() : aTime.getHours(), aTime.getMinutes() < 10 ? '0' + aTime.getMinutes() : aTime.getMinutes(), aTime.getSeconds() < 10 ? '0' + aTime.getSeconds() : aTime.getSeconds());
    return( l_date.join('-') + ' ' + l_time.join(':')); // '2014-01-02 09:33:33'
  }
};

exports.err = err;
exports.info = info;
exports.getDateTime = getDateTime;
exports.getDate = function(arg1){return getDateTime(arg1,true)};
