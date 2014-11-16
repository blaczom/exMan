var app = angular.module("exman", ['ngRoute','exFactory','ngSanitize']);

app.controller("ctrlLogin",['$scope','$location','exDb','exAccess',function($scope,$location,exDb,exAccess) {
  var lp = $scope;
  lp.user = exDb.userNew();
  lp.user.NICKNAME =exDb.getUser();
  lp.user.REMPASS =   exDb.getRem();
  lp.runPlatform = exDb.getPlat();
  if (lp.user.REMPASS) lp.user.PASS = exDb.getWord();
  lp.rtnInfo = "";
  lp.userLogin = function () {
    exAccess.userLoginPromise(lp.user).then( function(data) {
        if (data.rtnCode > 0) {
          exDb.setUser(lp.user.NICKNAME);
          exDb.setRem(lp.user.REMPASS);
          exDb.setPlat(lp.runPlatform)
          if (lp.user.REMPASS) exDb.setWord(lp.user.PASS);
          $location.path('/taskList/main');
        }
        else{
          lp.rtnInfo = data.rtnInfo;
        }
      }, function (error) {  lp.rtnInfo = JSON.stringify(status); });
  };
}]);
app.controller("ctrlRegUser", ['$scope','exDb','exAccess',function($scope,exDb,exAccess){
  var lp = $scope;
  lp.user = exDb.userNew();
  lp.user.authCode = "";
  lp.rtnInfo = "";
  lp.userReg = function(){
    exAccess.userRegPromise(lp.user).
      then(function (data) {
          console.log("---got the date", data, typeof(data));
          lp.rtnInfo = data.rtnInfo;
          if (!exDb.getUser()) exDb.setUser(lp.user.NICKNAME);
      } , function (status) {
        lp.rtnInfo = JSON.stringify(status);
      });
  };
}]);
app.controller("ctrlChangUser", ['$scope','exDb','exAccess',function($scope,exDb,exAccess){
  var lp = $scope;
  lp.rtnInfo = "";
  exAccess.userGetPromise().then( function (data){
      if (!exDb.checkRtn(data)) return ;
      lp.rtnInfo = data.rtnInfo;
      if (data.exObj.length > 0) {
        lp.user = data.exObj[0];
        lp.user.oldPass = "";
        lp.user.PASS = "";
        lp.user.PASS2 = "";    //    $scope.$apply();
      }
      else lp.rtnInfo="没找到当前用户。";
    }, function (status) {
      lp.rtnInfo = JSON.stringify(status);
    });

  lp.userChange = function(){
    exAccess.userChangePromise(lp.user).
      then(function (data) {
        lp.rtnInfo = data.rtnInfo;
      }, function (status) {
        lp.rtnInfo = JSON.stringify(status);
      });
  };
}]);
app.controller("ctrlWorkList",['$scope','$routeParams','exDb','exAccess',function($scope,$routeParams,exDb,exAccess){
  var lp = $scope;
  lp.showDebug = false;  // 调试信息打印。
  lp.seek = {  seekContentFlag : false,  seekContent : "", // 是否search任务内容。
    seekStateFlag : true, seekState : ['计划','进行'], // 是否search任务状态。
    seekUserFlag : true, seekUser : exDb.getUser(),  // 是否按照用户搜索
    seekTaskUUID : $routeParams.pid,  // parent taskUUID // 必须要有当前task的id。增加的时候
    seekTask : ($routeParams.pcon || '无内容')    // 显示部分父任务的内容。
  };
  // console.log(lp.seek.seekTaskUUID + ' task uuid');
  lp.seek.seekTaskFlag = lp.seek.seekTaskUUID?true:false;   // 按照父任务搜索所有的子工作。

  lp.locate = { curOffset: 0,  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    limit: 10,      // 当前查询显示限制
    aType: $routeParams.aType    // 查询的页面参数。暂时没用。随便参数。
  };
  lp.rtnInfo = "";   // 返回提示用户的信息。 // lp.task = exDb.taskNew();    // 暂时给遮挡编辑任务页面提供。
  lp.curIndex = null;     //当前编辑的索引值
  lp.editMode = "list";    // 是否在单记录编辑模式。
  lp.planState = exDb.planState;  // 选择的task状态内容。
  lp.workEditMask = function(aShow){
    switch (aShow){
      case 'editsave':
        lp.editMode = 'list';
        break;
      case 'editcancel':
        lp.rtnInfo = "";
        lp.editMode = 'list';
        break;
      case 'editdelete':
        lp.editMode = 'list';
        break;
      case 'listadd':
      case 'listedit':
        lp.rtnInfo = "";
        lp.editMode = 'edit';
        break;
    }
  };
  lp.workAdd = function(aIndex){   // 增加和编辑。
    lp.curIndex = aIndex;
    lp.work = exDb.workNew();
    lp.work.OWNER = exDb.getUser();
    lp.work.STATE = '计划';
    lp.work.MEMPOINT = exDb.memPoint;
    lp.work._exState = 'new';
    if(aIndex != null) {
      lp.work.UPTASK = lp.workSet[aIndex].UPTASK;  // 点那个任务的就增加那个任务下面的记录。
    }
    else{
      lp.work.UPTASK = lp.seek.seekTaskUUID;
    }
    if (lp.work.UPTASK) lp.workEditMask("listadd"); // 工作必须有任务才可以。d
  };
  lp.workEdit = function(aIndex){
    console.log("edit " + aIndex);
    lp.curIndex = aIndex;
    lp.work = lp.workSet[aIndex];
    lp.pristineWork = angular.copy(lp.workSet[aIndex]);
    lp.work.PRIVATE = (lp.work.PRIVATE=="true" || lp.work.PRIVATE==true)?true:false;
    lp.work.MEMEN = (lp.work.MEMEN=="true" || lp.work.MEMEN==true)?true:false;
    lp.work._exState = 'dirty';
    lp.workEditMask("listedit");
  };
  lp.workSave = function(){
    if (lp.work.STATE == exDb.planState[2] && (lp.work.FINISH||'').length==0) lp.work.FINISH = exDb.getDateTime(new Date());
    exAccess.workSavePromise(lp.work)
      .then( function (data) {
        lp.rtnInfo = data.rtnInfo;
        switch (lp.work._exState) {
          case 'dirty':
            lp.work._exState = "clean";
            // lp.workSet[lp.curIndex] = lp.work;
            break;
          case 'new':
            lp.work._exState = "clean";
            lp.workSet.unshift(lp.work);
            break;
        }
        lp.workEditMask("editsave");
      }, function (status) { lp.rtnInfo = JSON.stringify(status) }
    );
  };
  lp.workCancel = function(){
    if (lp.curIndex >= 0 && lp.work._exState!="new") lp.workSet[lp.curIndex] = angular.copy(lp.pristineWork);
    lp.workEditMask("editcancel");
  };
  lp.workDelete = function(){
    exAccess.workDeletePromise(lp.work)
      .then( function (data) {
        lp.rtnInfo = data.rtnInfo;
        if (data.rtnCode > 0){
          for (var i in lp.workSet){
            if (lp.workSet[i].UUID == lp.work.UUID) {
              if (lp.showDebug) console.log("get it delete " + lp.work.UUID);
              lp.workSet.splice(i,1);
              lp.workEditMask("editdelete");
              break;
            }
          }
        }
      }, function (status) {    lp.rtnInfo = JSON.stringify(status);     }
    );
  };
  lp.memCheck = function(){
    lp.work.MEMTIMER = exDb.getDateTime(new Date(), true);
    if ((lp.work.MEMPOINT||'').length > 0);else lp.work.MEMPOINT = exDb.memPoint;
  }
  lp.workfilter = function(){
    //参数重置。
    lp.workSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.locate.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.locate.limit = 10;      // 当前查询显示限制。
    if  (lp.seek.seekUserFlag && ((lp.seek.seekUser||'').length == 0)) lp.seek.seekUserFlag = false;
    lp.workGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
  };
  lp.workGet = function(){
    exAccess.workGetPromise(lp.locate, lp.seek)
      .then(function (data) {
        if (!exDb.checkRtn(data)) return ;
        lp.rtnInfo = data.rtnInfo;
        var ltmp1 = (data.exObj || []);
        if (ltmp1.length > 0){
          lp.locate.curOffset = lp.locate.curOffset + lp.locate.limit;
          for (var i=0; i< ltmp1.length; i++)
            ltmp1._exState = "clean";
          lp.workSet = lp.workSet.concat(ltmp1); // 防止新增加的，再检索出来重复~~
          var hashKey  = {}, lRet = [];
          for (var i in lp.workSet) {
            var key = lp.workSet[i].UUID;
            if (hashKey[key] != 1) { hashKey[key] = 1; lRet.push(lp.workSet[i]);}
          }
          lp.workSet = lRet;
        }
      }, function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
  };
  lp.workMem = function(){
    if (lp.work.MEMEN && (lp.work.MEMPOINT||'').length > 0) {
      if (new Date(lp.work.MEMTIMER) < new Date()){
        var ltmp = lp.work.MEMPOINT.split(','); //  数组，搞到当前时间后面的几天。
        var lgo = parseInt(ltmp.shift());
        lp.work.MEMTIMER = exDb.getDateTime(new Date(new Date() - 0 + lgo * 86400000), true);
        lp.work.MEMPOINT = ltmp.join(',');
      }
    }
    else lp.work.MEMEN = false;

  };
  switch (lp.routeParam)// 查询的页面参数。暂时没用。随便参数。
  {
    case "list":
    default :
      lp.workfilter();  // 默认来一次。
      break;
  }
}]);
app.controller("ctrlExtools",['$scope','exAccess',function($scope, exAccess){
    var lp = $scope;
    lp.postReq = function() {
      var l_param = {sql: lp.txtReq, word: lp.addPass};
      exAccess.extoolsPromise(l_param)
        .then(function (aRtn) {
          // if (!exDb.checkRtn(data)) return ;
          lp.txtReturn = JSON.stringify(aRtn);
        },
        function (err) {
          lp.txtReturn = JSON.stringify(err);
        }
      );
    }
}]);
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider.       // main.html <--------
      when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
      when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
      when('/chang', { templateUrl: '/partials/userChange.html', controller: "ctrlChangUser" }).
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
})


