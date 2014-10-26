/**
 * Created by blaczom@gmail on 2014/10/26.
 */

angular.module('exFactory').
  factory('exLocal', ['$q', '$window', function($q, $window){

    var gdb =  $window.openDatabase("exManClient", '1.0', 'exman clientdb', 2000000);
    var gDebug = false;
    var grtn = '';
    function runSql(aSql, aParam)
    {
      gdb.transaction( function(tx) {
        tx.executeSql(aSql, aParam, function(tx,result){ if (gDebug) console.log('成功'); grtn=result },
          function(tx, error){ if (gDebug) console.log('失败:' + error.message); grtn=error; }
        )
      })
    }


    var genSave = function (aObj, aTable) {    // aOption: include:"col1,col2,"
      if (!aObj._exState) {
        console.log(aObj + " not a db object.");
        return ""
      }

      var l_cols = [];
      var l_vals = [], l_quest4vals=[], l_pristine = [];
      for (var i in aObj) {
        // 列名， i， 值 aObj[i]. 全部转化为string。
        var l_first = i[0];
        if (l_first != '_' && l_first == l_first.toUpperCase() ) { // 第一个字母_并且是大写。
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
              console.log("--dbhelp.js don't now what it is-" + i + ":" + aObj[i] + ":" + typeof(lsTmp));
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
        case "new": // db.run("INSERT INTO foo() VALUES (?)", [1,2,3], function() {
//      ls_sql = "insert into " + aTable + '(' + l_cols.join(',') + ") values ( " + l_vals.join(',') + ')';
          ls_sql = "insert into " + aTable + '(' + l_cols.join(',') + ") values ( " + l_quest4vals.join(',') + ')';
          break;
        case "dirty": // update table set col1=val, col2="", where uuid = "";
          var lt = [];
//      for (i = 0 ; i < l_cols.length; i ++) lt.push(l_cols[i] + "=" + l_vals[i] );
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
    var comSave = function(aTarget, aTable, aCallback) {
      try {
        // ls_sql = dbHelp.genSave(aTarget, aTable);  保存对象到数据库中。
        l_gen = dbHelp.genSave(aTarget, aTable);  // 返回一个数组，sql和后续参数。
        if (_debugDb) logInfo("com save run here with param: ")
        if (_debugDb) console.log(l_gen);
        gdb.run(l_gen[0], l_gen[1], function (err, row) {
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
    var setDirty = function(aParm) { aParm._exState = 'dirty' };
    var setNew = function(aParm) { aParm._exState = 'new' };
    var setClean = function(aParm) { aParm._exState = 'clean' };
    var initDb = function(){
      if (!true) {
        logInfo("---no databse file. will create it.---");
        var l_run = [];
        l_run.push("CREATE TABLE if not exists USER(NICKNAME NVARCHAR2(32) NOT NULL PRIMARY KEY, " +
          " PASS CHAR(32) NOT NULL, REMPASS BOOLEAN, MOBILE NVARCHAR2(20), EMAIL NVARCHAR2(80), IDCARD NVARCHAR2(32), " +
          " UPUSER NVARCHAR2(32), LEVEL INTEGER, GRANT INTEGER, SYNC BOOLEAN);");
        l_run.push("CREATE TABLE if not exists TASK(UUID CHAR(32) NOT NULL PRIMARY KEY, UPTASK CHAR(32), PLANSTART DATETIME, " +
          " PLANFINISH DATETIME, FINISH DATETIME, STATE NCHAR(2), OWNER NVARCHAR2(32), OUGHT NVARCHAR2(6000), " +
          " PRIVATE BOOLEAN, CONTENT NVARCHAR2(6000), SYNC BOOLEAN ) ;");
        l_run.push("CREATE INDEX if not exists [idx_task_state] ON [TASK] ([STATE] ASC);");
        l_run.push("CREATE INDEX if not exists [idx_task_owner] ON [TASK] ([OWNER] ASC);");
        l_run.push("CREATE INDEX if not exists [idx_task_start] ON [TASK] ([PLANFINISH] DESC);");
        l_run.push("update createUser set grant = level + 20000");
        l_run.push("CREATE TABLE if not exists WORK(UUID CHAR(32) NOT NULL PRIMARY KEY, UPTASK CHAR(32), CREATETIME DATETIME,  " +
          " LASTMODIFY DATETIME, OWNER NVARCHAR2(32), PRIVATE BOOLEAN, LEVEL INTEGER, CONTENT NVARCHAR2(6000) ,MEMPOINT NVARCHAR2(20), " +
          " MEMEN BOOLEAN, MEMTIMER DATETIME, STATE NCHAR(2), SYNC BOOLEAN);");
        l_run.push("CREATE INDEX if not exists [idx_work_start] ON [WORK] ([LASTMODIFY] DESC);");
        l_run.push("CREATE INDEX if not exists [idx_work_owner] ON [WORK] ([OWNER] ASC);");
        l_run.push("CREATE INDEX if not exists [idx_work_state] ON [WORK] ([STATE] ASC);");
        l_run.push("CREATE TABLE if not exists CREATEUSER(UUID CHAR(32) NOT NULL PRIMARY KEY, LEVEL INTEGER, GRANT INTEGER);");
      };

      gdb.transaction(
        function(tx) {
          for (var i in l_run) {
            var lvar = l_run[i];
            tx.executeSql(lvar, [], function(tx,success){  },
              function(tx,err){ console.log(err.message) }
            );
          };
          tx.executeSql("select count(*) from user ", [], function(tx,success){ console.log("over"); grtn2 = success; },
            function(tx,err){ console.log(err.message) }
          );
        },
        function(tx, err){ console.log('fail!!! create database failed!'); grtn=err; },
        function(tx, succ){console.log('create dabase success'); grtn=succ;}
      );
      console.log(grtn2);
      var test = []

      for (var i = 1; i< 100000; i++) {l_run.push("insert into createUser values (" + i+1000000000 + ",2,3)") }

      runSql("update createUser set grant = level + 20000 ");

    };
    var USER = function() {
      this.NICKNAME = '';
      this.PASS = '';
      this.REMPASS = '';
      this.MOBILE = '';
      this.EMAIL = '';
      this.IDCARD = '';
      this.UPUSER = '';
      this.LEVEL = '';
      this.GRANT = '';
      this.SYNC = '';
      this._exState = "new",  // new , clean, dirty.
        this._exDataSet = {}    // 扩展用。日后可以用于前台的数据更新判断. new buffer, old buffer.

      USER.prototype.new = function(){
        return new USER();
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
      USER.prototype.getByNickName = function (aNick, aCallback) {
        allSql("select * from user where NICKNAME= ?" , aNick, aCallback);
      }
    };
    var TASK = function() {
      this.UUID = '';
      this.UPTASK = '';
      this.PLANSTART = '';
      this.PLANFINISH = '';
      this.FINISH = '';
      this.STATE = '';
      this.OWNER = '';
      this.OUGHT = '';
      this.PRIVATE = '';
      this.CONTENT = '';
      this.SYNC = '';
      this._exState='';

      TASK.prototype.save = function (aTask, aCallback) {
        comSave(aTask, 'TASK', aCallback);
      };
      TASK.prototype.delete = function(aUUID, aCallBack){
        gdb.run("delete from TASK where UUID = ?", aUUID, function (err, row) {
          if (err) {  console.log("delete task Error: " + err.message);   }
          aCallBack(err, row);
        });
      }
      TASK.prototype.getByUUID = function (aUUID, aCallback) {
        allSql("select * from task where UUID=?", aUUID ,aCallback);
      };
      TASK.prototype.getChildren = function (rootTask, aCallback) {
        var statckCallback = [];
        allSql("SELECT * FROM Task where UPTASK=?",rootTask.UUID,function(err, row){
          rootTask.subTask = [];
          if (row.length > 0) {
            nextTask(rootTask.subTask, row, 0, aCallback); // 就调用一次over。
          }
          else
          { aCallback(null,rootTask); }
        });
        function nextTask(aParent, aRow, aI, aCallFin)  // aRow, 是一个数组。aI作为索引。 alen作为结束判断。
        {
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
    };
    var WORK = function() {
      this.UUID = '';
      this.UPTASK = '';
      this.CREATETIME = '';
      this.LASTMODIFY = '';
      this.OWNER = '';
      this.PRIVATE = '';
      this.LEVEL = '';
      this.CONTENT = '';
      this.MEMPOINT = '';
      this.MEMEN = '';
      this.MEMTIMER = '';
      this.STATE = '';
      this.SYNC = '';
      this._exState='';

      WORK.prototype.save = function (aWORK, aCallback) {
        comSave(aWORK, 'WORK', aCallback);
      };
      WORK.prototype.getByUUID = function (aUUID, aCallback) {
        allSql("select * from work where UUID=?", aUUID, aCallback);
      };
      WORK.prototype.delete = function(aUUID, aCallback){
        gdb.run("delete from WORK where UUID = ?", aUUID, aCallback);
      }
    };
    var exQ = { // exQ.runSql('xxxx sql').then(funcSuccess(row), funcErr(err)).fail(function(err){console.error(err);});
      runSql: function (aSql, aParam) {
        if (_debugDb) logInfo("db.exQ.runsql " + aSql);
        if (_debugDb) logInfo(aParam);
        var deferred = $q.defer();
        gdb.run(aSql, aParam, function (err, row) {
          if (err) deferred.reject(err) // rejects the promise with `er` as the reason
          else deferred.resolve(row) // fulfills the promise with `data` as the value
        });
        return deferred.promise;
      },
      allSql: function (aSql, aParam) {
        if (_debugDb) logInfo("db.exQ.runsql " + aSql);
        if (_debugDb) logInfo(aParam);
        var deferred = $q.defer();
        gdb.all(aSql, aParam, function (err, row) {
          if (err) deferred.reject(err) // rejects the promise with `er` as the reason
          else deferred.resolve(row) // fulfills the promise with `data` as the value
        });
        return deferred.promise;
      }
    };

    var rest = {
      router: function(req, res) {
        console.log("get client rest: " + JSON.stringify(req.body));
        var lFunc = req.body['func']; // 'userlogin',req.body['txtUserName'],
        var lExparm = req.body['ex_parm'];
        if ("userlogin,userReg,".indexOf(lFunc + ",") < 0) {
          if (!checkLogin(req, res)) {
            var l_rtn = rtnErr('未登录，请先登录。');
            l_rtn.rtnCode = 0;
            l_rtn.appendOper = 'login';   // rtnCode = 0的时候，就是有附加操作的时候。
            res.json(l_rtn);
            return
          }
        }
        switch (lFunc) {
          case 'userChange':
          { // no user anymore, will change to change password. //
            var userName = lExparm.regUser.NICKNAME,
              userPwd = lExparm.regUser.PASS;
            md5Pass = lExparm.regUser.md5Pass; //var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');

            appDb.User.getByNickName(userName, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                if (aRtn.length > 0) {      // 存在了。
                  l_user = aRtn[0];
                  if (lExparm.regUser.oldPass == l_user.PASS) {
                    l_user.PASS = md5Pass;
                    l_user.MOBILE = lExparm.regUser.MOBILE;
                    l_user.EMAIL = lExparm.regUser.EMAIL;
                    l_user.IDCARD = lExparm.regUser.IDCARD;
                    l_user._exState = 'dirty';
                    appDb.User.save(l_user, function (aErr, aRtn) {
                      if (aErr)  res.json(rtnErr("创建失败。请通知管理员"));
                      else  res.json(rtnMsg("更改成功。"));
                    });
                  }
                  else
                    res.json(rtnMsg('原密码错误。'));
                }
                else {
                  res.json(rtnMsg('imposible error ... 用户不存在了。。。'));
                }
              }

            });
            break;
          }
          case "userlogin":
          { // lExparm.txtUserName, lExparm.txtUserPwd
            var userName = lExparm.txtUserName, userPwd = lExparm.txtUserPwd, userRem = lExparm.remPass;
            appDb.User.getByNickName(userName, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                if (aRtn.length > 0) {
                  var xtmp = userName + userPwd
                  var md5UserPwd = userPwd; // crypto.createHash('md5').update(xtmp).digest('hex'); 客户端已经搞定了。
                  if (aRtn[0].PASS == md5UserPwd) {
                    req.session.loginUser = userName;
                    req.session.userLevel = aRtn[0].LEVEL;
                    req.session.userGrant = aRtn[0].GRANT;
                    res.json(rtnMsg('登录成功。'));
                  }
                  else {
                    res.json(rtnErr('密码有误'));
                  }
                }
                else {
                  res.json(rtnErr('用户不存在'));
                }
              }
            });
            break;
          }
          case "userReg":
          { // lExparm = {regUser: lp.user, authCode:lp.user.authCode   }
            var userName = lExparm.regUser.NICKNAME,
              userPwd = lExparm.regUser.PASS;
            authCod = lExparm.regUser.authCode;
            md5Pass = lExparm.regUser.md5Pass; //var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');
            appDb.User.getByNickName(userName, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                if (aRtn.length > 0) {      // 存在了。
                  res.json(rtnMsg('用户已经存在。'));
                }
                else {
                  // 根据授权码判断授权是否可以。然后创建新用户，然后删除授权码，然后提交事物。
                  appDb.Q.allSql("select * from createUser where uuid = '" + authCod + "'")
                    .then(function (aRow) {
                      if ((aRow || []).length > 0) {
                        userAdd = appDb.User.new();
                        userAdd.NICKNAME = userName;
                        userAdd.PASS = md5Pass;
                        userAdd.LEVEL = aRow[0].LEVEL;
                        userAdd.GRANT = aRow[0].GRANT;
                        appDb.directDb.serialize(function () {
                          try {
                            appDb.directDb.exec('BEGIN TRANSACTION');
                            appDb.directDb.run("delete from createUser where uuid = '" + authCod + "'");
                            appDb.User.save(userAdd, function (aErr, aRtn) {
                              if (aErr) {
                                appDb.directDb.exec('rollback');
                                res.json(rtnErr("创建失败。请通知管理员"));
                              }
                              else {
                                appDb.directDb.exec('commit');
                                res.json(rtnMsg("创建成功，请登录"));
                              }
                            });
                          }
                          catch (e) {
                            console.log(e);
                          }
                        });
                      }
                      else
                        res.json(rtnMsg('授权码错误。'));
                    })
                    .fail(function () {
                      res.json(rtnMsg('错误：' + arguments))
                    });
                }
              }
            });
            break;
          }
          case 'taskListGet':
          {
            var la_where = [], la_param = [];
            if (lExparm.filter.seekContentFlag) {
              la_where.push(" content like '%'||?||'%' ");   // 这个语法要命。。。
              la_param.push(lExparm.filter.seekContent);
            }
            if (lExparm.filter.seekStateFlag) la_where.push(" state in ('" + lExparm.filter.seekState.join("','") + "') ");
            /*if (lExparm.filter.seekStateFlag) {
             la_where.push(" state in ? ");
             la_param.push(lExparm.filter.seekState);
             }*/

            if (lExparm.filter.seekUserFlag) {
              var ls_append = "";
              if (req.session.loginUser != lExparm.filter.seekUser) // 当前用户就是查询的用户。可以显示私有任务，否则不显示私有任务。
                ls_append = " and private!=1 ";
              la_where.push(" (owner = '" + lExparm.filter.seekUser + "' or ought like '%" + lExparm.filter.seekUser + ",%')" + ls_append);
            }
            if (lExparm.filter.seekTop)       /////////////////// 梯次任务列表
              la_where.push(" uptask = '' ");

            var ls_where = "";
            if (la_where.length > 0)
              ls_where = " where " + la_where.join(" and ");
            console.log("taskListGet sql where with param : " + ls_where);
            console.log(la_param);
            getSubList("select distinct * from task " + ls_where + " order by PLANSTART limit " +
              lExparm.locate.limit + " offset " + lExparm.locate.curOffset, la_param, lExparm.filter.seekTop, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn;
                res.json(ls_rtn);
              }
            });
            break;
          }
          case 'taskEditSave':
          {// lExparm.msgObj
            lExparm.msgObj.OWNER = req.session.loginUser;
            appDb.Task.save(lExparm.msgObj, function (aErr, aRtn) {
              if (aErr) {
                res.json(rtnErr(aErr))
              }
              else {
                res.json(rtnMsg("更新成功."));
              }
            });
            break;
          }
          case 'taskEditDelete':
          {
            if (lExparm.msgObj.OWNER == req.session.loginUser) {
              appDb.Task.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
                if (aErr) {
                  res.json(rtnErr(aErr))
                }
                else {
                  res.json(rtnMsg("删除成功."));
                }
              });
            }
            else {
              res.json(rtnErr("不能删除别人的任务。."));
            }
            break;
          }
          case 'userGetAll':
          { // lExparm.msgObj
            appDb.comAllBy(" select NICKNAME from user  order by NICKNAME ", [], function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                res.json(ls_rtn);
              }
            });
            break;
          }
          case 'userGet':
          { // lExparm.msgObj
            appDb.allSql("select * from user where NICKNAME = ? ", lExparm.userName, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                res.json(ls_rtn);
              }
            });
            break;
          }
          case 'workListGet':
          {
            /* ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset, filter:{seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
             seekStateFlag: lp.seekStateFlag , seekState: lp.seekState, seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser   }}*/
            var ls_memen = " (owner = '" + req.session.loginUser + "' and memen = 1 and memtimer < '" + appDb.getDateTime(new Date(), true) + "') ";

            var la_where = [], la_param = [];
            if (lExparm.filter.seekContentFlag) {
              la_where.push(" content like '%'||?||'%' ");   // 这个语法要命。。。
              la_param.push(lExparm.filter.seekContent);
            }
            if (lExparm.filter.seekStateFlag) la_where.push(" state in ('" + lExparm.filter.seekState.join("','") + "') ");
            if (lExparm.filter.seekUserFlag) {  // req.session.userLevel = aRtn[0].LEVEL;
              if (req.session.loginUser == lExparm.filter.seekUser) // 当前用户就是查询的用户。可以显示私有工作，否则不显示私有工作。
                la_where.push("( owner = '" + req.session.loginUser + "') ");
              else
                la_where.push(" (owner = '" + lExparm.filter.seekUser + "' and private != 1 and level <= " + req.session.userGrant + ")) ");
            }
            else // 没选则用户，就是要查找所有的用户。
              la_where.push("((owner = '" + req.session.loginUser + "') or (owner != '" + req.session.loginUser +
                "' and private != 1 and level <= " + req.session.userGrant + "))");
            if (lExparm.filter.seekTaskFlag) {
              la_where.push(" uptask = '" + lExparm.filter.seekTaskUUID + "'");
            }
            var ls_where = "";
            ls_where = " where " + ls_memen; // memen是必须选的。
            if (la_where.length > 0)
              ls_where = ls_where + ' or (' + la_where.join(" and ") + ")";
            appDb.comAllBy("select distinct * from work " + ls_where +
              " order by memen , CREATETIME limit " + lExparm.locate.limit + " offset " + lExparm.locate.curOffset, la_param, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                res.json(ls_rtn);
              }
            });
            break;
          }
          case 'taskAllGet':
          {
            getSubList("select * from task  where uptask=? order by PLANSTART ", lExparm.taskUUID, true, function (aErr, aRtn) {
              if (aErr) res.json(rtnErr(aErr));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn;
                res.json(ls_rtn);
              }
            });
            break;
          }
          case 'workEditDelete':
          {  // lExparm.msgObj
            if (lExparm.msgObj.OWNER == req.session.loginUser) {
              appDb.Work.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
                if (aErr) {
                  res.json(rtnErr(aErr))
                }
                else {
                  res.json(rtnMsg("删除成功."));
                }
              });
            }
            else {
              res.json(rtnErr("不能删除别人的任务。."));
            }
            break;
          }
          case 'workEditSave':
          {  // lExparm.msgObj
            lExparm.msgObj.OWNER = req.session.loginUser;
            appDb.Work.save(lExparm.msgObj, function (aErr, aRtn) {
              if (aErr) {
                res.json(rtnErr(aErr))
              }
              else {
                res.json(rtnMsg("更新成功."));
              }
            });
            break;
          }
          case "mainList":
            break;
          default :
            res.json(rtnErr('不存在该请求：' + JSON.stringify(req.body)));
            break;
        }
      }
    };

    return {
      initDb: initDb
    }

  }]);

