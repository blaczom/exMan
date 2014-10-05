/**
 * Created by donghai on 2014/9/20.
 */

var gUid = require('uuid');
var sqlite3 = require('sqlite3');
var gdbFile = 'exman.db';
// if exist exman.db, means the sql ddl have been execute.
var fs = require('fs');
var dbHelp = require('./dbhelp.js');

if (!fs.exists(gdbFile))
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

  l_run.push("CREATE TABLE if not exists WORK(UUID CHAR(36), UPTASK CHAR(36), CREATETIME DATETIME NOT NULL,  " +
    " UPDATETIME DATETIME, STATE NVARCHAR2(8), OWNER NVARCHAR2(36) NOT NULL, PRIVATE BOOLEAN, " +
    " MEMEN BOOLEAN, MEMTIMER NVARCHAR2(60),CONTENT NVARCHAR2(6000) );");

  l_run.push( "CREATE TABLE if not exists MSG(UUID CHAR(36),OWNER NVARCHAR2(36) NOT NULL,CREATETIME DATETIME NOT NULL," +
    " MSG NVARCHAR2(6000), TARGET NVARCHAR2(6000), OVER NVARCHAR2(6000), VALIDATE DATETIME) ");

  l_run.push( "CREATE TABLE if not exists TASK_MAN(TASK_ID CHAR(36), MAN_NICK CHAR(36) ) ");
//每次执行前删除一边 validate过期的东东。
  var l_init = true;
}
var gdb = new sqlite3.Database(gdbFile);

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
  if (!gdb)  gdb = new sqlite3.Database(gdbFile);  // 时间长了可能会自动断掉?
};
function getDateTime(aTime, aOnlyDate){
  // 向后一天，用 new Date( new Date() - 0 + 1*86400000)
  // 向后一小时，用 new Date( new Date() - 0 + 1*3600000)
  var l_date = new Array(aTime.getFullYear(), aTime.getMonth() < 9 ? '0' + (aTime.getMonth() + 1) : aTime.getMonth(), aTime.getDate() < 10 ? '0' + aTime.getDate() : aTime.getDate());
  var l_time = new Array(aTime.getHours() < 10 ? '0' + aTime.getHours() : aTime.getHours(), aTime.getMinutes() < 10 ? '0' + aTime.getMinutes() : aTime.getMinutes(), aTime.getSeconds() < 10 ? '0' + aTime.getSeconds() : aTime.getSeconds());
  if (aOnlyDate)
    return( l_date.join('-')) ; // '2014-01-02'
  else
    return( l_date.join('-') + ' ' + l_time.join(':')); // '2014-01-02 09:33:33'
}

function runSql(aSql, aCallback){
  console.log("db.runsql " + aSql);
  gdb.run(aSql, function (err, row){
    if (err) { console.log("runSql Error: " + err.message);  }
    aCallback(err, row);
  } );
};
function comSave(aTarget, aTable, aCallback) {
  try {
    ls_sql = dbHelp.genSave(aTarget, aTable);
    gdb.run(ls_sql, function (err, row) {
      if (err) {
        console.log("save Error: " + err.message);
      }
      else {
        aTarget._exState = 'clean';
      }
      aCallback(err, row);
    });
  }
  catch (err) {
    console.log('save catch a error: ' + err.message);
    aCallback(err, err);
  }
};
function comGetBy(aTable, aWhere,  aCallback) {
  try {
    gdb.all("SELECT * FROM  " + aTable + ' ' + aWhere, function (err, row) {
      if (err) {
        console.log(aTable + ".all Error: " + err.message);
      }
      else {
        for (var i in row) {
          row[i]._exState = 'clean';
        }
      }
      aCallback(err, row); // 只要引用了上下文的变量，变量就可以继续引用。atable从上层传递下来。就能回溯到上层的aCallback.
    });
  }
  catch (err) {
    aCallback(err, err);
  }
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
    comSave(aUser, 'USER', aCallback);
  };
  USER.prototype.delete = function(aUUID, aCallback){
    gdb.run("delete USER where UUID = '?'", aUUID, function (err, row) {
      if (err) {  console.log("delete user Error: " + err.message);   }
      aCallback(err, row);
    });
  };
  USER.prototype.getBy = function (aWhere, aCallback) {
    comGetBy('USER', aWhere, aCallback);
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
  };
  USER.prototype.getAllTask = function(){
  };

};

