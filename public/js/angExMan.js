  var objUser = {
    UUID : "",
    NICKNAME : "",
    PASS : "",
    PASS2: "",
    PASSMd5: "",
    REMPASS : true,
    MOBILE : "",
    EMAIL : "",
    IDCARD : "" ,
    UPMAN : "",
    LEVEL : 0,
    GRANT : 0,
    _exState : "new" // new , clean, dirty.
  };
  function objMsg() {
    this.UUID = "";
    this.CREATETIME= "";
    this.OWNER= "";
    this.MSG= "";
    this.TARGET= "";
    this.OVER= "";
    this.VALIDATE= "";
    this._exState= "new"; // new , clean, dirty.
  };
  function objTask(){
    this.UUID = "";
    this.UPTASK = "" ;
    this.START = "";
    this.FINISH = "";
    this.STATE =  "";
    this.OWNER =  "";
    this.LEVEL =  0;
    this.PRIVATE = false;
    this.CONTENT =  "" ;
    this._exState = "new"; // new , clean, dirty.
  }
  function objWork(){
    this.UUID = "" ;
    this.UPTASK = 0 ;
    this.CREATETIME = "";
    this.UPDATETIME = "";
    this.STATE = "" ;
    this.OWNER = "" ;
    this.PRIVATE = false ;
    this.MEMEN = false ;
    this.MEMTIMER = "" ;
    this.CONTENT =  "";
    this._exState = "new"; // new , clean, dirty.
  }

  var app = angular.module("exman", ['ngRoute', 'exService']);

  app.controller("ctrlLogin", ['$http', '$scope', '$location', function($http, $scope, $location) {
    var lp = $scope;
    lp.user = objUser;
    lp.rtnInfo = "";
    lp.userLogin = function () {
      $http.post('/rest',
        { func: 'userlogin',
          ex_parm: { txtUserName: lp.user.NICKNAME,
            txtUserPwd: lp.user.PASS, remPass: lp.user.REMPASS
          }
        })
        .success(function (data, status, headers, config) {
          if (data.rtnCode > 0) {
            console.log('goo #/main');
            $location.path('/main');
          }
          else{
            lp.rtnInfo = data.rtnInfo;
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    $http.post('/rest',
      { func: 'userPrelogin', ex_parm: { }})
      .success(function (data, status, headers, config) {
        lp.rtnInfo = data.rtnInfo;
        if (data.rtnCode > 0) {
          lp.user.userName = data.ex_parm.username;
          lp.user.userPass = data.ex_parm.userpass;
          lp.user.rememberMe = data.ex_parm.userrem;
        }
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
  }]);
  app.controller("ctrlRegUser", ['$http', '$scope', function($http, $scope){
    var lp = $scope;
    lp.user = objUser;
    lp.rtnInfo = "";
    lp.userReg = function(){
      $http.post('/rest',
        { func: 'userReg',
          ex_parm: { txtUserName: lp.user.NICKNAME, txtUserPwd: lp.user.PASS  }
        })
        .success(function (data, status, headers, config) {
            lp.rtnInfo = data.rtnInfo;
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
  }]);
  app.controller("ctrlMain", ['$http', '$scope', function($http, $scope){
    var lp = $scope;
    lp.rtnInfo = "";
    $http.post('/rest',
      { func: 'mainGet', // my message
        ex_parm: { subTask: "", subWork: ""  }
      })
      .success(function (data, status, headers, config) {
        lp.rtnInfo = data.rtnInfo;
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });

  }]);
  app.controller("ctrlMsgEdit", ['$http', '$scope', '$routeParams', 'exUtil', function($http, $scope, $routeParams, exUtil){
    var lp = $scope;
    lp.id = $routeParams.id;
    lp.rtnInfo = "";
    lp.msg = new objMsg();
    if (lp.id.length > 30){  // 有效的id。说明是edit
      $http.post('/rest',
        { func: 'msgEditGet', // my message
          ex_parm: { msgId: lp.id}
        })
        .success(function (data, status, headers, config) {    // 得到新的消息
          //lp.rtnInfo = data.rtnInfo;
          lp.msg = data.exObj;
          lp.msg._exState = "clean";
          lp.rtnInfo = data.rtnInfo;
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    }
    else{   // 无效id，说明是要添加
      lp.msg.UUID = exUtil.uuid();
      lp.msg.CREATETIME = exUtil.getDateTime(new Date());
      lp.msg._exState = "new";
      lp.msg.VALIDATE = lp.msg.CREATETIME;
      lp.msg.OWNER = objUser.NICKNAME;
    }
    lp.msgSave = function(){
      if (lp.msg._exState == "clean"){ lp.msg._exState = 'dirty' ;}
      $http.post('/rest',
      { func: 'msgEditSave', // my message
        ex_parm: { msgObj: lp.msg }
      })
      .success(function (data, status, headers, config) {    // 得到新的消息
        lp.rtnInfo = data.rtnInfo;
        lp.msg._exState = 'clean';
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
    }
  }]);
  app.controller("ctrlTaskList", ['$http', '$scope', '$routeParams', 'exUtil', function($http, $scope, $routeParams, exUtil)  {
    var lp = $scope;
    lp.aType = $routeParams.aType;
    lp.rtnInfo = "";
    lp.task = new objTask();
    lp.curIndex = null;
    lp.editMode = false;

    switch (lp.aType)
    {
      case "mine":
      case "ought":
      default :
        $http.post('/rest',{ func: 'taskListGet', // my message
          ex_parm: { taskType: lp.aType}
        })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          lp.taskSet = data.exObj || [];
          for (var i=0; i<lp.taskSet.length; i++)
             lp.taskSet[i]._exState = "clean";
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
        break;
    }
    lp.taskAdd = function(aIndex){
      console.log("add " + aIndex);
      lp.curIndex = aIndex;
      lp.task = new objTask();
      lp.task.UUID = exUtil.uuid();
      lp.task.START = exUtil.getDateTime(new Date());
      lp.task.FINISH = lp.task.START;
      lp.task._exState = 'new';
      if(aIndex){
        lp.task.UPTASK = lp.taskSet[aIndex].UUID;
      }
      lp.editMode = true;
    };
    lp.taskEdit = function(aIndex){
      console.log("edit " + aIndex);
      lp.curIndex = aIndex;
      lp.task = lp.taskSet[aIndex];
      lp.task._exState = 'dirty';
      lp.editMode = true;
    };
    lp.taskSave = function(){
      $http.post('/rest',{ func: 'taskEditSave',
        ex_parm: { msgObj: lp.task}
      })
      .success(function (data, status, headers, config) {    // 得到新的消息
        lp.rtnInfo = data.rtnInfo;
        switch (lp.task._exState) {
          case 'dirty':
            lp.taskSet[lp.curIndex] = lp.task;
            break;
          case 'new':
            lp.taskSet.push(lp.task)
            break;
        }
        lp.task._exState = "clean";
        lp.editMode = false;
      })
      .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
      });
    };
    lp.taskCancel = function(){
      lp.editMode = false;
    };
    lp.taskDelete = function(){
      $http.post('/rest',{ func: 'taskEditDelete',
        ex_parm: { msgObj: lp.task}
      })
      .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          if (lp.rtnCode > 0){
            for (var i in lp.taskSet){
              if (lp.taskSet[i].UUID = lp.task.UUID) lp.taskSet.splice(i,1);
              break;
            }
            lp.editMode = false;
          }
      })
      .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
      });
    };
    lp.taskTest =function(aIndex){lp.rtnInfo = "asdfasdfa"; lp.editMode=true; }
  }]);

  app.config(['$routeProvider', function($routeProvider) {
      $routeProvider.       // main.html <--------
        when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
        when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
        when('/main', {templateUrl: '/partials/main.html',   controller: "ctrlMain"}).
        when('/msgEdit/:id', {templateUrl: '/partials/msgEdit.html',   controller: "ctrlMsgEdit"}).
        when('/taskList/:aType', {templateUrl: '/partials/taskList.html',   controller: "ctrlTaskList"}).
        otherwise({redirectTo: '/'});
    }]);

     /*config(['depProvider', function(depProvider){

      when('/login', {templateUrl: './partials/login.html',   controller: regUser}).
      when('/main', {templateUrl: './partials/main.html',   controller: regUser}).
      when('/task/:phoneId', {templateUrl: './partials/phone-detail.html', controller: PhoneDetailCtrl}).
      //...
     }]).
     factory('serviceId', ['depService', function(depService) {
     //...
     }]).
     directive('directiveName', ['depService', function(depService) {
     //...
     }]).
     filter('filterName', ['depService', function(depService) {
     // ...
     }]).
     run(['depService', function(depService) {
     //  ...
     }]).*/


