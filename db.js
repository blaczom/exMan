/**
 * Created by donghai on 2014/9/20.
 */

var gUid = require('uuid');
var sqlite3 = require('sqlite3');
var gdbFile = 'exman.db'; // if exist exman.db, means the sql ddl have been execute.
var fs = require('fs');
var dbHelp = require('./dbhelp.js');
var Q = require('q');

var logInfo = function()
{
  for (var i in arguments)console.log(arguments[i]);
}

if (!fs.existsSync(gdbFile))
{
  logInfo("---no databse file. will create it.---");
  var l_run = [];
  l_run.push( "CREATE TABLE if not exists USER(NICKNAME NVARCHAR2(32) NOT NULL PRIMARY KEY, " +
    " PASS CHAR(32) NOT NULL, REMPASS BOOL, MOBILE NVARCHAR2(20), EMAIL NVARCHAR2(80), IDCARD NVARCHAR2(32), " +
    " UPUSER NVARCHAR2(32), LEVEL INTEGER, GRANT INTEGER, SYNC BOOLEAN  ) WITHOUT ROWID;"   );

  l_run.push("CREATE TABLE if not exists TASK(UUID CHAR(32) NOT NULL PRIMARY KEY, UPTASK CHAR(32), PLANSTART DATETIME, " +
    " PLANFINISH DATETIME, FINISH DATETIME, STATE NCHAR(2), OWNER NVARCHAR2(32), OUGHT NVARCHAR2(6000), " +
    " PRIVATE BOOLEAN, CONTENT NVARCHAR2(6000), SYNC BOOLEAN ) WITHOUT ROWID;");
  l_run.push("CREATE INDEX if not exists [idx_task_state] ON [TASK] ([STATE] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_owner] ON [TASK] ([OWNER] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_start] ON [TASK] ([PLANFINISH] DESC);");

  l_run.push("CREATE TABLE if not exists WORK(UUID CHAR(32) NOT NULL PRIMARY KEY, UPTASK CHAR(32), CREATETIME DATETIME,  " +
    " LASTMODIFY DATETIME, OWNER NVARCHAR2(32), PRIVATE BOOLEAN, LEVEL INTEGER, CONTENT NVARCHAR2(6000) ,MEMPOINT NVARCHAR2(20), " +
    " MEMEN BOOLEAN, MEMTIMER DATETIME, STATE NCHAR(2), SYNC BOOLEAN) WITHOUT ROWID;");
  l_run.push("CREATE INDEX if not exists [idx_work_start] ON [WORK] ([LASTMODIFY] DESC);");
  l_run.push("CREATE INDEX if not exists [idx_work_owner] ON [WORK] ([OWNER] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_work_state] ON [WORK] ([STATE] ASC);");
  /* 按照1,2,4,7,15,60来提醒学习。 */
  /*
  我的任务： plan和doing的，owner、ought有我的。列表。已完成不再列出。 点击task，列出下面的所有worklog(level权限。)
  新建任务。（可以是根），选人的时候，只能选择myman。
  任务全览。回头搞。
  日志查询。查询状态、内容。按照owner。和level查询。leve能够查询同等级的。
  user管理。，myman选项，自动列出自己的所有员工。user查询，查看他的task。和worklog（根据权限。）
  */
  var l_init = true;
}

var gdb = new sqlite3.Database(gdbFile);

if (l_init) {
  gdb.serialize(function() {
    for (var i in l_run) {
      gdb.run(l_run[i], function (err, row) {
        if (err)  logInfo("run Error: " + err.message + " " + l_run[i]);
      });
    }
  });
}

var reConnect = function(){
  if (!gdb)  gdb = new sqlite3.Database(gdbFile);  // 时间长了可能会自动断掉?
};

