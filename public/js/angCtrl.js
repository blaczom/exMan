/**
 * Created by Administrator on 2014/11/16.
 */
var app = angular.module("exman");
app.controller("ctrlIndex",function($scope,$location,exStore,exUtil) {
  // 全局的control。因为我是主页哈哈哈。
  var lp = $scope;
  lp.currentUser = exStore.getUser().name;
  lp.$on('event:login', function(){
    lp.currentUser = exStore.getUser().name;
    exUtil.shareCache.ctrlStateCache = {}; // 清空。。。
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
  lp.namePattern = new RegExp('(\\w|@|\\.)+');
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
    locate: {
      curOffset: 0 ,   // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      limit: 10       // 当前查询显示限制
    },

    aType: $routeParams.aType ,   // 查询的页面参数。暂时没用。随便参数。
    curIndex : null,     //当前编辑的索引值
    rtnInfo : "",        // 返回提示用户的信息。
    editMode : "list",    // 是否在单记录编辑模式。
    planState : exAccess.planState,  // 选择的task状态内容。
    task: {},
    noData:false
  };
  lp.para.taskSet.taskSetUuidAll = {};  // 储存所有uuid。用于记录是否已经存在此记录。

  lp.subWorkList = function(aIndex) {   // 列出他的子任务。
    $location.path('/workList/list').search(
      {pid:lp.para.taskSet[aIndex].UUID, pcon:lp.para.taskSet[aIndex].CONTENT.substr(0,15) }
    );
  };
  lp.taskfilter = function(){
    //参数重置。    
    lp.para.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.para.taskSet.taskSetUuidAll = {};
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
            if (!lp.para.taskSet.taskSetUuidAll[ltmp1[i].UUID]){
              lp.para.taskSet.taskSetUuidAll[ltmp1[i].UUID] = 1;
              lp.para.taskSet.push(ltmp1[i]);
            }
          }
          if (ltmp1.length < lp.para.locate.limit ) lp.para.noData = true;
        }
		    else lp.para.noData = true;
      },function (status) {
        lp.para.rtnInfo = JSON.stringify(status);
      });
  };
  switch (lp.para.aType)
  {
    case "user":
      lp.para.seek.seekUser = $routeParams.pname;
      if ((lp.para.seek.seekUser).length != 0){
        lp.para.seek.seekUserFlag = true;
        lp.taskfilter();}
      break;
    case "navi":
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
    task: {},
    noData: false,
    expandMark : "",  // preFix 的前面标志，他所有的孩子都会是这个开头。。。
    taskSetExpand: {} // 储存所有隐藏的task，下次点击的时候，应该显示。
  };
  lp.para.taskSet.taskSetUuidAll = {}; // 储存所有uuid。用于记录是否已经存在此记录。

  lp.subWorkList = function(aIndex) {   // 列出他的子任务。
    $location.path('/workList/list').search(
      {pid:lp.para.taskSet[aIndex].UUID, pcon:lp.para.taskSet[aIndex].CONTENT.substr(0,15) });
  };

  lp.taskExpend = function(aIndex){
    lp.para.curIndex = aIndex;
    var l_uuid = lp.para.taskSet[aIndex].UUID;
    var l_preFix = lp.para.taskSet[aIndex].preFix||'';  // 子前面的缩进
    if (lp.para.haveClicked.indexOf(l_uuid + ",") >= 0 ) {    // 已经检索到客户端了。
      if (lp.para.taskSetExpand[lp.para.taskSet[aIndex].UUID]) {
        delete lp.para.taskSetExpand[lp.para.taskSet[aIndex].UUID];
        angular.element("div[expandselect]:contains('" + lp.para.taskSet[aIndex].expandMark + "')").show();
      }
      else {
        angular.element("div[expandselect]:contains('" + lp.para.taskSet[aIndex].expandMark + "')").hide();
        lp.para.taskSetExpand[lp.para.taskSet[aIndex].UUID] = 1;
      }
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
            ltmp1[i].expandMark =  l_preIndent + ltmp1[i].preFix + "-";   //  用来选择的[expandMark~="..1-"]{display:none;} inherit
            ltmp1[i].classShow = "subExpand";  // 子记录的标志
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
          }
          [].splice.apply(lp.para.taskSet, [aIndex + 1, 0].concat(ltmp1))
        }
      }, function (status) {    lp.para.rtnInfo = JSON.stringify(status);
      });
  };

  lp.taskfilter = function(){    // 任务梯次信息。
    //参数重置。
    lp.para.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.para.taskSet.taskSetUuidAll = {};
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
            ltmp1[i].expandMark = l_preIndent + ltmp1[i].preFix + "-";     //  用来选择的[expandMark~="..1-"]{display:none;} inherit
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
            ltmp1[i].classShow = "prefixHead";
            if (!lp.para.taskSet.taskSetUuidAll[ltmp1[i].UUID]){
              lp.para.taskSet.taskSetUuidAll[ltmp1[i].UUID] = 1;
              lp.para.taskSet.push(ltmp1[i]);
            }
          }
          lp.para.locate.curOffset = lp.para.locate.curOffset + lp.para.locate.limit;
          if (ltmp1.length < lp.para.locate.limit ) lp.para.noData = true;
        }
        else lp.para.noData = true;
      }, function (status) { lp.para.rtnInfo = JSON.stringify(status); });
  };
  switch (lp.aType)
  {
    case "navi":
    default :
      if (exUtil.shareCache.ctrlStateCache["ctrlTaskAll"])
        lp.para = exUtil.shareCache.ctrlStateCache["ctrlTaskAll"].para;  // 当前网页的数据集合。
      else
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
app.controller("ctrlWorkList",function($scope,$routeParams,exStore,exAccess,exUtil){
  var lp = $scope;
  lp.para = {
    showDebug:false,
    seek : {  seekContentFlag : false, seekContent:"",
      seekStateFlag : true,    seekState : ['计划','进行'], // 是否search任务状态。
      seekUserFlag : true,     seekUser : exStore.getUser().name,  // 是否按照用户搜索
      seekTaskUUID : $routeParams.pid,                    // parent taskUUID // 必须要有当前task的id。增加的时候
      seekTask : ($routeParams.pcon || '无内容'),    // 显示部分父任务的内容。
      seekTaskFlag : false   // 按照父任务搜索所有的子工作。
    },
    locate : {
      curOffset: 0,  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      limit: 10      // 当前查询显示限制
    },
    aType : $routeParams.aType,   // 查询的页面参数。
    rtnInfo : "",   // 返回提示用户的信息。 // lp.task = exStore.taskNew();    // 暂时给遮挡编辑任务页面提供。
    curIndex : null,     //当前编辑的索引值
    editMode : "list",    // 是否在单记录编辑模式。
    planState : exAccess.planState,  // 选择的task状态内容。
    workSetUuidAll:{},
    workSet:[],
    work: {},
    noData:false,
    elementDisabled : {}
  };
  lp.workEditMask = function(aShow){
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
      case 'listadd':
      case 'listedit':
        lp.para.rtnInfo = "";
        lp.para.editMode = 'edit';
        break;
    }
  };
  lp.workAdd = function(aIndex){   // 增加和编辑。
    lp.para.curIndex = aIndex;
    lp.para.work = exAccess.WORK.newWork();
    lp.para.work.OWNER = exStore.getUser().name;
    lp.para.work.LEVEL = 99;   // 默认leve是99，大家都能够看到哈。  // level越小权限越大，建议10个数一个level。
    lp.para.work.STATE = '计划';
    lp.para.work.MEMPOINT = exAccess.memPoint;
    lp.para.work._exState = 'new';
    if(aIndex != null) {
      lp.para.work.UPTASK = lp.para.workSet[aIndex].UPTASK;  // 点那个任务的就增加那个任务下面的记录。
    }
    else{
      lp.para.work.UPTASK = lp.para.seek.seekTaskUUID;
    }
    if (lp.para.work.UPTASK) lp.workEditMask("listadd"); // 工作必须有任务才可以。d
  };
  lp.workGetParent = function(aUUID){   // 返回父任务的内容。
    lp.para.elementDisabled["workGetParent"] = 1;
    exAccess.taskGetPromise(aUUID)
      .then(function (data) {
        lp.para.rtnInfo = data.rtnInfo;
        if (data.exObj.length > 0 ) lp.para.work.parent = data.exObj[0];
        delete lp.para.elementDisabled["workGetParent"]
      }, function (err) { lp.para.rtnInfo = JSON.stringify(err); delete lp.para.elementDisabled["workGetParent"]; }  )
  };
  lp.workEdit = function(aIndex){
    lp.para.curIndex = aIndex;
    lp.para.work = lp.para.workSet[aIndex];
    lp.para.pristineWork = angular.copy(lp.para.workSet[aIndex]);
    lp.para.work.PRIVATE = exUtil.verifyBool(lp.para.work.PRIVATE);
    lp.para.work.MEMEN = exUtil.verifyBool(lp.para.work.MEMEN);
    lp.para.work._exState = 'dirty';
    lp.workEditMask("listedit");
  };
  lp.workSave = function(aClose){
    if (lp.para.work._exState == "clean" && lp.editForm.$dirty) lp.para.work._exState="dirty";
    lp.para.work.LASTMODIFY = exUtil.getDateTime(new Date());
    if (lp.para.work._exState != "clean" && lp.editForm.$dirty)
      exAccess.workSavePromise(lp.para.work)
        .then( function (data) {
          lp.para.rtnInfo = data.rtnInfo;
          if (data.rtnCode > 0) {
            switch (lp.para.work._exState) {
              case 'dirty':
                lp.para.work._exState = "clean";
                break;
              case 'new':
                lp.para.work._exState = "clean";
                lp.para.workSet.splice(lp.para.curIndex+1,0,lp.para.work);
                lp.para.workSetUuidAll[lp.para.work.UUID] = 1;
                break;
            }
            lp.editForm.$setPristine();
          }
        }, function (status) { lp.para.rtnInfo = JSON.stringify(status); aClose=false; }
      );
    if(aClose) lp.workEditMask("editsave");
  };
  lp.workCancel = function(){
    if (lp.editForm.$dirty){
      if (confirm("确认要放弃更改？")) {
        if (lp.para.curIndex >= 0 && lp.para.work._exState!="new") lp.para.workSet[lp.para.curIndex] = angular.copy(lp.para.pristineWork);
        lp.editForm.$setPristine();
        lp.workEditMask("editcancel");
      }
    }
    else
      lp.workEditMask("editcancel");
  };
  lp.workDelete = function(){
    if (confirm("确认删除？")) {
      exAccess.workDeletePromise(lp.para.work)
        .then(function (data) {
          lp.para.rtnInfo = data.rtnInfo;
          if (data.rtnCode > 0) {
            for (var i in lp.para.workSet) {
              if (lp.para.workSet[i].UUID == lp.para.work.UUID) {
                if (lp.para.showDebug) console.log("get it delete " + lp.para.work.UUID);
                lp.para.workSet.splice(i, 1);
                delete lp.para.workSetUuidAll[lp.para.work.UUID];
                lp.workEditMask("editdelete");
                break;
              }
            }
          }
          else {}
        }, function (status) {
          lp.para.rtnInfo = JSON.stringify(status);
        }
      );
    }
  };
  lp.memCheck = function(){
    lp.para.work.MEMTIMER = exUtil.getDateTime(new Date(), true);
    if ((lp.para.work.MEMPOINT||'').length > 0);else lp.para.work.MEMPOINT = exAccess.memPoint;
  };
  lp.workfilter = function(){
    //参数重置。
    lp.para.workSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.para.workSetUuidAll = {};
    lp.para.locate.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.para.locate.limit = 10;      // 当前查询显示限制。
    lp.para.noData = false;
    if  (lp.para.seek.seekUserFlag && ((lp.para.seek.seekUser||'').length == 0)) lp.para.seek.seekUserFlag = false;
    // 按照父任务搜索所有的子工作。
    lp.workGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
  };
  lp.workGet = function(){
    exAccess.workGetPromise(lp.para.locate, lp.para.seek)
      .then(function (data) {
        if (!exAccess.checkRtn(data)) return ;
        lp.para.rtnInfo = data.rtnInfo;
        lp.para.workSet = [];
        var ltmp1 = (data.exObj || []);
        if (ltmp1.length > 0){
          lp.para.locate.curOffset = lp.para.locate.curOffset + lp.para.locate.limit;
          for (var i=0; i< ltmp1.length; i++){
            ltmp1._exState = "clean";
            ltmp1[i].PRIVATE = exUtil.verifyBool(ltmp1[i].PRIVATE);
            if (!lp.para.workSetUuidAll[ltmp1[i].UUID]){
              lp.para.workSetUuidAll[ltmp1[i].UUID] = 1;
              lp.para.workSet.push(ltmp1[i]);
            }
          }
          if (ltmp1.length < lp.para.locate.limit ) lp.para.noData = true;
        }
        else lp.para.noData = true;
      }, function (data, status, headers, config) {
        lp.para.rtnInfo = JSON.stringify(status);
      });
  };
  lp.workMem = function(){
    if (lp.para.work.MEMEN && (lp.para.work.MEMPOINT||'').length > 0) {
      if (new Date(lp.para.work.MEMTIMER) < new Date()){
        var ltmp = lp.para.work.MEMPOINT.split(','); //  数组，搞到当前时间后面的几天。
        var lgo = parseInt(ltmp.shift());
        lp.para.work.MEMTIMER = exUtil.getDateTime(new Date(new Date() - 0 + lgo * 86400000), true);
        lp.para.work.MEMPOINT = ltmp.join(',');
      }
    }
    else lp.para.work.MEMEN = false;

  };
  switch ($routeParams.aType)// 查询的页面参数。暂时没用。随便参数。
  {
    case "list":
      if (exUtil.shareCache.ctrlStateCache["ctrlWorkList"]) {
        lp.para = exUtil.shareCache.ctrlStateCache["ctrlWorkList"].para;  // 当前网页的数据集合。
        if ($routeParams.pid && (lp.para.seek.seekTaskUUID != $routeParams.pid))   // 必须要有当前task的id。增加的时候
        {
          lp.para.seek.seekTaskUUID = $routeParams.pid;
          lp.para.seek.seekTask = ($routeParams.pcon || '无内容');    // 显示部分父任务的内容。
          if  ((lp.para.seek.seekTaskUUID||'').length == 0) lp.para.seek.seekTaskFlag = false; else lp.para.seek.seekTaskFlag = true;
          lp.workfilter();
        }
        break;
      }
      else
        lp.workfilter();  // 默认来一次。
      break;
    case 'user':
      lp.para.seek.seekUser = $routeParams.pname;
      if ((lp.para.seek.seekUser).length != 0){
        lp.para.seek.seekUserFlag = true;
        lp.workfilter();}
      break;
    case "navi":
    default :
      if (exUtil.shareCache.ctrlStateCache["ctrlWorkList"]) {
        lp.para = exUtil.shareCache.ctrlStateCache["ctrlWorkList"].para;  // 当前网页的数据集合。
      }
      else
        lp.workfilter();  // 默认来一次。
      break;
  }
});
app.controller("ctrlUserList", function($scope,exStore,exUtil,exAccess){
  var lp = $scope;
  lp.para = {
    rtnInfo : "",
    userSet:"",
    seek : {  seekUserFlag : true, seekUser : exStore.getUser().name
    }
  };
  lp.userfilter = function(){
    exAccess.userListGetPromise(lp.para.seek)
    .then( function (data){
      if (!exAccess.checkRtn(data)) return ;
      lp.para.rtnInfo = data.rtnInfo;
      if (data.exObj.length > 0) {
        lp.para.userSet = data.exObj
      }
      else lp.rtnInfo="没找到当前用户。";
    }, function (status) {
      lp.rtnInfo = JSON.stringify(status);
    });
  };
  if (exUtil.shareCache.ctrlStateCache["ctrlUserList"]) {
    lp.para = exUtil.shareCache.ctrlStateCache["ctrlUserList"].para;  // 当前网页的数据集合。
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
