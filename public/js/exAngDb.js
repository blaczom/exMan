/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', ['exService', 'angular-md5']).
  factory('exDb', ['exUtil', '$q', '$location',function(exUtil,$q,$location){
    if(window.localStorage){
      console.log("check success -- > localStorage support!");
    }else{
      alert('This browser does NOT support localStorage');
    }
    var localStorageService = window.localStorage;
    var _debug = true;
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

    var _runPlatform = (localStorageService.getItem('exManPlatform') || "");

    return{
      userNew: function() { return new objUser() },
      workNew: function() { return new objWork() },
      taskNew : function() { return new objTask() },
      planState : ['计划','进行','结束'],
      memPoint : '1,1,2,4,7,15',
      getDateTime: getDateTime,
      setUser: function(aUser) { _currentUser = aUser;  localStorageService.setItem('exManlocalUser', aUser) },
      getUser: function(){ return _currentUser },
      setLevel: function(aParam) { _currentLevel = aParam; localStorageService.setItem('exManlocalLevel', aParam) },
      getLevel: function(){return _currentLevel},
      setWord: function(aParam) { _useWord = aParam; localStorageService.setItem('exManlocalWord', aParam) },
      getWord: function(){return _useWord},
      getRem: function(){return (_remWord=="true" || _remWord==true)?true:false; },
      setRem: function(aParam) {  _remWord = aParam;  localStorageService.setItem('exManlocalRem', aParam);
        if (!aParam){   localStorageService.setItem('exManlocalWord', '');  }
      },
      setPlat: function(aParam) { _runPlatform = aParam; localStorageService.setItem('exManPlatform', aParam) },
      getPlat: function(){return (_runPlatform=="true" || _runPlatform==true)?true:false; },
      checkRtn: function(aRtn) {
        if (aRtn.rtnCode == 0) {
          switch (aRtn.appendOper) {
            case 'login':
              $location.path('/');
              return false;
              break;
          }
        }
        return true;
      },
      setDebug: function(){ if (_debug) console.log(arguments) }
    }
  }])
;