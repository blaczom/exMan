/**
 * Created by donghai on 2014/9/20.
 */

var sqlite3 = require('sqlite3');
var ex = require('./exUtil.js');
var fs = require('fs');
var Q = require('q');
var gdbFile = 'exman.db'; // if exist exman.db, means the sql ddl have been execute.

var logInfo = ex.info;
var logErr = ex.err;

if (!fs.existsSync(gdbFile)){
  logInfo("---no databse file. will create it:---", gdbFile);
  var l_run = [];
  l_run.push( "CREATE TABLE if not exists USER(NICKNAME NVARCHAR2(32) NOT NULL PRIMARY KEY, " +
    " PASS CHAR(32) NOT NULL, REMPASS BOOLEAN, MOBILE NVARCHAR2(20), EMAIL NVARCHAR2(80), IDCARD NVARCHAR2(32), " +
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
  /* 按照1,2,4,7,15,60来提醒学习。 MEMPOINT 下一个的提醒： 1，2，4，5，15，60。  " +
   " MEMEN BOOLEAN 显示是否是记忆的需求，去掉就不再提示。MEMTIMER DATETIME:  2014-2-2 如果用户点击完了，记忆完毕：删除掉当前的记忆point，增加一个新的提醒日期
   memen == true and memtimer < now。这是触发的一个条件。然后记忆后，pop提取mempoint的下一个节点数字。生成新的日期，写入到memtimer。
   */

  l_run.push("CREATE TABLE if not exists CREATEUSER(UUID CHAR(32) NOT NULL PRIMARY KEY, LEVEL INTEGER, " +
    " GRANT INTEGER, UPUSER NVARCHAR2(32)) WITHOUT ROWID;");

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
        if (err) logErr(" 初始化创建数据库错误: ",err.message,l_run[i]);
      });
    }
  });
}

var genSave = function (aObj, aTable) {    //  列名必须大写。第一字母小写的不生成。 返回sql和 执行参数。
  if (!aObj._exState) {
    logInfo("dbsqlite3 genSave get a wrong db object." + aObj);
    return [null, null];
  }
  var l_cols = [], l_vals = [], l_quest4vals=[],  l_pristine = [];
  for (var i in aObj) {    // 列名， i， 值 aObj[i]. 全部转化为string。
    var l_first = i[0];
    if (l_first != '_' && l_first!='$' && l_first == l_first.toUpperCase() ) { // 第一个字母_并且是大写。
      var lsTmp = (aObj[i]==null) ? "" : aObj[i];
      switch (typeof(lsTmp)) {
        case "string": case "boolean":case "object":
        l_cols.push(i);
        l_vals.push("'" + lsTmp + "'");
        l_quest4vals.push("?");
        l_pristine.push(lsTmp);
        break;
        case "number":
          l_cols.push(i);
          l_vals.push(lsTmp);
          l_quest4vals.push('?');
          l_pristine.push(lsTmp);
          break;
        case "function":
          break;
        default:
          logInfo("-- genSave don't now what it is-" + i + ":" + aObj[i] + ":" + typeof(lsTmp));
          process.exit(-100);
          l_cols.push(i);
          l_vals.push(aObj[i].toString());
          l_quest4vals.push('?');
          l_pristine.push(lsTmp);
          break;
      }
    }
  }
  var l_sql="";
  switch (aObj._exState) {
    case "new": // "INSERT INTO foo() VALUES (?)", [1,2,3]
      ls_sql = "insert into " + aTable + '(' + l_cols.join(',') + ") values ( " + l_quest4vals.join(',') + ')';
      break;
    case "dirty": // update table set col1=val, col2="", where uuid = "";
      var lt = [];
      for (i = 0 ; i < l_cols.length; i ++) lt.push(l_cols[i] + "=" + l_quest4vals[i] );
      if ('USER,'.indexOf(aTable.toUpperCase()) >= 0 )
        ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where NICKNAME = '" + aObj['NICKNAME'] +"'";
      else
        ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where uuid = '" + aObj['UUID'] +"'";
      break;
    default : // do nothing.
      ls_sql = "";
  }
  return [ls_sql, l_pristine];   // 返回一个数组。前面是语句，后面是参数。f
};
var runSql = function (aSql, aParam,  aCallback){
  logInfo("db runSql with param ", aSql, aParam);
  if (aParam) {if (toString.apply(aParam) !== "[object Array]") aParam = [aParam];} else aParam = [];
  gdb.all(aSql, aParam, function (err, row){
    if (err) logErr("runSql",err,aSql,aParam);
    if (aCallback) aCallback(err, row);
  } );
};
var runSqlPromise = function (aSql, aParam) {
  logInfo("db runSqlPromise with param ", aSql, aParam);
  if (aParam) {if (toString.apply(aParam) !== "[object Array]") aParam = [aParam];} else aParam = [];
  var deferred = Q.defer();
  gdb.all(aSql, aParam, function (err, row) {
    if (err) {if (err) logErr("runSqlPromise",err,aSql,aParam);deferred.reject(err);} else deferred.resolve(row);
  });
  return deferred.promise;
};
var comSave = function(aTarget, aTable, aCallback) {
  try {   // ls_sql = dbHelp.genSave(aTarget, aTable);  保存对象到数据库中。
    l_gen = genSave(aTarget, aTable);  // 返回一个数组，sql和后续参数。
    logInfo("com save run here with param: ", aTarget, aTable, l_gen);
    runSql(l_gen[0], l_gen[1], function (err, row) {
      aCallback(err, row);
    });
  }
  catch (err) {
    logErr('comSave catch a error: ',err);
    if (aCallback) aCallback(err, err);
  }
};

