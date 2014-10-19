/**
 * Created by Administrator on 2014/9/30.
 * 查询数据库的内容。
 */
var express = require('express'),
  router = express.Router()

router.get('/', function(req, res) {
  res.render('extools', {layout:false});
});

router.post('/', function(req, res) {
  var ls_sql = req.body['exReq']
  var ls_admin = req.body['exAdmin']
  if (ls_admin == 'publicpass') {
    app.db.directDb.all(ls_sql, function(aErr, aRtn){
      if (aErr){
        res.json( { rtnCode:-10, rtnInfo: "查询数据库失败。请通知管理员。" } );
      }
      else
      {
        res.json({rtnCode:1,  rtnInfo: aRtn});
      }
    });
  }
  else
    res.json({rtnCode:-1,  rtnInfo: "没有正确授权"});
});

module.exports = router;
