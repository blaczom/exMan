/**
 * Created by blaczom@gmail on 2014/10/25.
 */

angular.module('exFactory').
  factory('exQuery', ['$http', '$q','md5','exDb', function($http,$q,md5,exDb){
    var getAllUserName = function(){
      var deferred = $q.defer();
      $http.post('/rest',{ func: 'userGetAll', // my message
        ex_parm: {} })
        .success(function (data, status, headers, config) {    // 得到新的消息
          deferred.resolve(data||[]); // ls_rtn.exObj = []  exObj
        })
        .error(function (data, status, headers, config) {
          deferred.reject(status);
        });
      return deferred.promise;
    };
    var userLogin = function(aobjUser) {
      var deferred = $q.defer();
      $http.post('/rest', { func: 'userlogin',   ex_parm: { txtUserName: aobjUser.NICKNAME,
        txtUserPwd: md5.createHash(aobjUser.NICKNAME + aobjUser.PASS), remPass: aobjUser.REMPASS   }
      })
        .success(function (data, status, headers, config) {
          deferred.resolve(data||[]); })
        .error(function (data, status, headers, config) {
          deferred.reject(status); });
      return deferred.promise;
    };
    var userReg = function(aobjUser) {
      var deferred = $q.defer();
      aobjUser.md5Pass = md5.createHash(aobjUser.NICKNAME + aobjUser.PASS);
      aobjUser.pass = aobjUser.pass2 = "";  // 防止网络传输明码。
      $http.post('/rest',  { func: 'userReg',  ex_parm: { regUser: aobjUser} })
        .success(function (data, status, headers, config) {
          deferred.resolve(data||[]);
        })
        .error(function (data, status, headers, config) {
          deferred.reject(status);
        });
      return deferred.promise;
    };
    var userGet = function() {
      var deferred = $q.defer();
      $http.post('/rest',{func:'userGet', ex_parm:{userName:exDb.getUser()}})
      .success(function (data, status, headers, config) {    // 得到新的消息
          deferred.resolve(data||[]);
      })
      .error(function (data, status, headers, config) {
          deferred.reject(status);
      });
      return deferred.promise;
    };
    var userChange = function(aobjUser){
      var l_user = angular.copy(aobjUser);
      if ((l_user.PASS||'').length > 0)
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.PASS);
      else
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.oldPass);
      l_user.oldPass = md5.createHash(l_user.NICKNAME + l_user.oldPass);
      l_user.PASS = ""; l_user.PASS2 = "";
      var deferred = $q.defer();
      $http.post('/rest',
        { func: 'userChange',
          ex_parm: {regUser: l_user}
        })
        .success(function (data, status, headers, config) {
          deferred.resolve(data||[]);
        })
        .error(function (data, status, headers, config) {
          deferred.reject(status);
        });
      return deferred.promise;
    };


    return {
      /* exQuery.---().then(function(data){}, function(err){}) */
      getAllUserPromise: getAllUserName,
      userLoginPromise: userLogin,
      userRegPromise: userReg,
      userGetPromise: userGet,
      userChangePromise: userChange

    }

  }]);
;