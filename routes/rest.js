/**
 * Created by blaczom@gmail.com on 2014/10/1.
 */
var express = require('express'),
  router = express.Router(),
  crypto = require('crypto');

router.get('/', function(req, res) {
  res.render('login',{ title: ""});
});

function checkLogin(req, res, redirection){
  if(req.cookies.loginUser)  {
    req.session.loginUser = req.cookies.loginUser;
  }
  if (!req.session.loginUser)  {
    if (redirection) { res.redirect('/partials/index.html') ;}
  }
}

router.post('/', function(req, res) {
  /* 除了userLogin, userReg, 以外，其余的功能都需要 ---登录检查，
  */
  console.log("get client rest: " + JSON.stringify(req.body));

  var lFunc = req.body['func']; // 'userlogin',req.body['txtUserName'],
  var lExparm = req.body['ex_parm'];

  if ("userlogin,userReg,".indexOf(lFunc+",") < 0) {
    checkLogin(req,res,true);
  }

  switch (lFunc){
    case "userlogin": // lExparm.txtUserName, lExparm.txtUserPwd
      var userName = lExparm.txtUserName,
          userPwd = lExparm.txtUserPwd,
          userRem = lExparm.remPass;
      app.db.User.getByNickName(userName, function (aErr, aRtn) {
        if (aErr) res.json(app.rtnErr(aErr));
        else {
          if (aRtn.length > 0) {
            var xtmp = userName + userPwd
            var md5UserPwd = crypto.createHash('md5').update(xtmp).digest('hex');
            if (aRtn[0].PASS == md5UserPwd) {
              req.session.loginUser = userName;
              if (userRem) {
                res.cookie('loginUser', userName, { maxAge: 600000 });
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
    default :
      res.json(app.rtnErr('不存在该请求：' + JSON.stringify(req.body)));
      break;
  }
});

module.exports = router;
