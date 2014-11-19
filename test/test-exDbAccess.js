/*
  etst exDbAccess & exDbSqlite3
 */
testBase = require('./test-base');
exDbAccess = require('../exDbAccess');
exDb = require('../exDbSqlite3');

var test = testBase.testObj;

var RecFunc = function(err, row){if(err) console.log('回调错误', err)};

var checkResult = function(){
  var l_rtn = true;

  var l_user = exDbAccess.USER.new();
  var l_testObj = test.obj("exDbAccess.USER", l_user);
  if (l_testObj.obj.hasOwnProperty('NICKNAME')) test.ok(l_testObj); else l_rtn = test.no(l_testObj);

  l_user.NICKNAME = 'objinserttest';
  l_user.PASS = 'pass';
  l_user.REMPASS = true;

  var l_genUserSql = exDb.genSave(l_user, 'USER');
  var ls_should = "insert into USER(NICKNAME,PASS,REMPASS,MOBILE,EMAIL,IDCARD,UPUSER,LEVEL,GRANT,SYNC) values ( ?,?,?,?,?,?,?,?,?,?)";
  if (l_genUserSql[0] == ls_should &&  l_genUserSql[1][0] == l_user.NICKNAME
  && l_genUserSql[1][1] == l_user.PASS && l_genUserSql[1][2] == l_user.REMPASS)
    test.ok( {name: "genSave生成insert的user语句", obj: l_genUserSql} );
  else l_rtn=test.no( {name: "genSave生成insert的user语句", obj: l_genUserSql });
  // exDb.genSave update
  exDbAccess.setDirty(l_user);
  l_genUserSql = exDb.genSave(l_user, 'USER');
  ls_should = "update USER set NICKNAME=?,PASS=?,REMPASS=?,MOBILE=?,EMAIL=?,IDCARD=?,UPUSER=?,LEVEL=?,GRANT=?,SYNC=? where NICKNAME = 'objinserttest'";
  if (l_genUserSql[0] == ls_should && l_genUserSql[1][0] == l_user.NICKNAME &&
  l_genUserSql[1][1] == l_user.PASS && l_genUserSql[1][2] == l_user.REMPASS)
    test.ok({name: "genSave生成update的user语句", obj: l_genUserSql});
  else l_rtn=test.no({name: "genSave生成update的user语句", obj: l_genUserSql });
  //exDb.genModel(true); // 从数据库中生成数据模型对象

  // 测试插入保存和更新.测试delete(runsql), save(comSave)
  l_user.delete(l_user.NICKNAME, function(aErr, aRow) {
    if (aErr) l_rtn = test.no({name: "user.delete", obj: aErr });
    exDbAccess.setNew(l_user);
    l_user.save(l_user, function(aErr, aRow) {
      if (aErr) l_rtn = test.no({name: "user.save", obj: aErr });
      l_user.getByNickName(l_user.NICKNAME, function(aErr, aRow) {
        if (aErr) l_rtn = test.no({name: "user.getByNickName", obj: aErr });
        else
          if ((aRow||[]).length > 0 && aRow[0].NICKNAME == l_user.NICKNAME)
            test.ok({name: "user getByNickName", obj: aRow });
          else
            l_rtn = test.no({name: "user getByNickName get no data:", obj: aRow });
      });
    });
  });

  var l_task = exDbAccess.TASK.new();
  l_task.UUID = "tmpInsertTask";
  l_task.save(l_task, function(aErr, aRow) {
    if (aErr) l_rtn = test.no({name: "l_task.save", obj: aErr });
    l_task.getByUUID(l_task.UUID, function(aErr, aRow) {
      if (aErr) l_rtn = test.no({name: "l_task.getByUUID run err ", obj: aErr });
      else
        if ((aRow||[]).length > 0 && aRow[0].UUID == l_task.UUID) {
          test.ok({name: "l_task.getByUUID", obj: aRow });
          l_task.delete(l_task.UUID, function(aErr, aRow) {});
        }
        else
          l_rtn = test.no({name: "l_task.getByUUID get no data:", obj: aRow });
    });
  });
  var l_work = exDbAccess.WORK.new();
  l_work.UUID = "tmpInsertWork";
  l_work.save(l_work, function(aErr, aRow) {
    if (aErr) l_rtn = test.no({name: "l_work.save", obj: aErr });
    l_work.getByUUID(l_work.UUID, function(aErr, aRow) {
      if (aErr) l_rtn = test.no({name: "l_work.getByUUID", obj: aErr });
      else
      if ((aRow||[]).length > 0 && aRow[0].UUID == l_work.UUID) {
        test.ok({name: "l_work.getByUUID", obj: aRow });
        l_work.delete(l_work.UUID, function(aErr, aRow) {});
      }
      else
        l_rtn = test.no({name: "l_work.getByUUID get no data:", obj: aRow });
    });
  });
  return l_rtn;
};

exports.checkResult = checkResult;
// var test_exUtil = require('./test-exUtil');
// if (test_exUtil.checkResult()) console.log('test exUtil ok'); else console.log('fail test exUtil');