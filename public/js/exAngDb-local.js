/**
 * Created by blaczom@gmail on 2014/10/25.
 */

angular.module('exFactory', ['exService', 'angular-md5']).
  factory('exQuery', ['$http', '$q','md5', function($http,$q,md5){
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
          deferred.resolve(data); })
        .error(function (data, status, headers, config) {
          deferred.reject(status); });
      return deferred.promise;
    };

    return {
      getAllUserPromise: getAllUserName,
      /* exQuery.getAllUserPromise().then(function(data){},function(err){}) */
      userLoginPromise: userLogin
      /* userLoginPromise(xxx).then ..  */
    }

  }]);
;