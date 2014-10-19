/**
 * Created by Administrator on 2014/10/18.
 */
/*
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

  */