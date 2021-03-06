/**
 * Created by blaczom@gmail.com on 2014/10/1.
 */
var express = require('express'),
  router = express.Router(),
  appDb =  require('../exDbAccess'),
  Q = require('q'),
  log = require('../exUtil');

var rtnErr = function(aMsg, aErr) {
  return { "rtnInfo": JSON.stringify(aMsg), rtnCode: -1, "alertType": 0, error: JSON.stringify(aErr), exObj:{} }
};
var rtnMsg = function(aMsg) {
  return { "rtnInfo": aMsg, rtnCode: 1, "alertType": 0, error: [], exObj:{} }
};

var logInfo = log.info;
var logErr = log.err;

router.get('/', function(req, res) {
  res.send('没有此功能。');
});

function checkLogin(req, res){  
  return(req.session.loginUser);  // 只信任服务器端的数据。
}

function getSubList(aSql, aParam, aWithSub, aCallback){  // 得到指定的任务下面的任务数量。
  appDb.runSql(aSql, aParam, function(aErr, aRtn) {
    if (aErr) aCallback(aErr);
    else {
      var l_exObj = aRtn?aRtn:[];
      if (aWithSub) {
        var stackSubQ = [];
        for (var i in l_exObj) { // 对返回的所有数据集进行处理。
          stackSubQ.push( appDb.runSqlPromise("select count(*) as SUBCOUNT, state as SUBSTATE from task where uptask='" + l_exObj[i].UUID + "' group by STATE") )
        }
        Q.all(stackSubQ).then(function(row2){
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
        aCallback(null, l_exObj);
    }
  });
}


router.post('/', function(req, res) {
  /* 除了userLogin, userReg, 以外，其余的功能都需要 ---登录检查，  */
  logInfo("get client rest: " , req.body);
  var lFunc = req.body['func']; // 'userlogin',req.body['txtUserName'],
  var lExparm = req.body['ex_parm'];
  if ("userlogin,userReg,exTools,,,".indexOf(lFunc+",") < 0) {
    if (!checkLogin(req,res)) {
      var l_rtn = rtnErr('未登录，请先登录。');
      l_rtn.rtnCode = 0;
      l_rtn.appendOper = 'login';   // rtnCode = 0的时候，就是有附加操作的时候。
      res.json(l_rtn);
      return; // STOP HERE.
    }
  }

  switch (lFunc){
    case 'userChange':    { // no user anymore, will change to change password. //
      var l_userName = lExparm.regUser.NICKNAME,
           l_md5Pass = lExparm.regUser.md5Pass;

      appDb.USER.getByNickName(l_userName, function (aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          if (aRtn) {      // 存在了。
            var l_user = aRtn;
            if (lExparm.regUser.oldPass == l_user.PASS) {
              l_user.PASS = l_md5Pass;
              l_user.MOBILE = lExparm.regUser.MOBILE;
              l_user.EMAIL = lExparm.regUser.EMAIL;
              l_user.IDCARD = lExparm.regUser.IDCARD;
              l_user.UPUSER = lExparm.regUser.UPUSER;
              l_user._exState = 'dirty';
              appDb.USER.save(l_user, function (aErr, aRtn) {
                if (aErr)  res.json(rtnErr("创建失败。请通知管理员"));
                else  res.json(rtnMsg("更改成功。" ));
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
    case "userlogin": { // lExparm.txtUserName, lExparm.txtUserPwd
      var userName = lExparm.txtUserName,  userPwd = lExparm.txtUserPwd,  userRem = lExparm.remPass;
      appDb.USER.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          if (aRtn) {
            var xtmp = userName + userPwd;
            var md5UserPwd = userPwd ; // crypto.createHash('md5').update(xtmp).digest('hex'); 客户端已经搞定了。
            if (aRtn.PASS == md5UserPwd) {
              req.session.loginUser = userName;
              req.session.userLevel = aRtn.LEVEL;
              req.session.userGrant = aRtn.GRANT;
              res.json(rtnMsg('登录成功。'));
            }
            else {
              res.json(rtnErr('密码有误'));
            }
          }
          else
          {
            res.json(rtnErr('用户不存在'));
          }
        }
      });
      break;
    }
    case "userReg": { // lExparm = {regUser: lp.user, authCode:lp.user.authCode   }
      var userName = lExparm.regUser.NICKNAME,
          userPwd = lExparm.regUser.PASS;
          authCod = lExparm.regUser.authCode;
          md5Pass = lExparm.regUser.md5Pass; //var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');

      var l_matchRull = (userName||",").match(/(\w|@|\.)+/);
      if (!l_matchRull || (l_matchRull[0] != l_matchRull.input)) {
        res.json(rtnErr("名字不能包含@.字母数字以外的东东"));
        return;
      }

      appDb.USER.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          if (aRtn)   res.json(rtnMsg('用户已经存在。'));
          else { // 根据授权码判断授权是否可以。然后创建新用户，然后删除授权码，然后提交事物。
            appDb.getPromise("select * from createUser where uuid = ?" , authCod)
            .then(
              function(aRow){
                if(aRow){
                  userAdd = appDb.USER.new();
                  userAdd.NICKNAME = userName;
                  userAdd.PASS = md5Pass;
                  userAdd.LEVEL = aRow.LEVEL;
                  userAdd.GRANT = aRow.GRANT;
                  userAdd.UPUSER = aRow.UPUSER;
                  try {
                    appDb.dbLib.gdb.serialize(function () {
                      appDb.dbLib.gdb.exec('BEGIN TRANSACTION');  console.log('begin transe');
                      appDb.dbLib.gdb.run("delete from createUser where uuid = '" + authCod + "'");  console.log('delete createUser');
                      appDb.USER.save(userAdd, function (aErr, aRtn) {  console.log('user save is ', aErr, aRtn);
                        if (aErr) {
                          appDb.dbLib.gdb.exec('rollback');
                          res.json(rtnErr("创建失败。请通知管理员"));
                        }
                        else {
                          appDb.dbLib.gdb.exec('commit');
                          res.json(rtnMsg("创建成功，请登录"));
                        }
                      });
                    });
                  }
                  catch  (e) {
                    res.json(rtnErr("创建失败。请通知管理员" + JSON.stringify(e)));
                  }
                }
                else
                  res.json(rtnMsg('授权码错误。'));
            },
              function(){ res.json(rtnMsg('错误：' + JSON.stringify(arguments))); }
            );
          }
        }
      });
      break;
    }
    case 'taskListGet': {
      var la_where  = [], la_param=[];
      if (lExparm.filter.seekContentFlag)  {
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
          ls_append = " and private!=1 " ;
        la_where.push(" (owner = '" + lExparm.filter.seekUser + "' or ought like '%," + lExparm.filter.seekUser + ",%')" + ls_append );
      }
      if (lExparm.filter.seekTop)       /////////////////// 梯次任务列表
        la_where.push(" uptask = '' ");

      var ls_where = "";
      if (la_where.length > 0)
        ls_where = " where " + la_where.join(" and ");
      console.log("taskListGet sql where with param : ", ls_where, la_param);
      getSubList("select distinct * from task " + ls_where + " order by PLANSTART limit " +
        lExparm.locate.limit + " offset " +  lExparm.locate.curOffset, la_param, lExparm.filter.seekTop, function(aErr, aRtn) {
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
    case 'taskGet': {
      appDb.runSql("select * from task where UUID = ? " , lExparm.UUID ,  function(aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'taskEditSave':
    {// lExparm.msgObj
      lExparm.msgObj.OWNER = req.session.loginUser;
      if (lExparm.msgObj._exState == 'dirty')
        appDb.dbLib.gdb.get("select owner from task where uuid=?", lExparm.msgObj.UUID,
          function (aErr, aRow) {
            if (aErr) res.json(rtnErr(aErr));
            else {
              if (aRow.OWNER != req.session.loginUser)  res.json(rtnErr("非自己的数据不可以更改"));
              else {
                appDb.TASK.save(lExparm.msgObj, function (aErr, aRtn) {
                  if (aErr) {
                    res.json(rtnErr(aErr))
                  }
                  else {
                    res.json(rtnMsg("更新成功."));
                  }
                });
              }
            }
          });
      else  // 增加的不叨叨。
        appDb.TASK.save(lExparm.msgObj, function (aErr, aRtn) {
          if (aErr) { res.json(rtnErr(aErr)) }
          else res.json(rtnMsg("更新成功."));
        });
      break;
    }
    case 'taskEditDelete':    {
      if (lExparm.msgObj.OWNER == req.session.loginUser) {
        appDb.TASK.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
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
    case 'userGetAll':  { // lExparm.msgObj
      appDb.runSql(" select NICKNAME from user  order by NICKNAME ", [], function(aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'userGet':  { // lExparm.msgObj
      appDb.runSql("select * from user where NICKNAME = ? " , lExparm.userName ,  function(aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
          aRtn[0].PASS = ""; // 不能把密码返回去。。。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'workListGet': {
      /* ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset, filter:{seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
       seekStateFlag: lp.seekStateFlag , seekState: lp.seekState, seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser   }}*/
      var la_where  = [], la_param = [];
      if (lExparm.filter.seekContentFlag)  {
        la_where.push(" (content like '%'||?||'%') ");   // 这个语法要命。。。
        la_param.push(lExparm.filter.seekContent);
      }
      if (lExparm.filter.seekStateFlag) la_where.push(" (state in ('" + lExparm.filter.seekState.join("','") + "')) ");
      if (lExparm.filter.seekUserFlag) {  // req.session.userLevel = aRtn[0].LEVEL;
        if (req.session.loginUser == lExparm.filter.seekUser) // 当前用户就是查询的用户。可以显示私有工作，否则不显示私有工作。
          la_where.push(" (owner = '" + req.session.loginUser + "') ");
        else
          la_where.push(" (owner = '" + lExparm.filter.seekUser + "' and private != 1 and level > " + req.session.userGrant + ") ");
      }
      else // 没选则用户，就是要查找所有的用户。 ((owner='111') or (owner!='111' and private!=1 and level<=99))
        la_where.push( " ((owner = '" + req.session.loginUser + "') or (owner != '" + req.session.loginUser +
        "' and private != 1 and level > " + req.session.userGrant + "))" ) ;
      if (lExparm.filter.seekTaskFlag) {
        la_where.push(" (uptask = '" + lExparm.filter.seekTaskUUID + "') "  );
      }  // 以上都是and的关系。
      var ls_where = "";
      // where (owner='111' and memen=1 and memtimer<'2011-1-1')   // 有需要记忆的东西是必须显示的。
      ls_where = " where (owner = '" + req.session.loginUser + "' and memen = 1 and memtimer < '" + log.getDateTime(new Date(), true) + "') "; // memen是必须选的。
      if (la_where.length > 0)  // 剩下的，是要or的。
        ls_where = ls_where + ' or (' + la_where.join(" and ") + ")";
      appDb.runSql("select distinct * from work "+ ls_where +
        " order by memen , CREATETIME limit " +  lExparm.locate.limit + " offset " +  lExparm.locate.curOffset, la_param, function(aErr, aRtn) {
          if (aErr) res.json(rtnErr(aErr));
          else {
            ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
            ls_rtn.rtnUser = req.session.loginUser;
            ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
            res.json(ls_rtn);
          }
        });
      break;
    }
    case 'taskAllGet':{
      getSubList("select * from task  where uptask=? order by PLANSTART ", lExparm.taskUUID, true,  function(aErr, aRtn) {
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
    case 'workEditDelete': {  // lExparm.msgObj
      if (lExparm.msgObj.OWNER == req.session.loginUser) {
        appDb.WORK.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
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
    case 'workEditSave':  {  // lExparm.msgObj
      lExparm.msgObj.OWNER = req.session.loginUser;
      if (lExparm.msgObj._exState=='dirty') {
        appDb.dbLib.gdb.get("select owner from work where uuid=?", lExparm.msgObj.UUID,
          function(aErr, aRow){
            if (aErr) res.json(rtnErr(aErr));
            else{
              if (aRow.OWNER != req.session.loginUser)  res.json(rtnErr("非自己的数据不可以更改"));
              else {
                appDb.WORK.save(lExparm.msgObj, function(aErr, aRtn){
                  if (aErr) { res.json(rtnErr(aErr)) }
                  else {
                    res.json(rtnMsg("更新成功."));
                  }
                });
              }
            }
          });
      }
      else  // 增加的不叨叨。
        appDb.WORK.save(lExparm.msgObj, function(aErr, aRtn){
          if (aErr) { res.json(rtnErr(aErr)) }
          else res.json(rtnMsg("更新成功."));
        });
      break;
    }
    case 'userListGet':
      var ls_where = "", la_where =[];
      if (lExparm.filter.seekUserFlag)
        if (lExparm.filter.seekUser.length>0) {
          ls_where = " where NICKNAME = ? or UPUSER = ? ";
          la_where.splice(0 , 0, lExparm.filter.seekUser, lExparm.filter.seekUser);
        }
      appDb.runSql("select NICKNAME,MOBILE,EMAIL,UPUSER,LEVEL,GRANT from user "+ ls_where +" order by upuser ", la_where, function(aErr, aRtn) {
        if (aErr) res.json(rtnErr(aErr));
        else {
          ls_rtn = rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。  ls_rtn.exObj;
          // 统计所有的对应用户的任务和工作情况。
          var stackSubQ = [];
          var ls_runsql = "SELECT sum(CASE STATE WHEN '计划' THEN 1 else 0 end) as plan, sum(CASE STATE WHEN '进行' THEN 1 else 0 end) as deal," +
              " sum(CASE STATE WHEN '结束' THEN 1 else 0 end) as over from task where OUGHT like '%'||?||'%' union all " +
              " SELECT sum(CASE STATE WHEN '计划' THEN 1 else 0 end) as plan, sum(CASE STATE WHEN '进行' THEN 1 else 0 end) as deal, " +
              " sum(CASE STATE WHEN '结束' THEN 1 else 0 end) as over from work where OWNER=? ";

          for (var i in ls_rtn.exObj) { // 对返回的所有数据集进行处理。
            var l_userOught = ','+ls_rtn.exObj[i].NICKNAME+',';
            stackSubQ.push( appDb.runSqlPromise( ls_runsql, [l_userOught, ls_rtn.exObj[i].NICKNAME] ));
          }
          Q.all(stackSubQ).then(function(row2){
            for (var ii in row2) {
              var l_t = [row2[ii][0].plan||0, row2[ii][0].deal||0, row2[ii][0].over||0];
              ls_rtn.exObj[ii].statTask =   l_t.join('|');
              var l_t2 = [row2[ii][1].plan||0, row2[ii][1].deal||0, row2[ii][1].over||0];
              ls_rtn.exObj[ii].statWork =   l_t2.join('|');
            }
            res.json(ls_rtn);
          }, function(err){ res.json(err); });
        }
      });
      break;
    case "exTools":
      // lExparm. {sql: ls_sql, word: ls_admin};
      if (lExparm.word == '91df0168b155dae510513d825d5d00b0') {
        if (lExparm.sql=='restart') process.exit(-1);
        appDb.runSql(lExparm.sql, [], function(aErr, aRtn) {
          if (aErr) res.json(rtnErr(aErr));
          else {
            ls_rtn = rtnMsg("成功");
            ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
            res.json(ls_rtn);
          }
        })
      }
      else
        res.json(rtnErr(aErr));
      break;
    case "mainList":
      break;
    default :
      res.json(rtnErr('不存在该请求：' + JSON.stringify(req.body)));
      break;
  }
});

module.exports = router;