var helpUser = {
  save:function (aUser, aCallback){ comSave(aUser, 'USER', aCallback); },
  delete : function(aNickName, aCallback){
    runSql("delete from USER where NICKNAME = ?", aNickName, aCallback); } ,
  getByNickName:function(aNickName, aCallback) {
    runSql("select * from user where NICKNAME= ?" , aNickName, aCallback);
  }
};
var helpTask = {
  save: function (aTask, aCallback) {    comSave(aTask, 'TASK', aCallback);  },
  delete: function (aUUID, aCallBack) {
    runSql("delete from TASK where UUID = ?", aUUID, aCallBack);  },
  getByUUID : function (aUUID, aCallback) { runSql("select * from task where UUID=?", aUUID, aCallback); },
  getChildren: function (rootTask, aCallback) {
    var statckCallback = [];
    function nextTask(aParent, aRow, aI, aCallFin)  // aRow, 是一个数组。aI作为索引。 alen作为结束判断。
    {
      if (aI < aRow.length) {
        aRow[aI].subTask = [];
        aParent.push(aRow[aI]);
        runSql("SELECT * FROM Task where UPTASK='" + aRow[aI].UUID + "'", function (err, row) {
          if (row.length > 0) {
            statckCallback.push({a: aParent, b: aRow, c: (aI + 1), d: aCallback });
            nextTask(aRow[aI].subTask, row, 0, aCallback);
          }
          else nextTask(aParent, aRow, ++aI, aCallback);//  console.log('没孩子的对象：');
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
    runSql("SELECT * FROM Task where UPTASK=?", rootTask.UUID, function (err, row) {
      rootTask.subTask = [];
      if (row.length > 0) nextTask(rootTask.subTask, row, 0, aCallback); // 就调用一次over。
      else aCallback(null, rootTask);
    });

  }

};
var helpWork = {
  save : function (aWORK, aCallback) {  comSave(aWORK, 'WORK', aCallback); },
  getByUUID : function (aUUID, aCallback) { runSql("select * from work where UUID=?", aUUID, aCallback); },
  delete : function(aUUID, aCallback){ runSql("delete from WORK where UUID = ?", aUUID, aCallback); }
};

exports.helpTask = helpTask;
exports.helpUser = helpUser;
exports.helpWork = helpWork;
exports.runSql = runSql;
exports.runSqlPromise = runSqlPromise;
exports.gdb = gdb;
exports.genSave = genSave;
exports.genModel = function(aOpt) {
  if (aOpt)
    var ls_pre = "", ls_sep = ":", ls_end = "'',";
  else
    var ls_pre = "this.", ls_sep = "=", ls_end = "'';";
  gdb.get("select * from WORK ", function(err,rtn) {
    console.log('-------WORK--------');
    for (var i in rtn) {
      console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
    }
    gdb.get("select * from TASK ", function (err, rtn) {
      console.log('-------TASK--------');
      for (var i in rtn) {
        console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
      }
      console.log('-------USER--------');
      gdb.get("select * from user ", function (err, rtn) {
        for (var i in rtn) {
          console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
        }
      })
    })
  })
};