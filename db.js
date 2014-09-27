/**
 * Created by donghai on 2014/9/20.
 */

var gUid = require('uuid');
var sqlite3 = require('sqlite3');

// if exist exman.db, means the sql ddl have been execute.
var fs = require('fs');
var dbHelp = require('./dbhelp.js');

if (!fs.exists('exman.db'))
{
  console.log("no databse file. will create it.");
  var l_run = [];
  l_run.push( "CREATE TABLE if not exists USER(UUID CHAR(36), NICKNAME NVARCHAR2(36) NOT NULL, " +
    " PASS CHAR(36) NOT NULL, REMPASS BOOL, MOBILE NVARCHAR2(20), EMAIL NVARCHAR2(80), IDCARD NVARCHAR2(30), " +
    " UPMAN NVARCHAR2(36), LEVEL INTEGER, GRANT INTEGER  );");
  l_run.push("CREATE UNIQUE INDEX if not exists  [pk_usernick] ON [USER] ([NICKNAME]);");

  l_run.push("CREATE TABLE if not exists TASK(UUID CHAR(36), UPTASK CHAR(36), START DATETIME NOT NULL, " +
    " FINISH DATETIME NOT NULL, STATE NVARCHAR2(8), OWNER NVARCHAR2(36) NOT NULL, LEVEL INTEGER NOT NULL, " +
    " PRIVATE BOOLEAN, CONTENT NVARCHAR2(6000) );");
  l_run.push("CREATE INDEX if not exists [idx_task_owner] ON [TASK] ([OWNER] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_uuid] ON [TASK] ([UUID] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_state] ON [TASK] ([STATE] ASC);");

  l_run.push("CREATE TABLE if not exists LOG(UUID CHAR(36), UPTASK CHAR(36), CREATETIME DATETIME NOT NULL,  " +
    " UPDATETIME DATETIME, STATE NVARCHAR2(8), OWNER NVARCHAR2(36) NOT NULL, PRIVATE BOOLEAN" +
    " MEMEN BOOLEAN, MEMTIMER NVARCHAR2(60),CONTENT NVARCHAR2(6000) );");

  l_run.push( "CREATE TABLE if not exists MSG(UUID CHAR(36), CREATETIME DATETIME NOT NULL,  " +
    " MSG NVARCHAR2(6000), TARGET NVARCHAR2(6000), OVER NVARCHAR2(6000), VALIDATE DATETIME) ");

  l_run.push( "CREATE TABLE if not exists TASK_MAN(TASK_ID CHAR(36), MAN_ID CHAR(36) ) ");
//每次执行前删除一边 validate过期的东东。
  var l_init = true;
}
var gdb = new sqlite3.Database('exman.db');

if (l_init) {
  gdb.serialize(function() {
    for (var i in l_run) {
      gdb.run(l_run[i], function (err, row) {
        if (err) {
          console.log("run Error: " + err.message + " " + l_run[i]);
        }
      });
    }
  });
}

var reConnect = function(){
  if (!gdb)  var gdb = new sqlite3.Database('exman.db');  // 时间长了可能会自动断掉?
};

function runSql(aSql, aCallback){
  console.log("db.runsql " + aSql);
  gdb.run(aSql, function (err, row){
    if (err) { console.log("runSql Error: " + err.message);  }
    aCallback(err, row);
  } );
};

function USER(){
  USER.prototype.new = function() {
    return {
      UUID :  gUid.v1(),
      NICKNAME : "",
      PASS : "",
      REMPASS : true,
      MOBILE : "",
      EMAIL : "",
      IDCARD : "" ,
      UPMAN : "",
      LEVEL : 0,
      GRANT : 0,
      _exState : "new" // new , clean, dirty.
    }
  };
  USER.prototype.save = function (aUser, aCallback){
    try {
      ls_sql = dbHelp.genSave(aUser, 'user');
      gdb.run(ls_sql, function (err, row){
        if (err) { console.log("save Error: " + err.message);  }
        else { aUser._exState = 'clean'; }
        aCallback(err, row);
      } );
    }
    catch (err) { aCallback(err, err); }
  };
  USER.prototype.getBy = function (aWhere, aCallback) {
    try {
      gdb.all("SELECT * FROM USER " + aWhere, function (err, row) {
        if (err) {  console.log("user.get Error: " + err.message); }
        else{ for (var i in row) { row[i]._exState = 'clean'; } }
        aCallback(err, row);
      });
    }
    catch (err) {  aCallback(err, err); }
  };
  USER.prototype.getByNickName = function (aNick, aCallback) {
    USER.prototype.getBy(" where NICKNAME='" + aNick  + "'", aCallback);
  }
  USER.prototype.getByUUID = function (aUUID, aCallback) {
    USER.prototype.getBy(" where UUID='" + aUUID  + "'", aCallback);
  }
  USER.prototype.validPass = function (aNick, aMd5, aCallback){
    USER.prototype.getByNickName(aNick, function(aErr, aRtn){
      if (aRtn.length>0){
        if (aRtn[0].PASS == aMd5) {
          aCallback(aErr, true);
          return;
        }
      }
      aCallback("fail", false);
    });
  }
  USER.prototype.setAutoLogin = function(aNick, aAuto, aCallback){
    runSql("update User set REMPASS='" + aAuto + "' where NICKNAME='" + aNick + "'", aCallback );
  };
  USER.prototype.getMyTask = function(aNick, aCallback){
    runSql(' ');
  };
  USER.prototype.getAllTask = function(){
    runSql(' ');
  };
};

