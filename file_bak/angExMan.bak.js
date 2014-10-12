/**
 * Created by Administrator on 2014/10/11.
 */
app.controller("ctrlMsgEdit", ['$http', '$scope', '$routeParams', 'exUtil', function($http, $scope, $routeParams, exUtil){
  var lp = $scope;
  lp.id = $routeParams.id;
  lp.rtnInfo = "";
  lp.msg = new objMsg();
  if (lp.id.length > 30){  // 有效的id。说明是edit
    $http.post('/rest',
      { func: 'msgEditGet', // my message
        ex_parm: { msgId: lp.id}
      })
      .success(function (data, status, headers, config) {    // 得到新的消息
        //lp.rtnInfo = data.rtnInfo;
        lp.msg = data.exObj;
        lp.msg._exState = "clean";
        lp.rtnInfo = data.rtnInfo;
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
  }
  else{   // 无效id，说明是要添加
    lp.msg.UUID = exUtil.uuid();
    lp.msg.CREATETIME = exUtil.getDateTime(new Date());
    lp.msg._exState = "new";
    lp.msg.VALIDATE = lp.msg.CREATETIME;
    lp.msg.OWNER = objUser.NICKNAME;
  }
  lp.msgSave = function(){
    if (lp.msg._exState == "clean"){ lp.msg._exState = 'dirty' ;}
    $http.post('/rest',
      { func: 'msgEditSave', // my message
        ex_parm: { msgObj: lp.msg }
      })
      .success(function (data, status, headers, config) {    // 得到新的消息
        lp.rtnInfo = data.rtnInfo;
        lp.msg._exState = 'clean';
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
  }
}]);