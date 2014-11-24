var app = angular.module("exman", ['ngRoute','exService','ngSanitize']);
/* run test
 var app = angular.module("exman", ['ngRoute','exService','exManTest']);
 <script src="/js/exTest.js"></script>
app.run(function(exTestUtil,exTestDb) {
  console.log("=====测试exUtil-----", exTestUtil.checkResult());
  console.log("=====测试exStore----", exTestDb.checkResult());
});
*/
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.       // main.html <--------
      when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
      when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
      when('/change', { templateUrl: '/partials/userChange.html', controller: "ctrlChangUser" }).
      when('/userList/:aType', { templateUrl: '/partials/userList.html', controller: "ctrlUserList" }).
      when('/msgEdit/:id', {templateUrl: '/partials/msgEdit.html',   controller: "ctrlMsgEdit"}).
      when('/taskList/:aType', {templateUrl: '/partials/taskList.html',   controller: "ctrlTaskList"}).
      when('/workList/:aType', {templateUrl: '/partials/workList.html', controller: "ctrlWorkList"}).
      when('/taskAll/:aType', {templateUrl: '/partials/taskAll.html', controller: "ctrlTaskAll"}).
      when('/extools', {templateUrl: '/partials/exTools.html', controller: "ctrlExtools"}).
      otherwise({redirectTo: '/'});
  }]);
app.directive('validDateModel', function() {
  return {
    require:"ngModel",
    link: function (scope, element, attrs, actr) {
      //console.log('link parsers to datetime ' + element[0].id);
      actr.$parsers.unshift(function (viewValue) {
        if ((viewValue||'').length < 1 ) {actr.$setValidity('dateFormat', true); return viewValue;}
        var lstime = new Date(viewValue);
        if ( lstime.getFullYear()>2000 && lstime.getMonth() >=0 && lstime.getDate() >=0    )
        {   actr.$setValidity('dateFormat', true);
          return viewValue;}
        else {
          actr.$setValidity('dateFormat', false);
          return undefined;}
      });
    }
  };
});
app.directive('dirSelectUser', function() {
  return {
    scope:{ dirSelectUser: '='},
    templateUrl: "incSelectUser.html",
    replace:true,
    controller: function($scope){
      var lp = $scope;
      lp.showMe = false;
      lp.selectUser = function(){ lp.showMe=true; console.log(lp); lp.dirSelectUser="changed"; }
    }
  };
});
app.run(function ($rootScope, exUtil) {
  $rootScope.$on('$routeChangeStart', routeChange1);
  function routeChange1(event, aObjTo, aObjFrom) {
    if (aObjFrom && aObjFrom.$$route) {
      switch (aObjFrom.$$route.controller) {
      case "ctrlUserList":
      case "ctrlTaskAll":
      case "ctrlTaskList":
      case "ctrlWorkList":
        exUtil.shareCache.ctrlStateCache[aObjFrom.$$route.controller] = {};
        exUtil.shareCache.ctrlStateCache[aObjFrom.$$route.controller].para = aObjFrom.scope.para;
        break;
      }

    }
    // aObjFrom.$$route.controller == "ctrlTaskList";
  
  }
});