/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', ['exService']).
  factory('exDb', ['exUtil', '$http', '$q', function(exUtil, $http, $q){
    if(window.localStorage){
    }else{
      alert('This browser does NOT support localStorage');
    }
    var localStorageService = window.localStorage;

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

    var getDateTime = function(aTime, aOnlyDate){
      // 向后一天，用 new Date( new Date() - 0 + 1*86400000)
      // 向后一小时，用 new Date( new Date() - 0 + 1*3600000)
      var l_date = new Array(aTime.getFullYear(), aTime.getMonth()  < 9 ? '0' + (aTime.getMonth() + 1) : (aTime.getMonth()+1), aTime.getDate() < 10 ? '0' + aTime.getDate() : aTime.getDate());
      var l_time = new Array(aTime.getHours() < 10 ? '0' + aTime.getHours() : aTime.getHours(), aTime.getMinutes() < 10 ? '0' + aTime.getMinutes() : aTime.getMinutes(), aTime.getSeconds() < 10 ? '0' + aTime.getSeconds() : aTime.getSeconds());
      if (aOnlyDate)
        return( l_date.join('-')) ; // '2014-01-02'
      else
        return( l_date.join('-') + ' ' + l_time.join(':')); // '2014-01-02 09:33:33'
    };

    var _currentUser = (localStorageService.getItem('exManlocalUser') || ""),
      _currentLevel = (localStorageService.getItem('exManlocalLevel') || "0"),
      _useWord = (localStorageService.getItem('exManlocalWord') || ""),
      _remWord = (localStorageService.getItem('exManlocalRem') || "");

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
      getDateTime: getDateTime,
      setUser: function(aUser) { _currentUser = aUser;  localStorageService.setItem('exManlocalUser', aUser) },
      getUser: function(){ return _currentUser },
      setLevel: function(aParam) { _currentLevel = aParam; localStorageService.setItem('exManlocalLevel', aParam) },
      getLevel: function(){return _currentLevel},
      setWord: function(aParam) { _useWord = aParam; localStorageService.setItem('exManlocalWord', aParam) },
      getWord: function(){return _useWord},
      getRem: function(){return _remWord},
      setRem: function(aParam) {  _remWord = aParam;  localStorageService.setItem('exManlocalRem', aParam);
        if (!aParam){   localStorageService.setItem('exManlocalWord', '');  }
      }
    }
  }]);