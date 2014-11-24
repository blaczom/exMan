exUtil = require('../exUtil');
testBase = require('./test-base');
fs = require('fs');
var test = testBase.testObj;

var checkResult = function(){
  exUtil.setLogParam({name:"testUtil.log", tofile:true, showinfo:true});
  var l_rtn = true;
  var l_testObj = test.obj("exUtil.info", exUtil.info("test"));
  var ls = fs.readFileSync('testUtil.log', 'utf-8');
  if (ls.length>5) test.ok(l_testObj); else l_rtn = test.no(l_testObj);
  fs.unlinkSync('testUtil.log');

  var l_testObj = test.obj("exUtil.err", exUtil.err("not error, just test"));
  var ls = fs.readFileSync('testUtil.log', 'utf-8');
  if ( ls.indexOf('not error, just test') >0 ) test.ok(l_testObj); else l_rtn = test.no(l_testObj);
  fs.unlinkSync('testUtil.log');

  l_testObj = test.obj("exUtil.getDateTime", exUtil.getDateTime());
  if (l_testObj.obj > '2014-11-01') test.ok(l_testObj); else l_rtn = test.no(l_testObj);

  l_testObj = test.obj("exUtil.getDate", exUtil.getDate(new Date()));
  if (l_testObj.obj > '2014-11-01') test.ok(l_testObj); else l_rtn = test.no(l_testObj);

  var l_testObj = test.obj("exUtil.verifyBool", exUtil.verifyBool('true'));
  if (exUtil.verifyBool(1) && exUtil.verifyBool('1') && exUtil.verifyBool('true')) test.ok(l_testObj); else l_rtn = test.no(l_testObj);
  if (exUtil.verifyBool(0) || exUtil.verifyBool('0') || exUtil.verifyBool('false'))  l_rtn = test.no(l_testObj); else test.ok(l_testObj);

  return l_rtn;
};

exports.checkResult = checkResult;
// var test_exUtil = require('./test-exUtil');
// if (test_exUtil.checkResult()) console.log('test exUtil ok'); else console.log('fail test exUtil');