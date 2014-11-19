/**
 * Created by blaczom on 2014/11/9.
 *
 ========== usage:  增加引用到index文件。 ======
 <script src="/js/exTest.js"></script>
 在angular中增加模块引用:
 angular.module('exManic', ['test'])
 .run(function( exLocalDb, exTestUtil, ....) {
    console.log("====测试exUtil-----", exTestUtil.checkResult());
    console.log("====测试exStore-----", exTestDb.checkResult());
 *
 */
var gTestObj = function(aName, aObj) {
  return {
    name : aName,
    obj : aObj  // 返回对象
  }
};
var logOk = function(aObj){
  console.log(aObj.name + "测试成功:->", aObj.obj);
};
var logNo = function(aObj){
  console.log("------测试失败:---->" + aObj.name, aObj.obj);
  return false;
};

angular.module('exManTest', ['exService'])
.factory('exTestUtil', function(exUtil){
  return {
    checkResult: function(){
      var l_rtn = true;
      var l_testObj = gTestObj("exUtil.createUUID", exUtil.createUUID());
      if (l_testObj.obj.length > 20) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      l_testObj = gTestObj("exUtil.getDateTime", exUtil.getDateTime(new Date()));
      if (l_testObj.obj.length > 12) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      l_testObj = gTestObj("exUtil.getDate", exUtil.getDate(new Date()));
      if (l_testObj.obj.length == 10) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      return l_rtn;
    }
  }
})
.factory('exTestDb', function(exStore){
  return {
    checkResult:function(){
      var l_rtn = true;
      var l_testObj = gTestObj("exStore.verifyBool", exStore.verifyBool('true'));
      if (exStore.verifyBool(1) && exStore.verifyBool('1') && exStore.verifyBool('true')) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      if (exStore.verifyBool(0) || exStore.verifyBool('0') || exStore.verifyBool('false'))  l_rtn = logNo(l_testObj); else logOk(l_testObj);

      exStore.setUserList('dh', 'dh', '1');
      exStore.setUserList('dh2', 'dh2', '1');
      exStore.setUserList('dh3', 'dh3', '0');
      l_testObj = gTestObj("exStore.getUserList", exStore.getUserList());
      if( (l_testObj.obj['dh2'].pass == 'dh2') && (l_testObj.obj['dh3'].rempass == false)
        && (l_testObj.obj['dh'].rempass)) logOk(l_testObj); else l_rtn = logNo(l_testObj);

      exStore.setUserList('dh2', 'dh2', '1');
      l_testObj = gTestObj("exStore.getUser()", exStore.getUser());
      if (l_testObj.obj.name == 'dh2' && l_testObj.obj.pass == 'dh2') logOk(l_testObj); else l_rtn = logNo(l_testObj);
      l_testObj = gTestObj("exStore.getUser('dh')", exStore.getUser('dh'));
      if (l_testObj.obj.name == 'dh' && l_testObj.obj.pass == 'dh') logOk(l_testObj); else l_rtn = logNo(l_testObj);

      l_testObj = gTestObj("exStore.getUserNameList()", exStore.getUserNameList());
      if (String(l_testObj.obj)  == String(["dh", "dh2", "dh3"])) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      l_testObj = gTestObj("exStore.err()", exStore.err('test err, not err'));
      if (JSON.parse(exStore.getErr())[0] == 'test err, not err' ) logOk(l_testObj); else l_rtn = logNo(l_testObj);

      exStore.clearUserList();
      l_testObj = gTestObj("exStore.clearUserList()", exStore.getUserList());
      if ( l_testObj.obj.hasOwnProperty('pass') ) l_rtn = logNo(l_testObj); else logOk(l_testObj);

      return l_rtn;
    }
  }
})

/*
  app.js 关于路由的用curl来测试。

*/
