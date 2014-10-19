/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', ['exService', 'LocalStorageModule']).
  config(['localStorageServiceProvider', function(localStorageServiceProvider){
    localStorageServiceProvider.setPrefix('exPrefix');}]). // .setStorageCookieDomain('example.com');  // .setStorageType('sessionStorage');
  factory('exDb', ['exUtil', '$http', '$q', 'localStorageService',  function(exUtil, $http, $q, localStorageService){
    var objUser = function(){
      this.NICKNAME = '';
      this.PASS = '';
      this.REMPASS = '';
      this.MOBILE = '';
      this.EMAIL = '';
      this.IDCARD = '';
      this.UPUSER = '';
      this.LEVEL = '';
      this.GRANT = '';
      this.SYNC = '';
      this._exState = "new"  // new , clean, dirty.
    }
    var objTask = function(){
      this.UUID = exUtil.uuid();
      this.UPTASK = '';
      this.PLANSTART = exUtil.getDateTime(new Date());
      this.PLANFINISH = exUtil.getDateTime(new Date( new Date() - 0 + 1*86400000));
      this.FINISH = '';
      this.STATE = '';
      this.OWNER = '';
      this.OUGHT = '';
      this.PRIVATE = '';
      this.CONTENT = '';
      this.SYNC = '';
      this._exState='new';
    }
    var objWork = function(){
      this.UUID = exUtil.uuid();
      this.UPTASK = '';
      this.CREATETIME = exUtil.getDateTime(new Date());;
      this.LASTMODIFY = '';
      this.OWNER = '';
      this.PRIVATE = '';
      this.LEVEL = '';
      this.CONTENT = '';
      this.MEMPOINT = '';
      this.MEMEN = '';
      this.MEMTIMER = '';
      this.STATE = '';
      this.SYNC = '';
      this._exState='new';
    }

    var getAllUserName = function(){
      var deferred = $q.defer();
      $http.post('/rest',{ func: 'userGetAll', // my message
        ex_parm: { } })
        .success(function (data, status, headers, config) {    // 得到新的消息
          deferred.resolve(data); // ls_rtn.exObj = []  exObj
          })
        .error(function (data, status, headers, config) {
          deferred.reject(error);
        });
      return deferred.promise;
    };

    var _currentUser = (localStorageService.get('localUser') || ""),
      _currentLevel = (localStorageService.get('localLevel') || "0"),
      _useWord = (localStorageService.get('localWord') || ""),
      _remWord = (localStorageService.get('localRem') || "");

    return{
      userNew: function() { return new objUser() },
      workNew: function() { return new objWork() },
      taskNew : function() { return new objTask() },
      planState : ['计划','进行','结束'],
      memPoint : '1,2,4,7,15',
      getAllUserPromise: function() {  return getAllUserName();
        /* var promise = getAllUserName();
        promise.then( function (data) {
          var lrtn = [];
          for (var i in data) {   lrtn.push(data[i].NICKNAME)  }
        }, function (reason) { console.log(reason); return []  }); */
      },
      setUser: function(aUser) { _currentUser = aUser;  localStorageService.set('localUser', aUser) },
      getUser: function(){ return _currentUser },
      setLevel: function(aParam) { _currentLevel = aParam; localStorageService.set('localLevel', aParam) },
      getLevel: function(){return _currentLevel},
      setWord: function(aParam) { _useWord = aParam; localStorageService.set('localWord', aParam) },
      getWord: function(){return _useWord},
      getRem: function(){return _remWord},
      setRem: function(aParam) {
        _remWord = aParam;
        localStorageService.set('localRem', aParam);
        if (!aParam){
          localStorageService.set('localWord', ''); // 。
        }

      }
    }
  }]);