function TASK() {
  TASK.prototype.new = function () {
    var l_now = new Date();
    var l_date = new Array(l_now.getFullYear(), l_now.getMonth() < 9 ? '0' + (l_now.getMonth() + 1) : l_now.getMonth(), l_now.getDate() < 10 ? '0' + l_now.getDate() : l_now.getDate());
    var l_time = new Array(l_now.getHours() < 10 ? '0' + l_now.getHours() : l_now.getHours(), l_now.getMinutes() < 10 ? '0' + l_now.getMinutes() : l_now.getMinutes(), l_now.getSeconds() < 10 ? '0' + l_now.getSeconds() : l_now.getSeconds());
    var l_fmtDatetime = l_date.join('-') + ' ' + l_time.join(':'); // '2014-01-02 09:33:33'
    return {
      UUID: gUid.v1(),
      UPTASK: 0,
      START: l_fmtDatetime,
      FINISH: l_fmtDatetime,
      STATE: '',  // 'plan', 'do', 'ok', 'fail'
      OWNER: '',
      LEVEL: '',  // LEVEL: 0,
      PRIVATE: '',  // false
      CONTENT: '',
      _exState: "new" // new , clean, dirty.
    }
  };
  TASK.prototype.save = function (aTask, aCallback) {
    try {
      ls_sql = dbHelp.genSave(aTask, 'task');
      gdb.run(ls_sql, function (err, row) {
        if (err) {
          console.log("save Error: " + err.message);
        }
        else {
          aTask._exState = 'clean';
        }
        aCallback(err, row);
      });
    }
    catch (err) {
      aCallback(err, err);
    }
  };
  TASK.prototype.getBy = function (aWhere, aCallback) {
    try {
      gdb.all("SELECT * FROM Task " + aWhere, function (err, row) {
        if (err) {
          console.log("Task.all Error: " + err.message);
        }
        else {
          for (var i in row) {
            row[i]._exState = 'clean';
          }
        }
        aCallback(err, row);
      });
    }
    catch (err) {
      aCallback(err, err);
    }
  };
  TASK.prototype.getByUUID = function (aUUID, aCallback) {
    TASK.prototype.getBy(" where UUID='" + aUUID + "'", aCallback);
  };
  TASK.prototype.getChildren = function (aUUID, aCallback) {
    var getChild = function(aRow) {
      var callback = function (err, row) {
        if (row.length > 0) {
          callback.target.children = [];
          for (var i in row) {
            getChild(row[i]);
          }
        }
      };
      callback.target = aRow;
      gdb.all("SELECT * FROM Task where UPTASK='" + aRow.UUID + "'", callback);
    };
    gdb.all("SELECT * FROM Task where UPTASK='" + aUUID + "'", function (err, row) {
      if (row.length > 0) {
        aRoot = [];
        for (var i in row) {
          aRoot.push(row[i])
          getChild(row[i]);
        }
      }
    });
  }
}

exports.User = function(){  return new USER(); }();
exports.Task = function(){  return new TASK();}();





/*
module.exports = {
  factory: function (aName) {
    if (['User', 'Object'].indexOf(aName) >= 0) {
      return eval('new ' + aName + '()')
    }
    else {
      console.log("no such object " + aName);
    }
  }
}

 node
 User = require('./db.js').User;
 u1 = new User();
 u1.NICKNAME = 'fire'
 u1.save(function(err, row){console.log('save')})
 u1.EMAIL = 'FF@111.COM'
 u1._exState = 'dirty'
 u1.save(function(err, row){console.log('save')})

 u1.getBy("where UUID='" + u1.UUID + "'" , function(er,ret){u2=ret;})
 u1.getByNickName("fire", function(er,ret){u2=ret});
 if (u2.length > 0) { ok ; }

 NICKNAME

 *
 *

 // 得到数据库对象的属性。

 var sqlite3 = require('sqlite3');
 var gdb = new sqlite3.Database('exman.db');
 gdb.get("select * from xxxx ", function(err,rtn){gRtn = rtn} );
 生成对象的语句：
 this.xxx = xxx
 for (var i in gRtn) { console.log("this." + i + " = '' ;" ) ;}


 var u2;
 aCallback = function(err, row){u2 = row};
 u1.get("where UUID='" + u1.UUID + "'" , function(er,ret){u2=ret;})


 var str = JSON.stringify(u2);
 var obj2 = JSON.parse(str);
 *
 *
 *
*/
