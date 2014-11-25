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
        //console.log('ctrl is', scope);
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
app.directive('dirEditTask', function() { //<span dir-edit-task="" dir-button-text="" dir-task-param=""></span>
  return {
    scope:{ outTaskSet: '=dirEditTask', dirButtonText:"@", dirTaskParam:"@"},  // {type:edit/add, idx:xx}
    //<span dir-edit-task="userPack" dir-button-text="buttontest" dir-task-param="{{ {type:'sss', idx:1} }}"></span>
    templateUrl: "incTaskEdit.html",
    replace:true,
    controller: function($scope, exAccess,exStore,exUtil){
      var lp = $scope;
      lp.showMe = false;
      lp.dirParam = JSON.parse(lp.dirTaskParam);  // 属性传递进来的是字符串。
      lp.curIndex = lp.dirParam.idx;
      lp.rtnInfo = "";
      lp.dirTask = {};
      lp.showDebug = false;
      lp.planState =  exAccess.planState;
      lp.dirEditTask = function(){
        switch (lp.dirParam.type){   // 增加和编辑。
          case "add":    {   // 增加
            lp.dirTask = exAccess.TASK.newTask();
            lp.dirTask.OWNER = exStore.getUser().name;
            lp.dirTask.STATE = '计划';
            lp.dirTask._exState = 'new';
            if(lp.curIndex != null){
              lp.dirTask.UPTASK = lp.outTaskSet[lp.curIndex].UUID;
            }
            break;
          }
          case 'edit': {   // 编辑。
            lp.dirTask = angular.copy(lp.outTaskSet[lp.curIndex]);
            lp.dirTask._exState = 'dirty';
            lp.dirTask.PRIVATE = exUtil.verifyBool(lp.dirTask.PRIVATE);
            break;
          }
        }
        lp.showMe = true;
      };
      lp.dirSaveTask = function(aStay){
        if (lp.dirTask._exState == "clean" && lp.editForm.$dirty) lp.dirTask._exState="dirty";
        if (lp.dirTask.STATE == exAccess.planState[2] && (lp.dirTask.FINISH||'').length==0) lp.dirTask.FINISH = exUtil.getDateTime(new Date());
        if (lp.dirTask._exState != "clean" && lp.editForm.$dirty) {
          exAccess.taskSavePromise(lp.dirTask)
          .then( function (data) {    // 得到新的消息
            lp.rtnInfo = data.rtnInfo;
            if (data.rtnCode > 0) {
              switch (lp.dirTask._exState) {
                case 'dirty':
                  lp.outTaskSet[lp.curIndex] = lp.dirTask;
                  break;
                case 'new':
                  lp.outTaskSet.splice(lp.curIndex + 1, 0, lp.dirTask);
                  lp.outTaskSet.taskSetUuidAll[lp.dirTask.UUID] = 1;   // 放到taskSet里面的一个属性。
                  break;
              }
              lp.dirTask._exState = "clean";
              lp.editForm.$setPristine();
              if (!aStay) lp.showMe = false;
            }
          }, function (status) { lp.rtnInfo = JSON.stringify(status); } );
        }
      };
      lp.taskCancel = function() {
        if (lp.editForm.$dirty) {
          if (confirm("确认要放弃更改？")) {
            lp.editForm.$setPristine();
            lp.showMe = false;
          }
        }
        else lp.showMe = false;
      };
      lp.taskDelete = function(){
        if (confirm("确认删除？"))
          exAccess.taskDeletePromise(lp.dirTask)
          .then(function (data) {    // 得到新的消息
            lp.rtnInfo = data.rtnInfo;
            if (data.rtnCode > 0) {
              for (var i in lp.outTaskSet) {
                if (lp.outTaskSet[i].UUID == lp.dirTask.UUID) {
                  lp.outTaskSet.splice(i, 1);
                  delete lp.outTaskSet.taskSetUuidAll[lp.dirTask.UUID];
                  lp.showMe = false;
                  break;
                }
              }
            }
          }, function (status) {
            lp.rtnInfo = JSON.stringify(status);
          });
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