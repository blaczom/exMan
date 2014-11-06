/**
 * Created by blaczom@gmail on 2014/10/25.
 * exAngDb.js -- exClientDb.js -- exAngDbAccess.js  顺序不能搞错。
 * // 注释掉 http的promise，更改成本地。
 * // 在index.html中加入对exClientDb.js的引用。
 <script src="/js/angular1.3.min.js" type="text/javascript"></script>
 <script src="/js/angular-route.min.js"></script>
 <script src="/js/angular-sanitize.min.js"></script>
 <script src="/js/angular-md5.min.js"></script>
 <script src="/js/exAngUtils.js" type="text/javascript"></script>
 <script src="/js/exAngDb.js" type="text/javascript"></script>
 //// VVVVVV   here !!!
 <script src="/js/exClientDb.js" type="text/javascript"></script>
 //// AAAAAA
 <script src="/js/exAngDbAccess.js" type="text/javascript"></script>
 <script src="/js/angExMan.js" type="text/javascript"></script>
 *    去掉factory的exlocal注释。调用http到服务器端。
 */

angular.module('exFactory').
  factory('exAccess', ['$http', '$q','md5','exDb', function($http,$q,md5,exDb){
  //factory('exAccess', ['$q','md5','exDb','exLocal',function($q,md5,exDb,exLocal){
    var gDebug = true; // if (gDebug) console.log();
    var httpCom = function(aUrl, aObject){
      var deferred = $q.defer();
     /*
      exLocal.simuRestCall(aUrl, aObject, function(aRtn){
        if (gDebug) { console.log("dbAccess: simulate send back: "); console.log(aRtn, ' type is ', typeof(aRtn)); }
        if (aRtn.rtnCode < -10)
          deferred.reject(aRtn);
        else
          deferred.resolve(aRtn);
      });
     */
     // /*
      $http.post(aUrl, aObject) // 更改这个地方。变成单机版。
       .success(function (data, status, headers, config) {
       deferred.resolve(data || []);
       })
       .error(function (data, status, headers, config) {
       deferred.reject(status);
       });  //  */
      return deferred.promise;
    };
    var userReg = function(aobjUser) {
      aobjUser.md5Pass = md5.createHash(aobjUser.NICKNAME + aobjUser.PASS);
      aobjUser.pass = aobjUser.pass2 = "";  // 防止网络传输明码。
      return httpCom('/rest',  { func: 'userReg',  ex_parm: { regUser: aobjUser} })
    };
    var userLogin = function(aobjUser) {
      return httpCom('/rest', { func: 'userlogin',   ex_parm: { txtUserName: aobjUser.NICKNAME,
      txtUserPwd: md5.createHash(aobjUser.NICKNAME + aobjUser.PASS), remPass: aobjUser.REMPASS } })
    };
    var userChange = function(aobjUser){
      var l_user = angular.copy(aobjUser);
      if ((l_user.PASS||'').length > 0)
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.PASS);
      else
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.oldPass);
      l_user.oldPass = md5.createHash(l_user.NICKNAME + l_user.oldPass);
      l_user.PASS = ""; l_user.PASS2 = "";
      return httpCom('/rest', { func: 'userChange',  ex_parm: {regUser: l_user}})
    };

    return {
      /* exAccess.---().then(function(data){}, function(err){}) */
      getAllUserPromise: function(){return httpCom('/rest',{ func: 'userGetAll',   ex_parm: {} })},
      userLoginPromise: userLogin,
      userRegPromise: userReg,
      userChangePromise: userChange,
      userGetPromise: function() { return httpCom('/rest',{func:'userGet', ex_parm:{userName:exDb.getUser()}})},
      taskSavePromise: function(aobjTask){return httpCom('/rest',{ func: 'taskEditSave', ex_parm: { msgObj: aobjTask}})},
      taskDeletePromise: function(aobjTask) {return httpCom('/rest',{ func: 'taskEditDelete',ex_parm: { msgObj: aobjTask}  })},
      taskListGetPromise: function(aLocate, aFilter) {return httpCom('/rest',{ func: 'taskListGet',ex_parm: { locate: aLocate,filter: aFilter}})},
      taskExpandPromise : function(aUuid){return  httpCom('/rest',{ func: 'taskAllGet', ex_parm: { taskUUID: aUuid }  })},
      workSavePromise : function(aobjWork){return httpCom('/rest',{ func: 'workEditSave',  ex_parm: { msgObj: aobjWork} })},
      workDeletePromise: function(aobjWork){return httpCom('/rest',{func:'workEditDelete',ex_parm:{msgObj:aobjWork}})},
      workGetPromise: function(aLocate, aFilter){ return httpCom('/rest',{ func: 'workListGet', ex_parm:{locate:aLocate,filter: aFilter}})},
      extoolsPromise: function(aParam){ return httpCom('/rest',{ func: 'exTools', ex_parm: aParam })}
    }
  }]);
;