/**
 * Created by blaczom@gmail.com on 2014/10/1.
 */
var express = require('express'),
  router = express.Router(),
  crypto = require('crypto'),
  appDb =  require('../db');

router.get('/', function(req, res) {
  res.send('没有此功能。');
});

function checkLogin(req, res){
  // if(req.cookies.loginUser)  { req.session.loginUser = req.cookies.loginUser; }
  if (req.session.loginUser) return true; else return false;  // 只信任服务器端的数据。
}

router.post('/', function(req, res) {
  /* 除了userLogin, userReg, 以外，其余的功能都需要 ---登录检查，
  */
  console.log("get client rest: " + JSON.stringify(req.body));
  var lFunc = req.body['func']; // 'userlogin',req.body['txtUserName'],
  var lExparm = req.body['ex_parm'];
  if ("userlogin,userReg,".indexOf(lFunc+",") < 0) {
    if (!checkLogin(req,res)) {
      res.json(app.rtnErr('未登录，请先登录。'));
      return
    };
  }

  switch (lFunc){
    case 'userChange':    { // no user anymore, will change to change password. //
      var userName = lExparm.regUser.NICKNAME,
           userPwd = lExparm.regUser.PASS;
           md5Pass = lExparm.regUser.md5Pass; //var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');

      appDb.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
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
                if (aErr)  res.json(app.rtnErr("创建失败。请通知管理员"));
                else  res.json(app.rtnMsg("更改成功。" ));
              });
            }
            else
              res.json(app.rtnMsg('原密码错误。'));
          }
          else {
            res.json(app.rtnMsg('imposible error ... 用户不存在了。。。'));
          }
        }

      });
      break;
    }
    case "userlogin": { // lExparm.txtUserName, lExparm.txtUserPwd
      var userName = lExparm.txtUserName,  userPwd = lExparm.txtUserPwd,  userRem = lExparm.remPass;
      appDb.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {
            var xtmp = userName + userPwd
            var md5UserPwd = userPwd ; // crypto.createHash('md5').update(xtmp).digest('hex'); 客户端已经搞定了。
            if (aRtn[0].PASS == md5UserPwd) {
              req.session.loginUser = userName;
              req.session.userLevel = aRtn[0].LEVEL;
              req.session.userGrant = aRtn[0].GRANT;
              res.json(app.rtnMsg('登录成功。'));
            }
            else {
              res.json(app.rtnErr('密码有误'));
            }
          }
          else
          {
            res.json(app.rtnErr('用户不存在'));
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
      appDb.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {      // 存在了。
            res.json(app.rtnMsg('用户已经存在。'));
          }
          else {
            // 根据授权码判断授权是否可以。然后创建新用户，然后删除授权码，然后提交事物。
            appDb.Q.allSql("select * from createUser where uuid = '" + authCod + "'")
              .then(function(aRow){
                if((aRow||[]).length > 0 ){
                  userAdd = appDb.User.new();
                  userAdd.NICKNAME = userName;
                  userAdd.PASS = md5Pass;
                  userAdd.LEVEL = aRow[0].LEVEL;
                  userAdd.GRANT = aRow[0].GRANT;
                  appDb.directDb.serialize(function() {
                    try {
                      appDb.directDb.exec('BEGIN TRANSACTION');
                      appDb.directDb.run("delete from createUser where uuid = '" + authCod  + "'");
                      appDb.User.save(userAdd, function (aErr, aRtn) {
                      if (aErr) {
                        appDb.directDb.exec('rollback');
                        res.json(app.rtnErr("创建失败。请通知管理员"));
                      }
                      else {
                        appDb.directDb.exec('commit');
                        res.json(app.rtnMsg("创建成功，请登录" ));
                      } });
                    }
                    catch  (e) {
                      console.log(e);
                    }
                  });
                }
                else
                  res.json(app.rtnMsg('授权码错误。'));
              })
              .fail(function(){
                res.json(app.rtnMsg('错误：' + arguments))
            })      ;
          }
        }
      });
      break;
    }
    case 'taskListGet': {
      /* ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset, filter:{seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
      seekStateFlag: lp.seekStateFlag , seekState: lp.seekState, seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser   }}*/
      var la_where  = [];
      if (lExparm.filter.seekContentFlag)   la_where.push(" content like '%" + lExparm.filter.seekContent + "%' ");
      if (lExparm.filter.seekStateFlag) la_where.push(" state in ('" + lExparm.filter.seekState.join("','") + "') ");
      if (lExparm.filter.seekUserFlag) {
        var ls_append = "";
        if (req.session.loginUser != lExparm.filter.seekUser) // 当前用户就是查询的用户。可以显示私有任务，否则不显示私有任务。
          ls_append = " and private!='true' " ;
        la_where.push(" (owner = '" + lExparm.filter.seekUser + "' or ought like '%" + lExparm.filter.seekUser + ",%')" + ls_append );
      }
      var ls_where = "";
      if (la_where.length > 0)
        ls_where = " where " + la_where.join(" and ");
      console.log("taskListGet sql where : " + ls_where);
      appDb.comAllBy("distinct *", 'task',
        ls_where + " order by PLANSTART limit " +  lExparm.limit + " offset " +  lExparm.offset, function(aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.rtnUser = req.session.loginUser;
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'taskEditSave':  {// lExparm.msgObj
      lExparm.msgObj.OWNER = req.session.loginUser;
      appDb.Task.save(lExparm.msgObj, function(aErr, aRtn){
        if (aErr) { res.json(app.rtnErr(aErr)) }
        else {
          res.json(app.rtnMsg("更新成功."));
        }
      });
      break;
    }
    case 'taskEditDelete':    {
      if (lExparm.msgObj.OWNER == req.session.loginUser) {
        appDb.Task.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
          if (aErr) {
            res.json(app.rtnErr(aErr))
          }
          else {
            res.json(app.rtnMsg("删除成功."));
          }
        });
      }
      else {
        res.json(app.rtnErr("不能删除别人的任务。."));
      }
      break;
    }
    case 'userGetAll':  { // lExparm.msgObj
      appDb.comAllBy(" NICKNAME ", 'user'," order by NICKNAME ", function(aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'userGet':  { // lExparm.msgObj
      appDb.allSql("select * from user where NICKNAME ='" + lExparm.userName + "'", function(aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    }
    case 'workListGet': {
      /* ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset, filter:{seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
       seekStateFlag: lp.seekStateFlag , seekState: lp.seekState, seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser   }}*/
      var ls_memen = " (owner = '" + req.session.loginUser + "' and memen = 'true' and memtimer < '" + appDb.getDateTime(new Date(), true) + "') ";

      var la_where  = [];
      if (lExparm.filter.seekContentFlag)   la_where.push(" content like '%" + lExparm.filter.seekContent + "%' ");
      if (lExparm.filter.seekStateFlag) la_where.push(" state in ('" + lExparm.filter.seekState.join("','") + "') ");
      if (lExparm.filter.seekUserFlag) {  // req.session.userLevel = aRtn[0].LEVEL;
        if (req.session.loginUser == lExparm.filter.seekUser) // 当前用户就是查询的用户。可以显示私有工作，否则不显示私有工作。
          la_where.push("( owner = '" + req.session.loginUser + "') ");
        else
          la_where.push(" (owner = '" + lExparm.filter.seekUser + "' and private != true and level <= req.session.userGrant)) ");
      }
      else // 没选则用户，就是要查找所有的用户。
        la_where.push( "((owner = '" + req.session.loginUser + "') or (owner != '" + req.session.loginUser +
        "' and private != true and level <= req.session.userGrant))" ) ;
      if (lExparm.filter.seekTaskFlag) {
        la_where.push(" uptask = '" + lExparm.filter.seekTaskUUID + "'"  );
      }
      var ls_where = "";
      ls_where = " where " + ls_memen; // memen是必须选的。
      if (la_where.length > 0)
        ls_where = ls_where + ' or (' + la_where.join(" and ") + ")";
      console.log("workListGet sql where : " + ls_where);
      appDb.comAllBy("distinct *", 'work',
          ls_where + " order by memen , CREATETIME limit " +  lExparm.limit + " offset " +  lExparm.offset, function(aErr, aRtn) {
          if (aErr) res.json(app.rtnErr(aErr));
          else {
            ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
            ls_rtn.rtnUser = req.session.loginUser;
            ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
            res.json(ls_rtn);
          }
        });
      break;
    }
    case 'workEditDelete': {  // lExparm.msgObj
      if (lExparm.msgObj.OWNER == req.session.loginUser) {
        appDb.Work.delete(lExparm.msgObj.UUID, function (aErr, aRtn) {
          if (aErr) {
            res.json(app.rtnErr(aErr))
          }
          else {
            res.json(app.rtnMsg("删除成功."));
          }
        });
      }
      else {
        res.json(app.rtnErr("不能删除别人的任务。."));
      }
      break;
    }
    case 'workEditSave':  {  // lExparm.msgObj
      lExparm.msgObj.OWNER = req.session.loginUser;
      appDb.Work.save(lExparm.msgObj, function(aErr, aRtn){
        if (aErr) { res.json(app.rtnErr(aErr)) }
        else {
          res.json(app.rtnMsg("更新成功."));
        }
      });
      break;
    }
    case "mainList":
      break;
    default :
      res.json(app.rtnErr('不存在该请求：' + JSON.stringify(req.body)));
      break;
  }
});

module.exports = router;
