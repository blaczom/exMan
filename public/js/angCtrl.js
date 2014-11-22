/**
 * Created by Administrator on 2014/11/16.
 */
var app = angular.module("exman");
app.controller("ctrlIndex",function($scope,$location,exStore) {
  var lp = $scope;
  lp.currentUser = exStore.getUser().name;
  lp.$on('event:login', function(){
    lp.currentUser = exStore.getUser().name;
  });
});
app.controller("ctrlLogin",function($rootScope,$scope,$location,exStore,exAccess) {
  var lp = $scope;
  lp.rtnInfo = "";
  lp.l_logUser = exStore.getUserList();   // 下拉菜单用户名。
  lp.l_tmpUser = exStore.getUser();       // 当前用户

  lp.userLogin = function () {
    lp.user = exAccess.USER.newUser();
    lp.user.NICKNAME = lp.l_tmpUser.name;
    lp.user.REMPASS = lp.l_tmpUser.rempass;
    lp.user.PASS = lp.l_tmpUser.pass;
    exAccess.userLoginPromise(lp.user).then( function(data) {
      if (data.rtnCode > 0) {
        exStore.setUserList(lp.user.NICKNAME, lp.user.PASS, lp.user.REMPASS );
        $rootScope.$broadcast('event:login');
        $location.path('/taskList/main');
      }
      else{
        lp.rtnInfo = data.rtnInfo;
      }
    }, function (error) {  lp.rtnInfo = JSON.stringify(status); });
  };
});
app.controller("ctrlRegUser", function($scope,exStore,exAccess){
  var lp = $scope;
  lp.user = exAccess.USER.newUser();
  lp.user.authCode = "";
  lp.rtnInfo = "";
  lp.userReg = function(){
    exAccess.userRegPromise(lp.user).
      then(function (data) {
        exStore.log("---got the rtn date", data);
        lp.rtnInfo = data.rtnInfo;
        if (!exStore.getUser()) exStore.setUser(lp.user.NICKNAME);
      } , function (status) {
        lp.rtnInfo = JSON.stringify(status);
      });
  };
});
app.controller("ctrlTaskList",function($scope,$routeParams,$location,exStore,exAccess,exUtil){
  var lp = $scope;
  lp.para = {
    showDebug: false, // 显示网页的隐藏字段
    seek : {seekContentFlag: false, seekContent : "",   // 是否search任务内容。
      seekStateFlag : true,  seekState : ['计划','进行'],  // 是否search任务状态。
      seekUserFlag : true, seekUser : exStore.getUser().name       // 是否按照用户搜索
    },
    taskSet: [] ,  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    taskSetUuidAll: {}, // 储存所有uuid。用于记录是否已经存在此记录。
    locate: {
      curOffset: 0 ,   // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      limit: 10       // 当前查询显示限制
    },

    aType: $routeParams.aType ,   // 查询的页面参数。暂时没用。随便参数。
    curIndex : null,     //当前编辑的索引值
    rtnInfo : "",        // 返回提示用户的信息。
    editMode : "list",    // 是否在单记录编辑模式。
    planState : exAccess.planState,  // 选择的task状态内容。
    task: {}
  };

  lp.taskEditMask = function(aShow){
    switch (aShow){
      case 'editsave':
        lp.para.editMode = 'list';
        break;
      case 'editcancel':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'list';
        break;
      case 'editdelete':
        lp.para.editMode = 'list';
        break;
      case 'usercancel':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'usersave':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'listadd':
      case 'listedit':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'userSelect':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'user';
        break;
    }
  };
  lp.taskAdd = function(aIndex){   // 增加和编辑。
    lp.para.curIndex = aIndex;
    lp.para.task = exAccess.TASK.newTask();
    lp.para.task.OWNER = exStore.getUser().name;
    lp.para.task.STATE = '计划';
    lp.para.task._exState = 'new';
    if(aIndex != null){
      lp.para.task.UPTASK = lp.para.taskSet[aIndex].UUID;
    }
    lp.taskEditMask("listadd");
  };
  lp.subWorkList = function(aIndex) {   // 列出他的子任务。
    $location.path('/workList/list').search(
      {pid:lp.para.taskSet[aIndex].UUID, pcon:lp.para.taskSet[aIndex].CONTENT.substr(0,15) }
    );
  };
  lp.taskEdit = function(aIndex){
    lp.para.curIndex = aIndex;
    lp.para.task = lp.para.taskSet[aIndex];
    lp.para.pristineTask = angular.copy(lp.para.taskSet[aIndex]);
    lp.para.task._exState = 'dirty';
    lp.para.task.PRIVATE = (lp.para.task.PRIVATE=="true" || lp.para.task.PRIVATE==true)?true:false;
    lp.taskEditMask("listedit");
  };
  lp.taskSave = function(){
    if (lp.para.task.STATE == exAccess.planState[2] && (lp.para.task.FINISH||'').length==0) lp.para.task.FINISH = exUtil.getDateTime(new Date());
    exAccess.taskSavePromise(lp.para.task)
      .then( function (data) {    // 得到新的消息
        lp.para.rtnInfo = data.rtnInfo;
        switch (lp.para.task._exState) {
          case 'dirty':
            lp.para.task._exState = "clean";
            lp.para.taskSet[lp.para.curIndex] = lp.para.task;
            break;
          case 'new':
            lp.para.task._exState = "clean";
            lp.para.taskSet.splice(lp.para.curIndex+1,0,lp.para.task);
            lp.para.taskSetUuidAll[lp.para.task.UUID] = 1;
            break;
        }
        lp.taskEditMask("editsave");
      }, function (status) { lp.para.rtnInfo = JSON.stringify(status); } );
  };
  lp.taskCancel = function(){
    lp.taskEditMask("editcancel");
    if (lp.para.curIndex >= 0  && lp.para.task._exState!="new") lp.taskSet[lp.para.curIndex] = lp.para.pristineTask;
  };
  lp.taskDelete = function(){
    exAccess.taskDeletePromise(lp.para.task)
      .then(function (data) {    // 得到新的消息
        lp.para.rtnInfo = data.rtnInfo;
        if (data.rtnCode > 0){
          for (var i in lp.para.taskSet){
            if (lp.para.taskSet[i].UUID == lp.para.task.UUID) {
              if (lp.para.showDebug) console.log("get it delete " + lp.para.task.UUID);
              lp.para.taskSet.splice(i,1);
              delete lp.para.taskSetUuidAll[lp.para.task.UUID];
              lp.taskEditMask("editdelete");
              break;
            }
          }
        }
      }, function (status) {
        lp.para.rtnInfo = JSON.stringify(status); }
    );
  };
  lp.taskfilter = function(){
    //参数重置。    
    lp.para.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.para.taskSetUuidAll = {};

    lp.para.locate.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.para.locate.limit = 10;      // 当前查询显示限制。
    lp.para.noData = false;
    if  (lp.para.seek.seekUserFlag && ((lp.para.seek.seekUser||'').length == 0)) lp.para.seek.seekUserFlag = false;
    lp.taskGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
  };
  lp.taskGet = function(){
    exAccess.taskListGetPromise(lp.para.locate, lp.para.seek)
      .then(function (data) {    // 得到新的消息
        if (!exAccess.checkRtn(data)) return ;
        lp.para.rtnInfo = data.rtnInfo;
        var ltmp1 = data.exObj;
        if (ltmp1.length > 0){
          lp.para.locate.curOffset = lp.para.locate.curOffset + lp.para.locate.limit;
          for (var i=0; i< ltmp1.length; i++) {
            ltmp1[i]._exState = "clean";
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
            if (!lp.para.taskSetUuidAll[ltmp1[i].UUID]){
              lp.para.taskSetUuidAll[ltmp1[i].UUID] = 1;
              lp.para.taskSet.push(ltmp1[i]);
            }
          }
          if (ltmp1.length < lp.para.locate.limit ) lp.para.noData = true;
        }
		else lp.para.noData = true;
      },function (status) {
        lp.para.rtnInfo = JSON.stringify(status);
      });
  }
  lp.selectUser = function(){
    (lp.para.allSelectUser = lp.para.task.OUGHT.split(',')).pop();
    exAccess.getAllUserPromise().then( function (data) {
      var lrtn = data.exObj;
      lp.para.allOtherUser =[];
      console.log(lrtn);
      for (var i in lrtn) {  if (lp.para.task.OUGHT.indexOf(lrtn[i].NICKNAME + ",") < 0 ) lp.para.allOtherUser.push(lrtn[i].NICKNAME); };
      lp.taskEditMask('userSelect');
    }, function (reason) { console.log(reason); lp.para.allOtherUser = []  });

  };
  lp.selectUserMoveOut = function(aInOut, aArray){

    if (aInOut) {   // out
      for (var i in aArray){
        lp.para.allSelectUser.splice( lp.para.allSelectUser.indexOf(aArray[i]) ,  1);
        lp.para.allOtherUser.push(aArray[i]);
      }
    }
    else{
      for (var i in aArray){
        lp.para.allOtherUser.splice(lp.para.allOtherUser.indexOf(aArray[i]), 1);
        lp.para.allSelectUser.push(aArray[i]);
      }
    }
  };
  lp.selectUserOk = function(){
    /// 根据选中的用户进行。
    lp.para.task.OUGHT = lp.para.allSelectUser.join(",") + ",";
    lp.taskEditMask('usersave');
  };
  switch (lp.aType)
  {
    case "main":
    default :
      if (exUtil.shareCache.ctrlStateCache["ctrlTaskList"]) {        
        lp.para = exUtil.shareCache.ctrlStateCache["ctrlTaskList"].para;  // 当前网页的数据集合。
      }
      else 
        lp.taskfilter();  // 默认来一次。
      break;
  }
});
app.controller("ctrlTaskAll",function($scope,$routeParams,$location,exStore,exAccess,exUtil){
  var lp = $scope;
  var l_preIndent = '..';
  lp.para = {
    showDebug: false, // 显示网页的隐藏字段
    seek: {seekContentFlag: false, seekContent: "",   // 是否search任务内容。
      seekStateFlag: true, seekState: ['计划', '进行'],  // 是否search任务状态。
      seekUserFlag: true, seekUser: exStore.getUser().name       // 是否按照用户搜索.
      ,seekTop: true  // 传递给后台用的，表示和tasklist的检索区别。
    },
    taskSet: [],  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    taskSetUuidAll: {}, // 储存所有uuid。用于记录是否已经存在此记录。
    locate: {
      curOffset: 0,   // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      limit: 10       // 当前查询显示限制
    },
    haveClicked : "",   // 是否已经展开过。已展开不再展开。
    aType: $routeParams.aType ,   // 查询的页面参数。暂时没用。随便参数。
    curIndex : null,     //当前编辑的索引值
    rtnInfo : "",        // 返回提示用户的信息。
    editMode : "list",    // 是否在单记录编辑模式。
    planState : exAccess.planState,  // 选择的task状态内容。
    task: {}
  };

  lp.taskEditMask = function(aShow){
    switch (aShow){
      case 'editsave':
        lp.para.editMode = 'list';
        break;
      case 'editcancel':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'list';
        break;
      case 'editdelete':
        lp.para.editMode = 'list';
        break;
      case 'usercancel':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'usersave':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'listadd':
      case 'listedit':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
      case 'userSelect':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'user';
        break;
    }
  };
  lp.taskAdd = function(aIndex){   // 增加和编辑。
    lp.para.curIndex = aIndex;
    lp.para.task = exAccess.TASK.newTask();
    lp.para.task.OWNER = exStore.getUser().name;
    lp.para.task.STATE = '计划';
    lp.para.task._exState = 'new';
    lp.para.task.classShow = "subExpand";

    if(aIndex != null){
      lp.para.task.UPTASK = lp.para.taskSet[aIndex].UUID;
      lp.para.task.preFix = l_preIndent + lp.para.taskSet[aIndex].preFix + "-新";
    }
    lp.taskEditMask("listadd")
  };
  lp.subWorkList = function(aIndex) {   // 列出他的子任务。
    $location.path('/workList/list').search(
      {pid:lp.para.taskSet[aIndex].UUID, pcon:lp.para.taskSet[aIndex].CONTENT.substr(0,15) });
  };
  lp.taskEdit = function(aIndex){
    lp.para.curIndex = aIndex;
    lp.para.task = lp.para.taskSet[aIndex];
    lp.para.pristineTask = angular.copy(lp.para.taskSet[aIndex]);
    lp.para.task._exState = 'dirty';
    lp.para.task.PRIVATE = (lp.para.task.PRIVATE=="true" || lp.para.task.PRIVATE==true)?true:false;
    lp.taskEditMask("listedit");
  };
  lp.taskExpend = function(aIndex){
    lp.para.curIndex = aIndex;
    var l_uuid = lp.para.taskSet[aIndex].UUID;
    var l_preFix = lp.para.taskSet[aIndex].preFix||'';  // 子前面的缩进
    if (lp.para.haveClicked.indexOf(l_uuid + ",") >= 0 ) {
      // 隐藏这个下面的选项卡。lp.para.taskSet[aIndex].()
      return ; // 已经展开了。
    }
    exAccess.taskExpandPromise(l_uuid)
      .then( function (data) {
        if (!exAccess.checkRtn(data)) return ;
        lp.para.haveClicked = lp.para.haveClicked + l_uuid + ",";
        lp.para.rtnInfo = data.rtnInfo;
        var ltmp1 = data.exObj;
        if (ltmp1.length > 0){
          for (var i=0; i< ltmp1.length; i++) {
            ltmp1[i]._exState = "clean";
            ltmp1[i].preFix = l_preIndent + l_preFix + "-" + String(i + 1);
            ltmp1[i].classShow = "subExpand";
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
          }
          [].splice.apply(lp.para.taskSet, [aIndex + 1, 0].concat(ltmp1))
        }
      }, function (status) {    lp.para.rtnInfo = JSON.stringify(status);
      });
  };
  lp.taskSave = function(){
    if (lp.para.task.STATE == exAccess.planState[2] && (lp.para.task.FINISH||'').length==0) lp.para.task.FINISH = exUtil.getDateTime(new Date());
    exAccess.taskSavePromise(lp.para.task)
      .then( function (data) {    // 得到新的消息
        lp.para.rtnInfo = data.rtnInfo;
        switch (lp.para.task._exState) {
          case 'dirty':
            lp.para.task._exState = "clean";
            lp.para.taskSet[lp.curIndex] = lp.para.task;
            break;
          case 'new':
            lp.para.task._exState = "clean";
            lp.para.taskSet.splice(lp.para.curIndex+1,0,lp.para.task);
            lp.para.taskSetUuidAll[lp.para.task.UUID] = 1;
            break;
        }
        lp.taskEditMask("editsave");
      }, function (status) { lp.para.rtnInfo = JSON.stringify(status); } );
  };
  lp.taskCancel = function(){
    lp.taskEditMask("editcancel");
    if (lp.para.curIndex >= 0  && lp.para.task._exState!="new") lp.para.taskSet[lp.para.curIndex] = lp.para.pristineTask;
  };
  lp.taskDelete = function(){
    exAccess.taskDeletePromise(lp.task)
      .then(function (data) {    // 得到新的消息
        lp.para.rtnInfo = data.rtnInfo;
        if (data.rtnCode > 0){
          for (var i in lp.para.taskSet){
            if (lp.para.taskSet[i].UUID == lp.para.task.UUID) {
              if (lp.para.showDebug) console.log("get it delete " + lp.para.task.UUID);
              lp.para.taskSet.splice(i,1);
              delete lp.para.taskSetUuidAll[lp.para.task.UUID];
              lp.taskEditMask("editdelete");
              break;
            }
          }
        }
      }, function (status) {
        lp.para.rtnInfo = JSON.stringify(status); }
    );
  };
  lp.taskfilter = function(){
    //参数重置。
    lp.para.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.para.taskSetUuidAll = {};
    lp.para.locate.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.para.locate.limit = 10;      // 当前查询显示限制。
    lp.para.noData = false;     // 是否显示下10条数据。
    lp.para.haveClicked = "";
    if  (lp.para.seek.seekUserFlag && ((lp.para.seek.seekUser||'').length == 0)) lp.para.seek.seekUserFlag = false;
    lp.taskGet();  // 应该把状态push进去，否则还是按照原来的逻辑进行get。
  };
  lp.taskGet = function(){
    exAccess.taskListGetPromise(lp.para.locate, lp.para.seek)
      .then(function (data) {
        if (!exAccess.checkRtn(data)) return ;
        lp.para.rtnInfo = data.rtnInfo;
        var ltmp1 = data.exObj ;
        if (ltmp1.length > 0){
          for (var i=0; i< ltmp1.length; i++) {
            ltmp1[i]._exState = "clean";
            ltmp1[i].preFix = String(i + lp.para.locate.curOffset + 1);
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
            ltmp1[i].classShow = "prefixHead";
            if (!lp.para.taskSetUuidAll[ltmp1[i].UUID]){
              lp.para.taskSetUuidAll[ltmp1[i].UUID] = 1;
              lp.para.taskSet.push(ltmp1[i]);
            }
          }
          lp.para.locate.curOffset = lp.para.locate.curOffset + lp.para.locate.limit;
          if (ltmp1.length < lp.para.locate.limit ) lp.para.noData = true;
        }
        else lp.para.noData = true;
      }, function (status) { lp.para.rtnInfo = JSON.stringify(status); });
  };
  lp.selectUser = function(){
    (lp.para.allSelectUser = lp.para.task.OUGHT.split(',')).pop();
    exAccess.getAllUserPromise().then( function (data) {
      var lrtn = data.exObj;
      for (var i in lrtn) {  if (lp.para.task.OUGHT.indexOf(lrtn[i].NICKNAME + ",") < 0 ) lp.para.allOtherUser.push(lrtn[i].NICKNAME); };
      lp.taskEditMask('userSelect');
    }, function (reason) { console.log(reason); lp.para.allOtherUser = []  });
  };
  lp.selectUserMoveOut = function(aInOut, aArray){
    if (aInOut) {   // out
      for (var i in aArray){
        lp.para.allSelectUser.splice( lp.para.allSelectUser.indexOf(aArray[i]) ,  1);
        lp.para.allOtherUser.push(aArray[i]);
      }
    }
    else{
      for (var i in aArray){
        lp.para.allOtherUser.splice(lp.para.allOtherUser.indexOf(aArray[i]), 1);
        lp.para.allSelectUser.push(aArray[i]);
      }
    }
  };
  lp.selectUserOk = function(){
    /// 根据选中的用户进行。
    lp.para.task.OUGHT = lp.para.allSelectUser.join(",") + ",";
    lp.taskEditMask('usersave');
  };
  switch (lp.aType)
  {
    case "main":
    default :
      lp.taskfilter();  // 默认来一次。
      break;
  }
});


