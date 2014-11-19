angular.module('exService', ['angular-md5'])
  .factory('exUtil', function(){
    var UUID = function(){};
    UUID.prototype.createUUID = function(){
      var dg = new Date(1582, 10, 15, 0, 0, 0, 0);
      var dc = new Date();
      var t = dc.getTime() - dg.getTime();
      var tl = UUID.prototype.getIntegerBits(t,0,31);
      var tm = UUID.prototype.getIntegerBits(t,32,47);
      var thv = UUID.prototype.getIntegerBits(t,48,59) + '1'; // version 1, security version is 2
      var csar = UUID.prototype.getIntegerBits(UUID.prototype.rand(4095),0,7);
      var csl = UUID.prototype.getIntegerBits(UUID.prototype.rand(4095),0,7);
      var n = UUID.prototype.getIntegerBits(UUID.prototype.rand(8191),0,7) +
        UUID.prototype.getIntegerBits(UUID.prototype.rand(8191),8,15) +
        UUID.prototype.getIntegerBits(UUID.prototype.rand(8191),8,15) +
        UUID.prototype.getIntegerBits(UUID.prototype.rand(8191),0,15); // this last number is two octets long
      //return tl + '-' + tm  + '-' + thv  + '-' + csar + '-' + csl + n;
      return tl + tm  + thv  + csar + csl + n;  // 32位。去掉-
    };
    UUID.prototype.getIntegerBits = function(val,start,end){
      var base16 = UUID.prototype.returnBase(val,16);
      var quadArray = new Array();
      var quadString = '';
      var i = 0;
      for(i=0;i<base16.length;i++){
        quadArray.push(base16.substring(i,i+1));
      }
      for(i=Math.floor(start/4);i<=Math.floor(end/4);i++){
        if(!quadArray[i] || quadArray[i] == '') quadString += '0';
        else quadString += quadArray[i];
      }
      return quadString;
    };
    UUID.prototype.returnBase = function(number, base){
      return (number).toString(base).toUpperCase();
    };
    UUID.prototype.rand = function(max){
      return Math.floor(Math.random() * (max + 1));
    };
    var getDateTime = function(aTime, aOnlyDate){
      // 向后一天，用 new Date( new Date() - 0 + 1*86400000)
      // 向后一小时，用 new Date( new Date() - 0 + 1*3600000)
      if (!aTime) aTime = new Date();
      var l_date = new Array(aTime.getFullYear(), aTime.getMonth()  < 9 ? '0' + (aTime.getMonth() + 1) : (aTime.getMonth()+1), aTime.getDate() < 10 ? '0' + aTime.getDate() : aTime.getDate());
      if (aOnlyDate)
        return( l_date.join('-')) ; // '2014-01-02'
      else {
        var l_time = new Array(aTime.getHours() < 10 ? '0' + aTime.getHours() : aTime.getHours(), aTime.getMinutes() < 10 ? '0' + aTime.getMinutes() : aTime.getMinutes(), aTime.getSeconds() < 10 ? '0' + aTime.getSeconds() : aTime.getSeconds());
        return( l_date.join('-') + ' ' + l_time.join(':')); // '2014-01-02 09:33:33'
      }
    };

    return {
      createUUID : UUID.prototype.createUUID,
      getDateTime : getDateTime,    // 向后一天，用 new Date( new Date() - 0 + 1*86400000)  1小时3600000
      getDate : function(arg1){ return getDateTime(arg1,true) },
      verifyBool : function (aParam){ return (aParam==true||aParam=="true")?true:false;  }
    }
  })
  .factory('exStore', ['$location',function($location){
    var _debug = true;
    if(window.localStorage) console.log("check success -- > localStorage support!");
    else window.alert('This browser does NOT support localStorage. pls choose allow localstorage');
    var l_store = window.localStorage;
    var _currentUser = (l_store.getItem('exManCurrentLocalUser') || ""),
      _userList = (l_store.getItem('exManLocalUserList') || "{}");

    return{
      getUserList: function(){return JSON.parse(_userList);},
      getUserNameList: function(){
        var la_userName = [];
        for (var i in JSON.parse(_userList)) la_userName.push(i);
        return la_userName;
      },
      setUserList: function(aUser, aPass, aRem) {  // 设置当前用户，名称，密码和保存密码。
        var l_t = JSON.parse(_userList);
        l_t[aUser] = {pass:aPass,rempass:aRem};
        _userList = JSON.stringify(l_t);
        l_store.setItem('exManLocalUserList', _userList);
        _currentUser = aUser; l_store.setItem('exManCurrentLocalUser', aUser)
      },
      clearUserList: function() { _userList = '{}' },
      getUser: function(){  // return {name:, pass:, rempass:}
        var l_name = (arguments.length > 0)?arguments[0]:_currentUser;
        var l_user = JSON.parse(_userList)[l_name];
        if (l_user) l_user.name = l_name; else l_user = {name:'', pass:'', rempass:false};
        return l_user;
      },
      verifyBool: function (aParam){ return (aParam==true||aParam=="true")?true:false;  },
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
      err: function(){
        if ((arguments||[]).length > 0) {
          console.log(arguments);
          l_store.setItem('exManLastErr', JSON.stringify(arguments));
        }
        else
          l_store.setItem('exManLastErr', '');
      },
      appendErr: function(){ console.log(arguments);
        l_store.setItem('exManLastErr', l_store.getItem('exManLastErr') + JSON.stringify(arguments));
      },
      getErr:function(){ return l_store.getItem('exManLastErr') },
      log:function(){if (_debug) console.log(arguments); }
    }
  }])
  .factory('exAccess', ['$http', '$q','md5','exStore','exUtil', function($http,$q,md5,exStore,exUtil){
    //factory('exAccess', ['$q','md5','exStore',function($q,md5,exStore){
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
    var objUser = function() {
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
      this._exState = "new";  // new , clean, dirty.
      this._exDataSet = {};    // 扩展用。日后可以用于前台的数据更新判断. new buffer, old buffer.
    };
    objUser.prototype.new = function(){  return(new objUser()); };
    var objTask = function() {
      this.UUID = exUtil.createUUID();
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
      this._exState = '';
      this._exDataSet = {};
    };
    objTask.prototype.new  = function(){  return(new objTask()); };
    var objWork = function() {
      this.UUID = exUtil.createUUID();
      this.UPTASK = '';
      this.CREATETIME = exUtil.getDateTime(new Date());
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
      this._exState = '';
      this._exDataSet = {};
    };
    objWork.prototype.new = function(){  return(new objWork()); };


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
      userGetPromise: function() { return httpCom('/rest',{func:'userGet', ex_parm:{userName:exStore.getUser().name}})},
      taskSavePromise: function(aobjTask){return httpCom('/rest',{ func: 'taskEditSave', ex_parm: { msgObj: aobjTask}})},
      taskDeletePromise: function(aobjTask) {return httpCom('/rest',{ func: 'taskEditDelete',ex_parm: { msgObj: aobjTask}  })},
      taskListGetPromise: function(aLocate, aFilter) {return httpCom('/rest',{ func: 'taskListGet',ex_parm: { locate: aLocate,filter: aFilter}})},
      taskExpandPromise : function(aUuid){return  httpCom('/rest',{ func: 'taskAllGet', ex_parm: { taskUUID: aUuid }  })},
      workSavePromise : function(aobjWork){return httpCom('/rest',{ func: 'workEditSave',  ex_parm: { msgObj: aobjWork} })},
      workDeletePromise: function(aobjWork){return httpCom('/rest',{func:'workEditDelete',ex_parm:{msgObj:aobjWork}})},
      workGetPromise: function(aLocate, aFilter){ return httpCom('/rest',{ func: 'workListGet', ex_parm:{locate:aLocate,filter: aFilter}})},
      extoolsPromise: function(aParam){ return httpCom('/rest',{ func: 'exTools', ex_parm: aParam })},
      USER : new objUser(),
      TASK : new objTask(),
      WORK : new objWork()

    };
    /**
     * Created by blaczom4gmail on 2014/10/25.
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
  }]);
