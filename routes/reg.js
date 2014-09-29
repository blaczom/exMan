var express = require('express'),
    router = express.Router(),
    crypto = require('crypto'),
    TITLE_REG = '注册';

router.get('/', function(req, res) {
  //res.render('reg',{title:TITLE_REG});
  //res.sendfile('reg.html');
  res.render('reg', {layout:false});
});

router.post('/', function(req, res) {
  var userName = req.body['txtUserName'],
      userPwd = req.body['txtUserPwd'],   
      md5 = crypto.createHash('md5'),f
      userPwd = md5.update(userName + userPwd).digest('hex');
  app.db.User.getByNickName(userName, function(aErr, aRtn){
    if (aErr){
      //res.render('reg', { showInfo: "查询数据库失败。请通知管理员。"});
      res.json({rtnCode:-10, rtnInfo: "查询数据库失败。请通知管理员。"});
    }
    else
    {
      if(aRtn.length > 0){
        res.json({rtnCode:-1,  rtnInfo: "用户已经存在。" });
      }
      else{
        userAdd = app.db.User.new();
        userAdd.NICKNAME = userName;
        userAdd.PASS = userPwd;
        app.db.User.save(userAdd, function(aErr, aRtn){
          if (aErr){ res.json({rtnCode:-10,  rtnInfo: "创建失败。请通知管理员" });}
          else{ res.json({rtnCode:1,  rtnInfo: "创建成功，请<a href='\login'>登录</a>" });}
        })
      }
    }
  });
});

module.exports = router;