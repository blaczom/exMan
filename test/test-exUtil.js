exUtil = require('../exUtil');
fs = require('fs');
var test = {
  obj : function(aName, aObj) { return {  name : aName, obj : aObj } },
  ok : function(aObj){ console.log(aObj.name + "测试成功:->", aObj.obj); },
  no : function(aObj){ console.log("------测试失败:---->" + aObj.name, aObj.obj);
                      return false; }
};

var checkResult = function(){
  exUtil.setLogParam({name:"testUtil.log", tofile:true, showinfo:true});
  var l_rtn = true;
  var l_testObj = test.obj("exUtil.info", exUtil.info("test"));
  var ls = fs.readFileSync('testUtil.log', 'utf-8');
  if (l_testObj.obj=='{"0":"test"}' && '{"0":"test"}'==ls ) test.ok(l_testObj); else l_rtn = test.no(l_testObj);
  fs.unlinkSync('testUtil.log');

  var l_testObj = test.obj("exUtil.err", exUtil.err("err"));
  var ls = fs.readFileSync('testUtil.log', 'utf-8');
  if ( JSON.parse(l_testObj.obj)[2]['0'] == 'err' &&
    JSON.parse(ls)[2]['0'] == 'err' ) test.ok(l_testObj); else l_rtn = test.no(l_testObj);
  fs.unlinkSync('testUtil.log');

  l_testObj = test.obj("exUtil.getDateTime", exUtil.getDateTime());
  if (l_testObj.obj > '2014-11-01') test.ok(l_testObj); else l_rtn = test.no(l_testObj);

  l_testObj = test.obj("exUtil.getDate", exUtil.getDate(new Date()));
  if (l_testObj.obj > '2014-11-01') test.ok(l_testObj); else l_rtn = test.no(l_testObj);

  return l_rtn;
};

exports.checkResult = checkResult;
// var test_exUtil = require('./test-exUtil');
// if (test_exUtil.checkResult()) console.log('test exUtil ok'); else console.log('fail test exUtil');