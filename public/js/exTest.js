/**
 * Created by blaczom on 2014/11/9.
 *
 ========== usage:  增加引用到index文件。 ======
 <script src="/js/exTest.js"></script>
 在angular中增加模块引用:
 angular.module('exManic', ['test'])
 .run(function( exLocalDb, exTestUtil, ....) {
    console.log("============测试exUtil-----", exTestUtil.checkResult());
    console.log("============测试exStore-----", exTestDb.checkResult());
    console.log("============测试exLocalDb----", exTestLocalDb.checkResult());
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

      exStore.clearUserList();
      l_testObj = gTestObj("exStore.clearUserList()", exStore.getUserList());
      if ( l_testObj.obj.hasOwnProperty('pass') ) l_rtn = logNo(l_testObj); else logOk(l_testObj);

      return l_rtn;
    }
  }
})
.factory('exTestLocalDb', function(exLocalDb){
  return {
    checkResult:function(){

      // 数据库runSqlPromise、runSql的测试机
      exLocalDb.runSqlPromise('delete from user where NICKNAME = "inserttest"')
      .then(
        function(aRow){
          exLocalDb.runSqlPromise('insert into user(NICKNAME,PASS,REMPASS) values("inserttest", "pass", 1)')
          .then(
            function(aRow) {
              exLocalDb.runSql("select * from user where NICKNAME =?", 'inserttest',
                function (aErr, aRow) {
                  if (aErr) logNo({name: "exTestLocalDb runSql select ", obj: aErr });
                  else{
                    logOk({name: "exTestLocalDb runSql delete->insert->select", obj: aRow});
                    exLocalDb.runSqlPromise('delete from user where NICKNAME = "inserttest"');
                  }
                }
              );
            },
            function(aErr){
              logNo( {name:"exTestLocalDb runSqlPromise insert ", obj: aErr } );
            }
          )
        }
      ,
        function(aErr){
          logNo( {name:"exTestLocalDb runSqlPromise delete ", obj: aErr } );
        }
      );

      // user 对象 测试 && exLocalDb.genSave && exLocalDb.comSave
      var l_rtn = true;
      var l_user = exLocalDb.user.new();
      var l_testObj = gTestObj("exLocalDb.user.new", l_user);
      if (l_testObj.obj.hasOwnProperty('NICKNAME')) logOk(l_testObj); else l_rtn = logNo(l_testObj);

      l_user.NICKNAME = 'objinserttest';
      l_user.PASS = 'pass';
      l_user.REMPASS = true;

      // exLocalDb.genSave insert
      var l_genUserSql = exLocalDb.genSave(l_user, 'USER');
      if (l_genUserSql[0] == "insert into USER(NICKNAME,PASS,REMPASS) values ( ?,?,?)" &&
        l_genUserSql[1][0] == l_user.NICKNAME && l_genUserSql[1][1] == l_user.PASS && l_genUserSql[1][2] == l_user.REMPASS)
        logOk({name: "genSave生成insert的user语句", obj: l_genUserSql});
      else logNo({name: "genSave生成insert的user语句", obj: l_genUserSql });
      // exLocalDb.genSave update
      exLocalDb.appendix.setDirty(l_user);
      l_genUserSql = exLocalDb.genSave(l_user, 'USER');
      if (l_genUserSql[0] == "update USER set NICKNAME=?,PASS=?,REMPASS=? where NICKNAME = 'objinserttest'" &&
        l_genUserSql[1][0] == l_user.NICKNAME && l_genUserSql[1][1] == l_user.PASS && l_genUserSql[1][2] == l_user.REMPASS)
        logOk({name: "genSave生成update的user语句", obj: l_genUserSql});
      else logNo({name: "genSave生成update的user语句", obj: l_genUserSql });

      //  exLocalDb.comSave  && user.getByNickName, save, delete
      exLocalDb.appendix.setNew(l_user);
      l_user.delete(l_user.NICKNAME, function(aErr, aRow) {});  // 清理一下如果有残余
      exLocalDb.comSave(l_user, 'USER', function(aErr, aRow){
        if (aErr) logNo({name: "comSave user ", obj: aErr });
        else {
          logOk( {name:"comSave user", obj: aRow } );
          l_user.getByNickName(l_user.NICKNAME, function(aErr, aRow){
            if (aErr) logNo({name: "user getByNickName", obj: aErr });
            else {
              if (aRow.length > 0 ) {
                logOk( {name:"user getByNickName", obj: aRow } );
                l_user.PASS = 'change4update';
                exLocalDb.appendix.setDirty(l_user);
                l_user.save(l_user, function(aErr, aRow){
                  if (aErr) logNo({name: "user save", obj: aErr });
                  else {
                    logOk( {name:"user save", obj: aRow } )
                    l_user.delete(l_user.NICKNAME, function(aErr, aRow){
                      if (aErr) logNo({name: "user delete", obj: aErr });
                      else logOk( {name:"user delete", obj: aRow } )
                    });
                  }
                })
              }
              else
                logNo({name: "user getByNickName has no return ", obj: aRow });
            }
          });
        }
      });

      var l_task = exLocalDb.task.new();
      l_testObj = gTestObj("exLocalDb.task.new", l_task);
      if (l_testObj.obj.hasOwnProperty('UUID')) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      l_task.OWNER = 'dhtest';
      l_task.STATE = '计划';
      l_task.delete(l_task.UUID, function (aErr, aRow) {}); // 清理一下如果有残余
      l_task.save(l_task, function(aErr, aRow){
        if (aErr) logNo({name: "task save", obj: aErr });
        else {
          logOk( {name:"task save", obj: aRow } );
          l_task.getByUUID(l_task.UUID, function(aErr, aRow){
            if (aErr) logNo({name: "task getByUUID", obj: aErr });
            else {
              if (aRow.length > 0 && aRow[0].OWNER == l_task.OWNER) {
                logOk( {name:"task getByUUID", obj: aRow } );
                l_task.OWNER = 'dhtest2';
                exLocalDb.appendix.setDirty(l_task);
                l_task.save(l_task, function(aErr, aRow) {
                  if (aErr) logNo({name: "task save2", obj: aErr });
                  else {
                    logOk({name: "task save2", obj: aRow });
                    l_task.delete(l_task.UUID, function (aErr, aRow) {
                      if (aErr) logNo({name: "task delete", obj: aErr });
                      else logOk({name: "task delete", obj: aRow });
                    });
                  }
                })
              }
              else
                logNo({name: "task getByUUID has no return ", obj: aRow });
            }
          });
        }
      });

    }
  }
})
.factory('exTestAccess', function(exAccess){
  return {
    checkResult:function() {
      var l_rtn = true;
      l_testObj = gTestObj("exAccess.user.new();", exAccess.user.new());
      if (l_testObj.obj.hasOwnProperty('NICKNAME')) logOk(l_testObj); else l_rtn = logNo(l_testObj);
      return l_rtn;
    }
  }
});

/*
  app.js 关于路由的用curl来测试。

*/
