/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', ['exService']).
  factory('exDb', ['exUtil', function(exUtil){
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
    return{
      userNew: function() { return new objUser() },
      workNew: function() { return new objWork() },
      taskNew : function() { return new objTask() },
      planState : ['计划','进行','结束'],
      setUser: function(aUser) {_currentUser = aUser},
      getUser: function(){return _currentUser}
    }
  }]);