app.controller("ctrlChangUser", ['$scope','exStore','exAccess',function($scope,exStore,exAccess){
  var lp = $scope;
  lp.rtnInfo = "";
  exAccess.userGetPromise().then( function (data){
    if (!exAccess.checkRtn(data)) return ;
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
app.controller("ctrlWorkList",function($scope,$routeParams,exStore,exAccess){
  var lp = $scope;
  lp.showDebug = false;  // 调试信息打印。
  lp.seek = {  seekContentFlag : false,  seekContent : "", // 是否search任务内容。
    seekStateFlag : true, seekState : ['计划','进行'], // 是否search任务状态。
    seekUserFlag : true, seekUser : exStore.getUser(),  // 是否按照用户搜索
    seekTaskUUID : $routeParams.pid,  // parent taskUUID // 必须要有当前task的id。增加的时候
    seekTask : ($routeParams.pcon || '无内容')    // 显示部分父任务的内容。
  };
  // console.log(lp.seek.seekTaskUUID + ' task uuid');
  lp.seek.seekTaskFlag = lp.seek.seekTaskUUID?true:false;   // 按照父任务搜索所有的子工作。

  lp.locate = { curOffset: 0,  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    limit: 10,      // 当前查询显示限制
    aType: $routeParams.aType    // 查询的页面参数。暂时没用。随便参数。
  };
  lp.rtnInfo = "";   // 返回提示用户的信息。 // lp.task = exStore.taskNew();    // 暂时给遮挡编辑任务页面提供。
  lp.curIndex = null;     //当前编辑的索引值
  lp.editMode = "list";    // 是否在单记录编辑模式。
  lp.planState = exStore.planState;  // 选择的task状态内容。
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
    lp.work = exAccess.WORK.newWork();
    lp.work.OWNER = exStore.getUser().name;
    lp.work.STATE = '计划';
    lp.work.MEMPOINT = exAccess.memPoint;
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
    if (lp.work.STATE == exAccess.planState[2] && (lp.work.FINISH||'').length==0) lp.work.FINISH = exUtil.getDateTime(new Date());
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
    lp.work.MEMTIMER = exUtil.getDateTime(new Date(), true);
    if ((lp.work.MEMPOINT||'').length > 0);else lp.work.MEMPOINT = exAccess.memPoint;
  };
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
        if (!exAccess.checkRtn(data)) return ;
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
        lp.work.MEMTIMER = exUtil.getDateTime(new Date(new Date() - 0 + lgo * 86400000), true);
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
});
app.controller("ctrlExtools",function($scope,exAccess,exUtil){
  var lp = $scope;
  lp.md5String = exUtil.md5String;

  lp.postReq = function() {
    var l_param = {sql: lp.txtReq, word: exUtil.md5String(lp.addPass) };
    exAccess.extoolsPromise(l_param)
      .then(function (aRtn) {
        // if (!exAccess.checkRtn(data)) return ;
        lp.txtReturn = JSON.stringify(aRtn);
      },
      function (err) {
        lp.txtReturn = JSON.stringify(err);
      }
    );
  }
});
app.controller("testtest",function($window,$scope,exAccess,exUtil){
  var lp = $scope;
  lp.test1 = "111";
  lp.userPack = {name:"", filter:""};
  exAccess.getAllUserPromise().then(function(data){
    lp.testUser = [];
    for (var i in data.exObj) lp.testUser.push(data.exObj[i].NICKNAME);
  }, function(err){console.log(err)});
  lp.showme = function(){
    console.log(lp.test1);
    exUtil.shareCache.testSelectUser = lp.test1;
  };
  lp.showme2 = function(){
    console.log(exUtil.shareCache.testSelectUser);

  };



});
