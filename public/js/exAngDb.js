/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', ['exService']).
  factory('exDb', ['exUtil', '$http', '$q',  function(exUtil, $http, $q){
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
    var _currentUser = "";
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

    return{
      userNew: function() { return new objUser() },
      workNew: function() { return new objWork() },
      taskNew : function() { return new objTask() },
      planState : ['计划','进行','结束'],
      setUser: function(aUser) {_currentUser = aUser},
      getUser: function(){return _currentUser},
      getAllUserPromise: function() {  return getAllUserName();
        /* var promise = getAllUserName();
        promise.then( function (data) {
          var lrtn = [];
          for (var i in data) {   lrtn.push(data[i].NICKNAME)  }
        }, function (reason) { console.log(reason); return []  }); */
      }
    }
  }]);