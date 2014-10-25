/**
 * Created by blaczom@gmail on 2014/10/25.
 */

angular.module('exFactory').
  factory('exQuery', ['$http', '$q','md5','exDb', function($http,$q,md5,exDb){
    var httpCom = function(aUrl, aObject){
      var deferred = $q.defer();
      $http.post(aUrl, aObject)
        .success(function (data, status, headers, config) {
          deferred.resolve(data || []);
        })
        .error(function (data, status, headers, config) {
          deferred.reject(status);
        });
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
      /* exQuery.---().then(function(data){}, function(err){}) */
      getAllUserPromise: function(){return httpCom('/rest',{ func: 'userGetAll',   ex_parm: {} })},
      userLoginPromise: userLogin,
      userRegPromise: userReg,
      userChangePromise: userChange,
      userGetPromise: function() { return httpCom('/rest',{func:'userGet', ex_parm:{userName:exDb.getUser()}})},
      taskSavePromise: function(aobjTask){return httpCom('/rest',{ func: 'taskEditSave', ex_parm: { msgObj: aobjTask}})},
      taskDeletePromise: function(aobjTask) {return httpCom('/rest',{ func: 'taskEditDelete',ex_parm: { msgObj: aobjTask}  })},
      taskListGetPromise: function(aLocate, aFilter) {return httpCom('/rest',{ func: 'taskListGet',ex_parm: { locate: aLocate,  filter: aFilter}})},
      taskExpandPromise : function(aUuid){return  httpCom('/rest',{ func: 'taskAllGet', ex_parm: { taskUUID: aUuid }  })},
      workSavePromise : function(aobjWork){return httpCom('/rest',{ func: 'workEditSave',  ex_parm: { msgObj: aobjWork} })},
      workDeletePromise: function(aobjWork){return httpCom('/rest',{func:'workEditDelete',ex_parm:{msgObj:aobjWork}})},
      workGetPromise: function(aLocate, aFilter){ return httpCom('/rest',{ func: 'workListGet', ex_parm: { locate: aLocate,  filter: aFilter } } );
      }
    }

  }]);
;