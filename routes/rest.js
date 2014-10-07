/**
 * Created by blaczom@gmail.com on 2014/10/1.
 */
var express = require('express'),
  router = express.Router(),
  crypto = require('crypto');

router.get('/', function(req, res) {
  res.render('login',{ title: ""});
});

function checkLogin(req, res){
  if(req.cookies.loginUser)  {
    req.session.loginUser = req.cookies.loginUser;
  }
  if (req.session.loginUser) return true; else return false;
}

router.post('/', function(req, res) {
  /* 除了userLogin, userReg, 以外，其余的功能都需要 ---登录检查，
  */
  console.log("get client rest: " + JSON.stringify(req.body));

  var lFunc = req.body['func']; // 'userlogin',req.body['txtUserName'],
  var lExparm = req.body['ex_parm'];

  if ("userPrelogin,userlogin,userReg,".indexOf(lFunc+",") < 0) {
    if (!checkLogin(req,res)) {
      res.json(app.rtnErr('未登录，请先登录。'));
      return
    };
  }

  switch (lFunc){
    case 'userPrelogin':
      if(req.cookies.loginUser)  {
        var lrtn = app.rtnMsg('return rempass');
        lrtn.ex_parm = {username:req.cookies.loginUser, userpass:req.cookies.loginPass, userrem:req.cookies.remPass };
        res.json(lrtn);
      }
      break;
    case "userlogin": // lExparm.txtUserName, lExparm.txtUserPwd
      var userName = lExparm.txtUserName,  userPwd = lExparm.txtUserPwd,  userRem = lExparm.remPass;
      app.db.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {
            var xtmp = userName + userPwd
            var md5UserPwd = crypto.createHash('md5').update(xtmp).digest('hex');
            if (aRtn[0].PASS == md5UserPwd) {
              req.session.loginUser = userName;
              if (userRem) {
                res.cookie('loginUser', userName, { maxAge: 3600000 * 7 });
                res.cookie('loginPass', userPwd, { maxAge: 3600000 * 7 });
                res.cookie('remPass', true, { maxAge: 3600000 * 7 });
              }
              else
              {
                res.cookie('loginPass', "", { maxAge: 600000 });
                res.cookie('remPass', false, { maxAge: 600000 });
              }
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
    case "userReg": // lExparm.txtUserName, lExparm.txtUserPwd
      var userName = lExparm.txtUserName,
          userPwd = lExparm.txtUserPwd;
      var md5UserPwd = crypto.createHash('md5').update(userName + userPwd).digest('hex');
      app.db.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {      // 存在了。
            res.json(app.rtnMsg('用户已经存在。'));
          }
          else {
            userAdd = app.db.User.new();
            userAdd.NICKNAME = userName;
            userAdd.PASS = md5UserPwd;
            app.db.User.save(userAdd, function (aErr, aRtn) {
              if (aErr) {
                res.json(app.rtnErr("创建失败。请通知管理员"));
              }
              else {
                res.json(app.rtnMsg("创建成功，请登录" ));
              }
            })
          }
        }
      });
      break;
    case "mainList":
      // get the
      break;
    case 'msgEditGet':
      app.db.Msg.getByUUID(lExparm.msgId, function(aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {      // 存在。
            ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
            ls_rtn.exObj = aRtn[0];
            res.json(ls_rtn); // 返回msgObject
          }
          else {
            res.json(app.rtnErr("消息id不存在，请重新操作。"));
          }
        }
      });
      break;
    case 'msgEditSave':  // lExparm.msgObj
      app.db.Msg.save(lExparm.msgObj, function(aErr, aRtn){
        if (aErr) { res.json(app.rtnErr(aErr)) }
        else {
          res.json(app.rtnMsg("更新成功."));
        }
      });
      break;
    case 'taskListGet':
      var lUser = req.session.loginUser;
      app.db.comAllBy("distinct *", 'task',
        "where owner = '"+ lUser +  "' or uuid in (select task_id from task_man where man_nick = '" +
        lUser + "') order by START", function(aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          ls_rtn = app.rtnMsg('');  // 检索成功不需要提示信息。
          ls_rtn.exObj = aRtn?aRtn:[];  // 返回数组。
          res.json(ls_rtn);
        }
      });
      break;
    case 'taskEditSave':  // lExparm.msgObj
      lExparm.msgObj.OWNER = req.session.loginUser;
      app.db.Task.save(lExparm.msgObj, function(aErr, aRtn){
        if (aErr) { res.json(app.rtnErr(aErr)) }
        else {
          res.json(app.rtnMsg("更新成功."));
        }
      });
      break;
    case 'taskEditDelete':
      if (lExparm.msgObj.OWNER == req.session.loginUser)
      {
        app.db.Task.delete(lExparm.msgObj.UUID, function(aErr, aRtn){
          if (aErr) { res.json(app.rtnErr(aErr)) }
          else {
            res.json(app.rtnMsg("删除成功."));
          }
        });
      }
      else
      {
        res.json(app.rtnErr("不能删除别人的任务。."));
      }
      break;
    default :
      res.json(app.rtnErr('不存在该请求：' + JSON.stringify(req.body)));
      break;
  }
});

module.exports = router;
