  var objUser = {
    userName: "",
    userPass: "",
    userPass2: "",
    userPassMd5: "",
    rememberMe: true
  };

  var app = angular.module("exman", ['ngRoute']);

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
    lp.userXReg = function(){
      $http.post('/rest',
        { func: 'mainQuest',
          ex_parm: { queryType: "", sub_func: ""  }
        })
        .success(function (data, status, headers, config) {
          lp.rtnInfo = data.rtnInfo;
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
  }]);

  app.config(['$routeProvider', function($routeProvider) {
      $routeProvider.       // main.html <--------
        when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
        when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
        when('/main', {templateUrl: '/partials/main.html',   controller: "ctrlMain"}).
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


