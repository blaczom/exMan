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
    scope:false,  // {type:edit/add, idx:xx}
    //<span dir-edit-task="userPack" dir-button-text="buttontest" dir-task-param="{{ {type:'sss', idx:1} }}"></span>
    templateUrl: "incTaskEdit.html",
    replace:true,
    controller: function($scope,exAccess,exStore,exUtil){
      var lp = $scope;    // angular.element("#divEditTask").hide();
      lp.subPara = {
        dirTask: {},
        planState: exAccess.planState,
        curIndex:0
      };
      lp.subPara.showEditor = function(aShow){
        lp.subPara.showEditTask = aShow;
        if (aShow) lp.para.editMode = "editor"; else { lp.para.editMode = "list"; lp.subPara.rtnInfo = '';}
      };
      lp.subPara.dirAddTask = function(aIndex){
        lp.subPara.dirTask = exAccess.TASK.newTask();
        lp.subPara.dirTask.OWNER = exStore.getUser().name;
        lp.subPara.dirTask.STATE = '计划';
        lp.subPara.dirTask._exState = 'new';
        if(aIndex != null){
          lp.subPara.dirTask.UPTASK = lp.para.taskSet[aIndex].UUID;
        }
        lp.subPara.curIndex = aIndex; // 记着
        lp.subPara.showEditor(true);

      };
      lp.subPara.dirEditTask = function(aIndex){
        lp.subPara.dirTask = angular.copy(lp.para.taskSet[aIndex]);
        lp.subPara.dirTask._exState = 'dirty';
        lp.subPara.dirTask.PRIVATE = exUtil.verifyBool(lp.subPara.dirTask.PRIVATE);
        lp.subPara.curIndex = aIndex; // 记着
        lp.subPara.showEditor(true);
      };
      lp.subPara.dirSaveTask = function(aStay){
        if (lp.subPara.dirTask._exState == "clean" && lp.$$childHead.editForm.$dirty) lp.subPara.dirTask._exState="dirty";
        if (lp.subPara.dirTask.STATE == exAccess.planState[2] && (lp.subPara.dirTask.FINISH||'').length==0) lp.subPara.dirTask.FINISH = exUtil.getDateTime(new Date());
        if (lp.subPara.dirTask._exState != "clean" && lp.$$childHead.editForm.$dirty) {
          exAccess.taskSavePromise(lp.subPara.dirTask)
            .then( function (data) {    // 得到新的消息
              lp.subPara.rtnInfo = data.rtnInfo;
              if (data.rtnCode > 0) {
                switch (lp.subPara.dirTask._exState) {
                  case 'dirty':
                    lp.para.taskSet[lp.subPara.curIndex] = lp.subPara.dirTask;
                    break;
                  case 'new':
                    lp.para.taskSet.push(lp.subPara.dirTask);
                    lp.para.taskSet.taskSetUuidAll[lp.subPara.dirTask.UUID] = 1;   // 放到taskSet里面的一个属性。
                    lp.subPara.curIndex = lp.para.taskSet.length - 1;
                    break;
                }
                lp.subPara.dirTask._exState = "clean";
                lp.$$childHead.editForm.$setPristine();
                if (!aStay) lp.subPara.showEditor(false);
              }
          }, function (status) { lp.subPara.rtnInfo = JSON.stringify(status); } );
        } else if (!aStay) lp.subPara.showEditor(false);
      };
      lp.subPara.taskCancel = function() {
        if (lp.$$childHead.editForm.$dirty) {
          if (confirm("确认要放弃更改？")) {
            lp.$$childHead.editForm.$setPristine();
            lp.subPara.showEditor(false);
          }
        }
        else lp.subPara.showEditor(false);
      };
      lp.subPara.taskDelete = function(){
      if (confirm("确认删除？"))
        exAccess.taskDeletePromise(lp.subPara.dirTask)
          .then(function (data) {    // 得到新的消息
            lp.subPara.rtnInfo = data.rtnInfo;
            if (data.rtnCode > 0) {
              for (var i in lp.para.taskSet) {
                if (lp.para.taskSet[i].UUID == lp.subPara.dirTask.UUID) {
                  lp.para.taskSet.splice(i, 1);
                  delete lp.para.taskSet.taskSetUuidAll[lp.subPara.dirTask.UUID];
                  lp.subPara.showEditor(false);
                  break;
                }
              }
            }
          }, function (status) {
            lp.subPara.rtnInfo = JSON.stringify(status);
          });
        };
      //console.log('i am here',lp);
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