function TASK() {
  TASK.prototype.new = function () {
    var l_fmtDatetime = getDateTime(new Date());
    return {
      UUID: gUid.v1(),
      UPTASK: "",
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
    comSave(aTask, 'TASK', aCallback);
  };
  TASK.prototype.delete = function(aUUID, aCallBack){
    gdb.run("delete TASK_MAN where UUID = '?'", aUUID, function (err, row) {
      if (err) {  console.log("delete task Error: " + err.message);   }
      aCallback(err, row);
    });
  }
  TASK.prototype.getBy = function (aWhere, aCallback) {
    comGetBy('TASK', aWhere, aCallback);
  };
  TASK.prototype.getByUUID = function (aUUID, aCallback) {
    TASK.prototype.getBy(" where UUID='" + aUUID + "'", aCallback);
  };
  TASK.prototype.getChildren = function (rootTask, aCallback) {
    var statckCallback = [];
    gdb.all("SELECT * FROM Task where UPTASK='" + rootTask.UUID + "'", function(err, row){
      rootTask.subTask = [];
      if (row.length > 0) {
        nextTask(rootTask.subTask, row, 0, aCallback); // 就调用一次over。
      }
      else
      { aCallback(null,rootTask); }
    });
    function nextTask(aParent, aRow, aI, aCallFin)  // aRow, 是一个数组。aI作为索引。 alen作为结束判断。
    {
      /*console.log('nextTask running ... aParent , aRow, ai');
      console.log(aParent);
      console.log(aRow);
      console.log(aI);
      console.log('--------------'); */
      if (aI < aRow.length) {
        aRow[aI].subTask = [];
        aParent.push(aRow[aI]);
        gdb.all("SELECT * FROM Task where UPTASK='" + aRow[aI].UUID + "'", function (err, row) {
          if (row.length > 0) {
            // console.log('有孩子的对象：');      console.log(aRow[aI]);
            statckCallback.push({a:aParent, b:aRow, c:(aI+1), d:aCallback });
            nextTask(aRow[aI].subTask, row, 0, aCallback);
          }
          else {
            //  console.log('没孩子的对象：');  console.log(aRow[aI]);
            nextTask(aParent, aRow, ++aI, aCallback);
          }
        })
      }
      else {
        if (rootTask.subTask === aParent) {
          aCallFin(null, rootTask);  // 循环到最上层，就可以直接返回。
        }
        else {
          // 调用上层的next来继续。next(aParent, aRow, ++aI, aCallback);
          var tmp = statckCallback.pop(); // ({a:aParent, b:aRow, c:++aI, d:aCallback });
          nextTask(tmp.a, tmp.b, tmp.c, tmp.d);
        }
      }
    };
  };
  TASK.prototype.assignUser = function(aUUID, aUserNick, aCallBack){
    gdb.run("insert into TASK_MAN values('?', '?')", aUUID, aUserNick, function (err, row) {
      if (err) {  console.log("add man to task Error: " + err.message);   }
      aCallback(err, row);
    });
  };

}

function WORK() {
  WORK.prototype.new = function () {
    var l_fmtDatetime = getDateTime(new Date());
    return {
      UUID: gUid.v1(),
      UPTASK: 0,
      CREATETIME: l_fmtDatetime,
      UPDATETIME : l_fmtDatetime,
      STATE: "plan",
      OWNER: "",
      PRIVATE: false,
      MEMEN: false,
      MEMTIMER: "",
      CONTENT: "",
      _exState: "new" // new , clean, dirty.
    }
  };
  WORK.prototype.save = function (aWORK, aCallback) {
    comSave(aWORK, 'WORK', aCallback);
  };
  WORK.prototype.getBy = function (aWhere, aCallback) {
    comGetBy('WORK', aWhere, aCallback)
  };
  WORK.prototype.getByUUID = function (aUUID, aCallback) {
    comGetBy("WORK", " where UUID='" + aUUID + "'", aCallback);
  };
  WORK.prototype.delete = function(aUUID, aCallBack){
    gdb.run("delete WORK where UUID = '?'", aUUID, function (err, row) {
      if (err) {  console.log("delete WORK Error: " + err.message);   }
      aCallback(err, row);
    });
  }
}

function MSG() {
  MSG.prototype.new = function () {
    var l_fmtDatetime = getDateTime(new Date());
    return {
      UUID: gUid.v1(),
      CREATETIME: l_fmtDatetime,
      OWNER: "",
      MSG:"",
      TARGET:"",
      OVER:"",
      VALIDATE:"",
      _exState: "new" // new , clean, dirty.
    }
  };
  MSG.prototype.save = function (aMsg, aCallback) {
    comSave(aMsg, 'MSG', aCallback);
  };
  MSG.prototype.delete = function(aUUID, aCallBack){
    gdb.run("delete MSG where UUID = '?'", aUUID, function (err, row) {
      if (err) {  console.log("delete MSG Error: " + err.message);   }
      aCallback(err, row);
    });
  }
  MSG.prototype.getBy = function (aWhere, aCallback) {
    comGetBy('MSG', aWhere, aCallback)
  };
  MSG.prototype.getByUUID = function (aUUID, aCallback) {
    comGetBy('MSG', " where UUID='" + aUUID + "'", aCallback);
  };
  MSG.prototype.getByOwner = function (aNick, aCallback) {
    comGetBy('MSG', " where Owner ='" + aNick + "'", aCallback);
  };
}

exports.User = function(){  return new USER(); }();
exports.Task = function(){  return new TASK();}();
exports.Work = function(){  return new WORK();}();
exports.Msg = function(){  return new MSG();}();
exports.runSql = runSql;
exports.close = gdb.close;
exports.directDb = gdb;


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

 node -------------------------- usage
 DB = require('./db.js')
---------------------
 u1 = DB.User.new();
 u1.NICKNAME = 'fire'
 User.save(u1, function(err, row){console.log('new save')})
 u1.EMAIL = 'FF@111.COM'
 u1._exState = 'dirty'
 User.save(u1, function(err, row){console.log('update save')})
 User.getBy("where UUID='" + u1.UUID + "'" , function(er,ret){u2=ret;})
 User.getByNickName("fire", function(er,ret){u2=ret});
 if (u2.length > 0) { ok ; }
-------------
 DB.Work.getBy("",  function(err, row){ gRtn = row })
 w1 = DB.Work.new();
 DB.Work.save(w1,  function(err, row){console.log('new save')})
 w2 = DB.Work.new();
 DB.Work.save(w2,  function(err, row){console.log('new save')})
 DB.Work.getByUUID(w2.UUID, function(err, row){ gRtn = row })
 for (var i in gRtn[0]) { console.log(gRtn[0][i] == w2[i]); }
-------------------------------------------
t1 = DB.Task.new();
t2 = DB.Task.new();
t3 = DB.Task.new();
t2.UPTASK = t1.UUID;
t3.UPTASK = t1.UUID;
t21 = DB.Task.new();
t22 = DB.Task.new();
t21.UPTASK = t2.UUID;
t22.UPTASK = t2.UUID;
DB.Task.save(t1,  function(err, row){console.log('new save')});
DB.Task.save(t2,  function(err, row){console.log('new save')});
DB.Task.save(t3,  function(err, row){console.log('new save')});
DB.Task.save(t21,  function(err, row){console.log('new save')});
DB.Task.save(t22,  function(err, row){console.log('new save')});
DB.Task.getBy("",  function(err, row){ gRtn = row })
gRoot = { UUID: t1.UUID };
DB.Task.getChildren(gRoot, function(err, row){console.log('show children')});
sql = "SELECT * FROM Task where UPTASK='" + gRoot.UUID + "'"
DB.runSql(sql, function(err, row){ gtt = row })
--------------------------------------------------------
============================================================
 var sqlite3 = require('sqlite3');
 var gdb = new sqlite3.Database('exman.db');
 db = require('./db.js');
 u1 = db.WORK.new

 gdb.get("select * from WORK ", function(err,rtn){gRtn = rtn} );
 生成对象的语句：
 this.xxx = xxx
 for (var i in gRtn) { console.log("this." + i + " = '' ;" ) ;}

 var u2;
 aCallback = function(err, row){u2 = row};
 u1.get("where UUID='" + u1.UUID + "'" , function(er,ret){u2=ret;})

 var str = JSON.stringify(u2);
 var obj2 = JSON.parse(str);
 *

 };
*/
