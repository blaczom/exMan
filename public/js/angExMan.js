  var objUser = {
    userName: "",
    userPass: "",
    userPass2: "",
    userPassMd5: "",
    rememberMe: true
  };
  function objMsg() {
    this.UUID = "";
    this.CREATETIME= "";
    this.OWNER= "";
    this.MSG= "";
    this.TARGET= "";
    this.OVER= "";
    this.VALIDATE= "";
    this._exState= "new" // new , clean, dirty.
  };
  var app = angular.module("exman", ['ngRoute', 'exService']);

  app.controller("ctrlLogin", ['$http', '$scope', '$location', function($http, $scope, $location) {
    var lp = $scope;
    lp.user = objUser;
    lp.rtnInfo = "";
    lp.userLogin = function () {
      $http.post('/rest',
        { func: 'userlogin',
          ex_parm: { txtUserName: lp.user.userName,
            txtUserPwd: lp.user.userPass, remPass: lp.user.rememberMe
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
          ex_parm: { txtUserName: lp.user.userName, txtUserPwd: lp.user.userPass  }
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
      { func: 'mainQueMsg', // my message
        ex_parm: { queryType: "", sub_func: ""  }
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
          lp.msg = date;
          lp.msg._exState = "clean";
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    }
    else{   // 无效id，说明是要添加
      lp.msg.UUID = exUtil.uuid;
      lp.msg.CREATETIME = exUtil.getDateTime(new Date());
      lp.msg._exState = "new";
      lp.msg.VALIDATE = lp.msg.CREATETIME;
      lp.msg.OWNER = objUser.userName;
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
  app.config(['$routeProvider', function($routeProvider) {
      $routeProvider.       // main.html <--------
        when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
        when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
        when('/main', {templateUrl: '/partials/main.html',   controller: "ctrlMain"}).
        when('/msgEdit/:id', {templateUrl: '/partials/msgEdit.html',   controller: "ctrlMsgEdit"}).
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