var getDateTime = function (aTime, aOnlyDate){
  // 向后一天，用 new Date( new Date() - 0 + 1*86400000) // 向后一小时，用 new Date( new Date() - 0 + 1*3600000)
  var l_date = new Array(aTime.getFullYear(), aTime.getMonth() < 9 ? '0' + (aTime.getMonth() + 1) : (aTime.getMonth()+1), aTime.getDate() < 10 ? '0' + aTime.getDate() : aTime.getDate());
  var l_time = new Array(aTime.getHours() < 10 ? '0' + aTime.getHours() : aTime.getHours(), aTime.getMinutes() < 10 ? '0' + aTime.getMinutes() : aTime.getMinutes(), aTime.getSeconds() < 10 ? '0' + aTime.getSeconds() : aTime.getSeconds());
  if (aOnlyDate)
    return( l_date.join('-')) ; // '2014-01-02'
  else
    return( l_date.join('-') + ' ' + l_time.join(':')); // '2014-01-02 09:33:33'
}

var runSql = function (aSql, aCallback){
  logInfo("db.js runsql " + aSql);
  gdb.run(aSql, function (err, row){
    if (err) logInfo("runSql Error: " + err.message);
    aCallback(err, row);
  } );
};

var allSql = function(aSql, aCallback){
  logInfo("db.js allSql " + aSql);
  gdb.all(aSql, function (err, row) {
    if (err) logInfo(".all Error: " + err.message);
    aCallback(err, row);
  });
}

var exQ ={}; // exQ.runSql('xxxx sql').then(funcSuccess(row), funcErr(err)).fail(function(err){console.error(err);});
var t1 = gdb.all
exQ.runSql = Q.denodeify(gdb["run"]);
exQ.allSql = Q.denodeify(t1);

var funcErr = function(err) { logInfo('-- funcErr --' + err.toString()) }

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
function comAllBy(aCol, aTable, aWhere,  aCallback) {
  try {
    var ls_sql = "SELECT " + aCol + " FROM  " + aTable + ' ' + aWhere;
    console.log("comAllBy " + ls_sql);
    gdb.all(ls_sql, function (err, row) {
      if (err) {
        console.log(aTable + ".all Error: " + err.message);
      }
      else {
        if(row){
        for (var i in row) {
          row[i]._exState = 'clean';
        }}
        else row = [];
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
    gdb.run("delete from USER where UUID = '?'", aUUID, function (err, row) {
      if (err) {  console.log("delete user Error: " + err.message);   }
      aCallback(err, row);
    });
  };
  USER.prototype.getBy = function (aWhere, aCallback) {
    comAllBy("*", 'USER', aWhere, aCallback);
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

    gdb.run("delete from TASK where UUID = ?", aUUID, function (err, row) {
      if (err) {  console.log("delete task Error: " + err.message);   }
      aCallBack(err, row);
    });
  }
  TASK.prototype.getBy = function (aWhere, aCallback) {
    comAllBy("*", 'TASK', aWhere, aCallback);
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
    comAllBy("*", 'WORK', aWhere, aCallback)
  };
  WORK.prototype.getByUUID = function (aUUID, aCallback) {
    comAllBy("*", "WORK", " where UUID='" + aUUID + "'", aCallback);
  };
  WORK.prototype.delete = function(aUUID, aCallBack){
    gdb.run("delete from WORK where UUID = '?'", aUUID, function (err, row) {
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
    comAllBy("*", 'MSG', aWhere, aCallback)
  };
  MSG.prototype.getByUUID = function (aUUID, aCallback) {
    comAllBy("*", 'MSG', " where UUID='" + aUUID + "'", aCallback);
  };
  MSG.prototype.getByOwner = function (aNick, aCallback) {
    comAllBy("*", 'MSG', " where Owner ='" + aNick + "'", aCallback);
  };
}

exports.User = function(){  return new USER(); }();
exports.Task = function(){  return new TASK();}();
exports.Work = function(){  return new WORK();}();
exports.runSql = runSql;
exports.allSql = allSql;
exports.Q = exQ;

exports.comAllBy = comAllBy;
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
*/
