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
        console.log('ctrl is', scope);
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
    scope:{ userOutPack: '=dirSelectUser'},
    templateUrl: "incSelectUser.html",
    replace:true,
    controller: function($scope, exAccess){
      var lp = $scope;
      lp.showMe = false;      
      lp.selectUser = function(){  
        lp.showMe=true;
        lp.userBeenSelectedSet = lp.userOutPack.split(',');
        lp.userBeenSelectedSet.pop();  // 去掉前后2个逗号
        lp.userBeenSelectedSet.shift();
        exAccess.getAllUserPromise().then( function (data) {
          var lrtn = data.exObj;
          lp.userToBeChooseSet =[];
          for (var i in lrtn) {  
            if (lp.userOutPack.indexOf(","+ lrtn[i].NICKNAME + ",") < 0 ) lp.userToBeChooseSet.push(lrtn[i].NICKNAME); 
          };      
        }, function (reason) { console.log(reason); lp.userToBeChooseSet = []  });
      };
      lp.selectUserMoveIn = function(aIn){
        if (aIn) {   // in
          for (var i in lp.userToBeChoose){
            lp.userToBeChooseSet.splice( lp.userToBeChooseSet.indexOf(lp.userToBeChoose[i]) ,  1);
            lp.userBeenSelectedSet.push(lp.userToBeChoose[i]);
          }
          lp.userToBeChoose = [];
        }
        else{  // out
          for (var i in lp.userBeenSelected){
            lp.userBeenSelectedSet.splice(lp.userBeenSelectedSet.indexOf(lp.userBeenSelected[i]), 1);
            lp.userToBeChooseSet.push(lp.userBeenSelected[i]);
          }
          lp.userBeenSelected = [];
        }
      };
      lp.selectUserRtn = function(aOk){
        /// 根据选中的用户进行。
        if (aOk) lp.userOutPack = "," + lp.userBeenSelectedSet.join(",") + ",";
        lp.showMe=false;          
      };
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