/**
 * Created by blaczom@gmail on 2014/10/26.
 */

angular.module('exFactory').
factory('exLocal', ['$q', '$window', 'exDb', function($q, $window, exDb){
    var gdb =  $window.openDatabase("exManClient", '1.0', 'exman clientdb', 2000000);
    var gDebug = false;
    var initDb = function() {
        console.log("--- checking databse file ---");
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
        l_run.push("CREATE TABLE if not exists WORK(UUID CHAR(32) NOT NULL PRIMARY KEY, UPTASK CHAR(32), CREATETIME DATETIME,  " +
            " LASTMODIFY DATETIME, OWNER NVARCHAR2(32), PRIVATE BOOLEAN, LEVEL INTEGER, CONTENT NVARCHAR2(6000) ,MEMPOINT NVARCHAR2(20), " +
            " MEMEN BOOLEAN, MEMTIMER DATETIME, STATE NCHAR(2), SYNC BOOLEAN);");
        l_run.push("CREATE INDEX if not exists [idx_work_start] ON [WORK] ([LASTMODIFY] DESC);");
        l_run.push("CREATE INDEX if not exists [idx_work_owner] ON [WORK] ([OWNER] ASC);");
        l_run.push("CREATE INDEX if not exists [idx_work_state] ON [WORK] ([STATE] ASC);");
        l_run.push("CREATE TABLE if not exists CREATEUSER(UUID CHAR(32) NOT NULL PRIMARY KEY, LEVEL INTEGER, GRANT INTEGER);");
        gdb.transaction(
            function (tx) {
                for (var i in l_run) {
                    tx.executeSql(l_run[i], [],
                      function(tx,success){},
                      function(tx,err){ console.log(err.message) } );
                }
            },
            function (tx, err) {
                console.log('fail!!! create database failed!');
                console.log(err);
            },
            function () {
                console.log(' -- check dabase success over -- ');
            }
        );
    };
    initDb();
    var trans2Json = function (aData){      // 将websql的返回数据，转化为数组json记录。
      var la_item = [];
      for (var i = 0; i < aData.rows.length; i ++ )
        la_item.push(aData.rows.item(i));
      return angular.copy(la_item);
    };
    // result.rows.item
    var runSqlPromise = function (aSql, aParam)  {  // runSql("", []).then(function(aSucc){}, function(aErr){})
        if (gDebug) console.log("exLocal runsql with param: " + aSql);
        if (gDebug) console.log(aParam);
        if (toString.apply(aParam) !== "[object Array]") aParam= [aParam];
        var deferred = $q.defer();
        gdb.transaction( function(tx) {
            tx.executeSql(aSql, aParam,
                function(tx, aData) { deferred.resolve(trans2Json(aData)) },
                function(tx, error) { deferred.reject(error.message) }
            )
        });
        return deferred.promise;
    };
    var runSql = function(aSql, aParam, aCallback) {
        if (gDebug) console.log("runsql run here with param: " + aSql);
        if (gDebug) console.log(aParam);
        if (toString.apply(aParam) !== "[object Array]") aParam= [aParam];
        gdb.transaction(
            function(tx) {
                tx.executeSql(aSql, aParam
                  ,function(tx, aData){console.log("client run sql ok:", aSql, aData); aCallback(null, trans2Json(aData) ) },
                   function(tx, aErr){ console.log("client run sql err:", aErr.message); aCallback(aErr.message, null) }
                );
            }
        );
    };
    var genSave = function (aObj, aTable) {    //  列名必须大写。第一字母小写的不生成。
      if (!aObj._exState) {
        console.log("genSave get a wrong db object." + aObj);
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
    var comSave = function(aTarget, aTable, aCallback) {
        l_gen = genSave(aTarget, aTable);  // 返回一个数组，sql和后续参数。
        if (gDebug) console.log("com save run here with param: " + l_gen[0]);
        if (gDebug) console.log(l_gen[1]);
        gdb.transaction(
            function(tx) {
                tx.executeSql(l_gen[0], l_gen[1],
                    function(tx, aData){ if (gDebug) console.log("comsave success"); aCallback(null, trans2Json(aData)) },
                    function(tx, aErr){ console.log(aErr.message); aCallback(aErr.message, null) }
                );
            }
        );
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

        USER.prototype.new = function(){     return new USER();     };
        USER.prototype.save = function (aUser, aCallback){  comSave(aUser, 'USER', aCallback); };
        USER.prototype.delete = function(aUUID, aCallback){
            runSql("delete from USER where UUID = '?'", aUUID, function (err, row) {
                if (err) {  console.log("delete user Error: " + err.message);   }
                aCallback(err, row);
            });
        };
        USER.prototype.getByNickName = function (aNick, aCallback) {
            runSql("select * from user where NICKNAME= ?" , aNick, aCallback);
        }
    };
    var gUser = new USER();
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

        TASK.prototype.save = function (aTask, aCallback) {  comSave(aTask, 'TASK', aCallback); };
        TASK.prototype.delete = function(aUUID, aCallBack){
            runSql("delete from TASK where UUID = ?", aUUID, function (err, row) {
                if (err) {  console.log("delete task Error: " + err.message);   }
                aCallBack(err, row);
            });
        };
        TASK.prototype.getByUUID = function (aUUID, aCallback) {
            runSql("select * from task where UUID=?", aUUID ,aCallback);
        };
    };
    var gTask = new TASK();
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

        WORK.prototype.save=function(aWORK, aCallback){comSave(aWORK, 'WORK', aCallback); };
        WORK.prototype.getByUUID=function(aUUID,aCallback){runSql("select * from work where UUID=?",aUUID,aCallback); };
        WORK.prototype.delete=function(aUUID, aCallback){runSql("delete from WORK where UUID = ?", aUUID, aCallback); }
    };
    var gWork = new WORK();
    var rtnErr = function(aMsg, aErr) {
        return { "rtnInfo": JSON.stringify(aMsg), rtnCode: -1, "alertType": 0, error: JSON.stringify(aErr), exObj:{} }
    };
    var rtnMsg = function(aMsg) {
        return { "rtnInfo": aMsg, rtnCode: 1, "alertType": 0, error: [], exObj:{} }
    };
    function checkLogin(){
        if (req.session.loginUser) return true; else return false;  // 只信任服务器端的数据。
    }

    function getSubList(aSql, aParam, aWithSub, aCallback){  // 得到指定的任务下面的任务数量。
      runSql(aSql, aParam, function(aErr, aRtn) {
        if (aErr) aCallback(aErr);
        else {
          var l_exObj = aRtn?aRtn:[];
          if (aWithSub) {
            var stackSubQ = [];
            for (var i in l_exObj) { // 对返回的所有数据集进行处理。
              stackSubQ.push( runSqlPromise("select count(*) as SUBCOUNT, state as SUBSTATE from task where uptask='" + l_exObj[i].UUID + "' group by STATE", []) )
            }
            $q.all(stackSubQ).then(function(row2){
              var l_a = [0,0,0];
              for (var i in row2) {
                if (row2[i].length > 0 ){
                  for (var ii in row2[i]) {
                    var l_rtn = row2[i][ii]
                    switch (l_rtn.SUBSTATE) {
                      case '结束':
                        l_a[2] = l_rtn.SUBCOUNT;
                        break;
                      case '进行':
                        l_a[1] = l_rtn.SUBCOUNT;
                        break;
                      case '计划':
                        l_a[0] = l_rtn.SUBCOUNT;
                        break;
                    }
                  }
                  l_exObj[i].subTask = l_a.join('|');
                }
                else   l_exObj[i].subTask = "nosub";
              }
              aCallback(null, l_exObj);
            }, function(){ console.log(arguments);   aCallback('查询失败',null)});
          }
          else
          {
            aCallback(null, l_exObj);
          }
        }
      });
    }



    var res = {
        json : function(aRtn){ return aRtn ; }  //JSON.stringify
    };
    var req = {session : {}};
    var simuRestCall = function(aUrl, aObject, aCallback) {
      // 可以这样更改，把 aCallBack 注入到res.json函数中。
      // { func: 'userlogin',   ex_parm: { txtUserName: aobjUser.NICKNAME,... } }
        lFunc = aObject['func'];  lExparm = aObject['ex_parm'];
        if (gDebug) console.log('simulate REST call ' , lFunc, ' ', lExparm);
        if ("userlogin,userReg,exTools,".indexOf(lFunc + ",") < 0) {
          if (!checkLogin()) {
            var l_rtn = rtnErr('未登录，请先登录。');
            l_rtn.rtnCode = 0;
            l_rtn.appendOper = 'login';   // rtnCode = 0的时候，就是有附加操作的时候。
            aCallback(res.json(l_rtn));
            return ;
          }
        }
        switch (lFunc) {
          case 'userChange':
          { // no user anymore, will change to change password. //
            var userName = lExparm.regUser.NICKNAME,
              userPwd = lExparm.regUser.PASS;
            md5Pass = lExparm.regUser.md5Pass; //var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');

            gUser.getByNickName(userName, function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                if (aRtn.length > 0) {      // 存在了。
                  l_user = aRtn[0];
                  console.log(l_user);
                  if (lExparm.regUser.oldPass == l_user.PASS) {
                    l_user.PASS = md5Pass;
                    l_user.MOBILE = lExparm.regUser.MOBILE;
                    l_user.EMAIL = lExparm.regUser.EMAIL;
                    l_user.IDCARD = lExparm.regUser.IDCARD;
                    l_user._exState = 'dirty';
                    gUser.save(l_user, function (aErr, aRtn) {
                      if (aErr)  aCallback(res.json(rtnErr("创建失败。请通知管理员")));
                      else aCallback(res.json(rtnMsg("更改成功。")));
                    });
                  }
                  else
                    aCallback(res.json(rtnMsg('原密码错误。')));
                }
                else {
                  aCallback(res.json(rtnMsg('imposible error ... 用户不存在了。。。')));
                }
              }

            });
            break;
          }
          case "userlogin":
          { // lExparm.txtUserName, lExparm.txtUserPwd
            var userName = lExparm.txtUserName, userPwd = lExparm.txtUserPwd, userRem = lExparm.remPass;
            gUser.getByNickName(userName, function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                if (aRtn.length > 0) {
                  console.log('login : ', aRtn);
                  var xtmp = userName + userPwd
                  var md5UserPwd = userPwd; // crypto.createHash('md5').update(xtmp).digest('hex'); 客户端已经搞定了。
                  if (aRtn[0].PASS == md5UserPwd) {
                    req.session.loginUser = userName;
                    req.session.userLevel = aRtn[0].LEVEL;
                    req.session.userGrant = aRtn[0].GRANT;
                    aCallback(res.json(rtnMsg('登录成功。')));
                  }
                  else {
                    aCallback(res.json(rtnErr('密码有误')));
                  }
                }
                else {
                  aCallback(res.json(rtnErr('用户不存在')));
                }
              }
            });
            break;
          }
          case "userReg":    {
            var userName = lExparm.regUser.NICKNAME,
                userPwd = lExparm.regUser.PASS;
                authCod = lExparm.regUser.authCode;
                md5Pass = lExparm.regUser.md5Pass;
            gUser.getByNickName( userName,
              function (aErr, aRtn) {
                if (aErr) aCallback(res.json(rtnErr(aErr)));
                else {
                  if (aRtn.length > 0) {      // 存在了。
                    aCallback(res.json(rtnMsg('用户已经存在。')));
                  }
                  else {
                    /*   单机版去掉了注册码限制。
                    // 根据授权码判断授权是否可以。然后创建新用户，然后删除授权码，然后提交事物。
                    runSqlPromise("select * from createUser where uuid = '" + authCod + "'")
                    .then(function (aRow) {
                      if ((aRow || []).length > 0) {     */
                        userAdd = gUser.new();
                        userAdd.NICKNAME = userName;
                        userAdd.PASS = md5Pass;
                        userAdd.LEVEL = 1;
                        userAdd.GRANT = 10;
                        //gdb.transaction( function (tx) {
                            //tx.executeSql("delete from createUser where uuid = '" + authCod + "'");
                            gUser.save(userAdd, function (aErr, aRtn) {
                              if (aErr) {
                                aCallback(res.json(rtnErr("创建失败。请通知管理员")));
                              }
                              else {
                                aCallback(res.json(rtnMsg("创建成功，请登录")));
                              }
                            });
                        //});}    else      aCallback(res.json(rtnMsg('授权码错误。')));
                  }
                }
              }
            )
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
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn;
                aCallback(res.json(ls_rtn));
              }
            });
            break;
          }
          case 'taskEditSave':
          {// lExparm.msgObj
            lExparm.msgObj.OWNER = req.session.loginUser;
            gTask.save(lExparm.msgObj, function (aErr, aRtn) {
              if (aErr) {
                aCallback(res.json(rtnErr(aErr)))
              }
              else {
                aCallback(res.json(rtnMsg("更新成功.")));
              }
            });
            break;
          }
          case 'taskEditDelete':
          {
            if (lExparm.msgObj.OWNER == req.session.loginUser) {
              gTask.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
                if (aErr) {
                  aCallback(res.json(rtnErr(aErr)))
                }
                else {
                  aCallback(res.json(rtnMsg("删除成功.")));
                }
              });
            }
            else {
              aCallback(res.json(rtnErr("不能删除别人的任务。.")));
            }
            break;
          }
          case 'userGetAll':
          { // lExparm.msgObj
            runSql(" select NICKNAME from user  order by NICKNAME ", [], function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                aCallback(res.json(ls_rtn));
              }
            });
            break;
          }
          case 'userGet':
          { // lExparm.msgObj
            runSql("select * from user where NICKNAME = ? ", lExparm.userName, function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                aCallback(res.json(ls_rtn));
              }
            });
            break;
          }
          case 'workListGet':
          {
            /* ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset, filter:{seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
             seekStateFlag: lp.seekStateFlag , seekState: lp.seekState, seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser   }}*/
            var ls_memen = " (owner = '" + req.session.loginUser + "' and memen = 1 and memtimer < '" + exDb.getDateTime(new Date(), true) + "') ";

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
            runSql("select distinct * from work " + ls_where +
              " order by memen , CREATETIME limit " + lExparm.locate.limit + " offset " + lExparm.locate.curOffset, la_param, function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn ? aRtn : [];  // 返回数组。
                aCallback(res.json(ls_rtn));
              }
            });
            break;
          }
          case 'taskAllGet':
          {
            getSubList("select * from task  where uptask=? order by PLANSTART ", lExparm.taskUUID, true, function (aErr, aRtn) {
              if (aErr) aCallback(res.json(rtnErr(aErr)));
              else {
                ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
                ls_rtn.rtnUser = req.session.loginUser;
                ls_rtn.exObj = aRtn;
                aCallback(res.json(ls_rtn));
              }
            });
            break;
          }
          case 'workEditDelete':
          {  // lExparm.msgObj
            if (lExparm.msgObj.OWNER == req.session.loginUser) {
              gWork.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
                if (aErr) {
                  aCallback(res.json(rtnErr(aErr)))
                }
                else {
                  aCallback(res.json(rtnMsg("删除成功.")));
                }
              });
            }
            else {
              aCallback(res.json(rtnErr("不能删除别人的任务。.")));
            }
            break;
          }
          case 'workEditSave':
          {  // lExparm.msgObj
            lExparm.msgObj.OWNER = req.session.loginUser;
            gWork.save(lExparm.msgObj, function (aErr, aRtn) {
              if (aErr) {
                aCallback(res.json(rtnErr(aErr)));
              }
              else {
                aCallback(res.json(rtnMsg("更新成功.")));
              }
            });
            break;
          }
          case "exTools":
            // lExparm. {sql: ls_sql, word: ls_admin};
            if (lExparm.word == 'pub') {
              runSql(lExparm.sql, [], function(aErr, aRtn) {
                if (aErr) aCallback(res.json(rtnErr(aErr)));
                else {
                  ls_rtn = rtnMsg("成功");
                  ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
                  aCallback(res.json(ls_rtn));
                }
              })
            }
            else
              aCallback(res.json(rtnErr("--授权码错误。" + lExparm.word)));
            break;
          case "mainList":
            break;
          default :
            aCallback(res.json(rtnErr('不存在该请求：' + JSON.stringify(req.body))));
            break;
        }
    };


    return {
      initDb: initDb,
      appendix: {
          setDirty : function(aParm) { aParm._exState = 'dirty' },
          setNew : function(aParm) { aParm._exState = 'new' },
          setClean : function(aParm) { aParm._exState = 'clean' }
      },
      simuRestCall: simuRestCall
    }

  }]);

