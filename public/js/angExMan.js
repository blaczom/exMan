  var app = angular.module("exman", ['ngRoute','exFactory', 'angular-md5']);

  app.controller("ctrlLogin", ['$http', '$scope', '$location', 'exDb','md5', function($http, $scope, $location, exDb,md5) {
    var lp = $scope;
    lp.user = exDb.userNew();
    lp.user.NICKNAME =exDb.getUser();
    lp.user.REMPASS =   exDb.getRem();
    lp.user.REMPASS = (lp.user.REMPASS=="true" || lp.user.REMPASS===true)?true:false;
    if (lp.user.REMPASS) lp.user.PASS = exDb.getWord();
    lp.rtnInfo = "";
    lp.userLogin = function () {
      $http.post('/rest',
        { func: 'userlogin',
          ex_parm: { txtUserName: lp.user.NICKNAME,
            txtUserPwd: md5.createHash(lp.user.NICKNAME + lp.user.PASS), remPass: lp.user.REMPASS
          }
        })
        .success(function (data, status, headers, config) {
          if (data.rtnCode > 0) {
            $location.path('/taskList/main');
            exDb.setUser(lp.user.NICKNAME);
            exDb.setRem(lp.user.REMPASS);
            if (lp.user.REMPASS) exDb.setWord(lp.user.PASS);
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
  app.controller("ctrlRegUser", ['$http','$scope','exDb','md5',function($http, $scope, exDb,md5){
    var lp = $scope;
    lp.user = exDb.userNew();
    lp.user.authCode = "";
    lp.rtnInfo = "";
    lp.userReg = function(){
      lp.user.md5Pass = md5.createHash(lp.user.NICKNAME + lp.user.PASS);
      lp.user.pass = lp.user.pass2 = "";  // 防止网络传输明码。
      $http.post('/rest',
        { func: 'userReg',
          //ex_parm: { txtUserName: lp.user.NICKNAME, txtUserPwd: lp.user.PASS, authCode:lp.user.authCode   }
          ex_parm: {regUser: lp.user}
        })
        .success(function (data, status, headers, config) {
            lp.rtnInfo = data.rtnInfo;
            exDb.setUser(lp.user.NICKNAME);
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
  }]);
  app.controller("ctrlChangUser", ['$http','$scope','exDb','md5',function($http, $scope, exDb,md5){
    var lp = $scope;
    lp.rtnInfo = "";
    $http.post('/rest',{ func: 'userGet', // my message
      ex_parm: { userName : exDb.getUser()   }
    })
      .success(function (data, status, headers, config) {    // 得到新的消息
        lp.rtnInfo = data.rtnInfo;
        if ((data.exObj || []).length > 0) {
          lp.user = data.exObj[0];
          lp.user.oldPass = "";
          lp.user.PASS = "";
          lp.user.PASS2 = "";
//          $scope.$apply();
          console.log(lp.user);
        }
        else lp.rtnInfo="没找到当前用户。";
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });

    lp.userChange = function(){

      var l_user = angular.copy(lp.user);
      if ((l_user.PASS||'').length > 0)
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.PASS);
      else
        l_user.md5Pass = md5.createHash(l_user.NICKNAME + l_user.oldPass);
      l_user.oldPass = md5.createHash(l_user.NICKNAME + l_user.oldPass);

      $http.post('/rest',
        { func: 'userChange',
          //ex_parm: { txtUserName: lp.user.NICKNAME, txtUserPwd: lp.user.PASS, authCode:lp.user.authCode   }
          ex_parm: {regUser: l_user}
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
  app.controller("ctrlTaskList",['$http','$scope','$routeParams','$location','exDb',function($http,$scope,$routeParams,$location,exDb){
    var lp = $scope;
    lp.showDebug = false;  // 调试信息打印。
    lp.seekContentFlag = false; lp.seekContent = ""; // 是否search任务内容。
    lp.seekStateFlag = true; lp.seekState = ['计划','进行']; // 是否search任务状态。
    lp.seekUserFlag = true; lp.seekUser = exDb.getUser();  // 是否按照用户搜索
    lp.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.limit = 5;      // 当前查询显示限制。
    lp.aType = $routeParams.aType;    // 查询的页面参数。暂时没用。随便参数。
    lp.selectUserMode = false;
    lp.rtnInfo = "";   // 返回提示用户的信息。   // lp.task = exDb.taskNew();    // 暂时给遮挡编辑任务页面提供。
    lp.curIndex = null;     //当前编辑的索引值
    lp.editMode = false;    // 是否在单记录编辑模式。
    lp.planState = exDb.planState;  // 选择的task状态内容。
    lp.taskEditMask = function(aShow){
      if (aShow) { lp.rtnInfo = ''}
      lp.editMode = aShow;
    }
    lp.taskAdd = function(aIndex){   // 增加和编辑。
      console.log("add " + aIndex);
      lp.curIndex = aIndex;
      lp.task = exDb.taskNew();
      lp.task.OWNER = exDb.getUser();
      lp.task.STATE = '计划';
      lp.task._exState = 'new';
      if(aIndex != null){
        lp.task.UPTASK = lp.taskSet[aIndex].UUID;
      }
      lp.taskEditMask(true);
    };
    lp.subWorkList = function(aIndex) {   // 列出他的子任务。
      $location.path('/workList/list').search({pid:lp.taskSet[aIndex].UUID, pcon:lp.taskSet[aIndex].CONTENT.substr(0,15) });
    }
    lp.taskEdit = function(aIndex){
      console.log("edit " + aIndex);
      lp.curIndex = aIndex;
      lp.task = lp.taskSet[aIndex];
      lp.pristineTask = angular.copy(lp.taskSet[aIndex]);
      lp.task._exState = 'dirty';
      lp.task.PRIVATE = (lp.task.PRIVATE=="true" || lp.task.PRIVATE===true)?true:false;
      lp.taskEditMask(true);
    };
    lp.taskSave = function(){
      if (lp.task.STATE == exDb.planState[2] && (lp.task.FINISH||'').length==0) lp.task.FINISH = exDb.getDateTime(new Date());
      $http.post('/rest',{ func: 'taskEditSave',
        ex_parm: { msgObj: lp.task}
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          switch (lp.task._exState) {
            case 'dirty':
              lp.task._exState = "clean";
              lp.taskSet[lp.curIndex] = lp.task;
              break;
            case 'new':
              lp.task._exState = "clean";
              lp.taskSet.unshift(lp.task);
              break;
          }
          lp.taskEditMask(false);
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskCancel = function(){
      lp.taskEditMask(false);
      if (lp.curIndex >= 0  && lp.task._exState!="new") lp.taskSet[lp.curIndex] = lp.pristineTask;
    };
    lp.taskDelete = function(){
      $http.post('/rest',{ func: 'taskEditDelete',ex_parm: { msgObj: lp.task}  })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          if (data.rtnCode > 0){
            for (var i in lp.taskSet){
              if (lp.taskSet[i].UUID == lp.task.UUID) {
                if (lp.showDebug) console.log("get it delete " + lp.task.UUID);
                lp.taskSet.splice(i,1);
                lp.taskEditMask(false);
                break;
              }
            }
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskfilter = function(){
      //参数重置。
      lp.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
      lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      lp.limit = 5;      // 当前查询显示限制。
      if  (lp.seekUserFlag && ((lp.seekUser||'').length == 0)) lp.seekUserFlag = false;
      lp.filterCache = {  seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
        seekStateFlag: lp.seekStateFlag , seekState: lp.seekState,
        seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser
      }
      lp.taskGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
    };
    lp.taskGet = function(){
      $http.post('/rest',{ func: 'taskListGet', // my message
        ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset,
            filter: lp.filterCache
        }
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          var ltmp1 = (data.exObj || []);
          if (ltmp1.length > 0){
            lp.curOffset = lp.curOffset + lp.limit;
            for (var i=0; i< ltmp1.length; i++)
              ltmp1._exState = "clean";
            lp.taskSet = lp.taskSet.concat(ltmp1); // 防止新增加的，再检索出来重复~~
            var hashKey  = {}, lRet = [];
            for (var i in lp.taskSet) {
              var key = lp.taskSet[i].UUID;
              if (hashKey[key] != 1) { hashKey[key] = 1; lRet.push(lp.taskSet[i]);}
            }
            lp.taskSet = lRet;
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    }
    lp.selectUser = function(){
      (lp.allSelectUser = lp.task.OUGHT.split(',')).pop();
      exDb.getAllUserPromise().then( function (data) {
        var lrtn = data.exObj;
        lp.allOtherUser =[];
        console.log(lrtn);
        for (var i in lrtn) {  if (lp.task.OUGHT.indexOf(lrtn[i].NICKNAME + ",") < 0 ) lp.allOtherUser.push(lrtn[i].NICKNAME); };
        lp.selectUserMode=true;
      }, function (reason) { console.log(reason); lp.allOtherUser = []  });

    };
    lp.selectUserMove = function(aInOut){
      if (aInOut) {
        for (var i in lp.userSelected){
          lp.allSelectUser.splice(lp.allSelectUser.indexOf(lp.userSelected[i]), 1);
          lp.allOtherUser.push(lp.userSelected[i]);
        }
      }
      else{
        for (var i in lp.userOthers){
          lp.allOtherUser.splice(lp.allOtherUser.indexOf(lp.userOthers[i]), 1);
          lp.allSelectUser.push(lp.userOthers[i]);
        }
      }
    };
    lp.selectUserOk = function(){
      /// 根据选中的用户进行。
      lp.task.OUGHT = lp.allSelectUser.join(",") + ",";
      lp.selectUserMode = false;
    };
    switch (lp.aType)
    {
      case "main":
      default :
        lp.taskfilter();  // 默认来一次。
        break;
    }
  }]);
  app.controller("ctrlWorkList",['$http','$scope','$routeParams','exDb',function($http,$scope,$routeParams,exDb){
      var lp = $scope;
      lp.showDebug = false;  // 调试信息打印。
      lp.seekContentFlag = false; lp.seekContent = ""; // 是否search任务内容。
      lp.seekStateFlag = true; lp.seekState = ['计划','进行']; // 是否search任务状态。
      lp.seekUserFlag = true; lp.seekUser = exDb.getUser();  // 是否按照用户搜索

      //console.log($routeParams);      ///workList/list').search({pid:lp.taskSet[aIndex].UUID, pcon:lp.taskSet[aIndex].CONTENT.substr(0,15) });
      lp.routeParam = $routeParams.aType;
      lp.seekTaskUUID = $routeParams.pid;  // parent taskUUID // 必须要有当前task的id。增加的时候
      lp.seekTask = ($routeParams.pcon || '无内容');
      if (lp.seekTaskUUID) lp.seekTaskFlag = true;       // console.log($routeParams);
      lp.workSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
      lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      lp.limit = 5;      // 当前查询显示限制。
      lp.selectUserMode = false;
      lp.rtnInfo = "";   // 返回提示用户的信息。 // lp.task = exDb.taskNew();    // 暂时给遮挡编辑任务页面提供。
      lp.curIndex = null;     //当前编辑的索引值
      lp.editMode = false;    // 是否在单记录编辑模式。
      lp.planState = exDb.planState;  // 选择的task状态内容。
      lp.workEditMask = function(aShow){
        if (aShow) { lp.rtnInfo = ''}
        lp.editMode = aShow;

      }
      lp.workAdd = function(aIndex){   // 增加和编辑。
        console.log("add " + aIndex);
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
          lp.work.UPTASK = lp.seekTaskUUID;
        }
        if (lp.work.UPTASK) lp.workEditMask(true); // 工作必须有任务才可以。d
      };
      lp.workEdit = function(aIndex){
        console.log("edit " + aIndex);
        lp.curIndex = aIndex;
        lp.work = lp.workSet[aIndex];
        lp.pristineWork = angular.copy(lp.workSet[aIndex]);
        lp.work.PRIVATE = (lp.work.PRIVATE=="true" || lp.work.PRIVATE===true)?true:false;
        lp.work._exState = 'dirty';
        lp.workEditMask(true);
      };
      lp.workSave = function(){
        if (lp.work.STATE == exDb.planState[2] && (lp.work.FINISH||'').length==0) lp.work.FINISH = exDb.getDateTime(new Date());
        $http.post('/rest',{ func: 'workEditSave',
          ex_parm: { msgObj: lp.work}
        })
          .success(function (data, status, headers, config) {    // 得到新的消息
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
            lp.editMode = false;
          })
          .error(function (data, status, headers, config) {
            lp.rtnInfo = JSON.stringify(status);
          });
      };
      lp.workCancel = function(){
        if (lp.curIndex >= 0 && lp.work._exState!="new") lp.workSet[lp.curIndex] = angular.copy(lp.pristineWork);
        lp.workEditMask(false);
      };
      lp.workDelete = function(){
        $http.post('/rest',{ func: 'workEditDelete',
          ex_parm: { msgObj: lp.work}
        })
          .success(function (data, status, headers, config) {    // 得到新的消息
            lp.rtnInfo = data.rtnInfo;
            if (data.rtnCode > 0){
              for (var i in lp.workSet){
                if (lp.workSet[i].UUID == lp.work.UUID) {
                  if (lp.showDebug) console.log("get it delete " + lp.work.UUID);
                  lp.workSet.splice(i,1);
                  lp.workEditMask(false);
                  break;
                }
              }
            }
          })
          .error(function (data, status, headers, config) {
            lp.rtnInfo = JSON.stringify(status);
          });
      };
      lp.memCheck = function(){
        lp.work.MEMTIMER = exDb.getDateTime(new Date(), true);
        if ((lp.work.MEMPOINT||'').length > 0);else lp.work.MEMPOINT = exDb.memPoint;
      }
      lp.workfilter = function(){
        //参数重置。
        lp.workSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
        lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
        lp.limit = 5;      // 当前查询显示限制。
        if  (lp.seekUserFlag && ((lp.seekUser||'').length == 0)) lp.seekUserFlag = false;
        lp.filterCache = {  seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
          seekStateFlag: lp.seekStateFlag , seekState: lp.seekState,
          seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser,
          seekTaskFlag: lp.seekTaskFlag, seekTaskUUID:lp.seekTaskUUID, test:'xxx'
        }
        //console.log('-----> task ' + lp.seekTaskUUID)
        lp.workGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
      };
      lp.workGet = function(){
        $http.post('/rest',{ func: 'workListGet', // my message
          ex_parm: { workType: lp.aType, limit:lp.limit, offset:lp.curOffset,
            filter: lp.filterCache
          }
        })
          .success(function (data, status, headers, config) {    // 得到新的消息
            lp.rtnInfo = data.rtnInfo;
            var ltmp1 = (data.exObj || []);
            if (ltmp1.length > 0){
              lp.curOffset = lp.curOffset + lp.limit;
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
          })
          .error(function (data, status, headers, config) {
            lp.rtnInfo = JSON.stringify(status);
          });
      }
      lp.workMem = function(){
        if (lp.work.MEMEN && (lp.work.MEMPOINT||'').length > 0) {
          if (new Date(lp.work.MEMTIMER) < new Date()){
            var ltmp = lp.work.MEMPOINT.split(','); //  数组，搞到当前时间后面的几天。
            var lgo = parseInt(ltmp.shift());
            lp.work.MEMTIMER = exDb.getDateTime(new Date(new Date() - 0 + lgo * 86400000));
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
  app.controller("ctrlTaskAll",['$http','$scope','$routeParams','$location','exDb',function($http,$scope,$routeParams,$location,exDb){
    var lp = $scope;
    lp.showDebug = false;  // 调试信息打印。
    lp.seekContentFlag = false; lp.seekContent = ""; // 是否search任务内容。
    lp.seekStateFlag = true; lp.seekState = ['计划','进行']; // 是否search任务状态。
    lp.seekUserFlag = true; lp.seekUser = exDb.getUser();  // 是否按照用户搜索
    lp.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
    lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
    lp.limit = 5;      // 当前查询显示限制。
    lp.aType = $routeParams.aType;    // 查询的页面参数。暂时没用。随便参数。
    lp.selectUserMode = false;
    lp.rtnInfo = "";   // 返回提示用户的信息。   // lp.task = exDb.taskNew();    // 暂时给遮挡编辑任务页面提供。
    lp.curIndex = null;     //当前编辑的索引值
    lp.editMode = false;    // 是否在单记录编辑模式。
    lp.planState = exDb.planState;  // 选择的task状态内容。
    lp.haveClicked = "";
    lp.taskEditMask = function(aShow){
      if (aShow) { lp.rtnInfo = ''}
      lp.editMode = aShow;
    }
    lp.taskAdd = function(aIndex){   // 增加和编辑。
      console.log("add " + aIndex);
      lp.curIndex = aIndex;
      lp.task = exDb.taskNew();
      lp.task.OWNER = exDb.getUser();
      lp.task.STATE = '计划';
      lp.task._exState = 'new';
      if(aIndex != null){
        lp.task.UPTASK = lp.taskSet[aIndex].UUID;
      }
      lp.taskEditMask(true);
    };
    lp.subWorkList = function(aIndex) {   // 列出他的子任务。
      $location.path('/workList/list').search({pid:lp.taskSet[aIndex].UUID, pcon:lp.taskSet[aIndex].CONTENT.substr(0,15) });
    }
    lp.taskEdit = function(aIndex){
      console.log("edit " + aIndex);
      lp.curIndex = aIndex;
      lp.task = lp.taskSet[aIndex];
      lp.pristineTask = angular.copy(lp.taskSet[aIndex]);
      lp.task._exState = 'dirty';
      lp.task.PRIVATE = (lp.task.PRIVATE=="true" || lp.task.PRIVATE===true)?true:false;
      lp.taskEditMask(true);
    };
    lp.taskExpend = function(aIndex){
      lp.curIndex = aIndex;
      var l_uuid = lp.taskSet[aIndex].UUID, l_preFix = lp.taskSet[aIndex].preFix;

      if (lp.haveClicked.indexOf(l_uuid + ",") >= 0 ) return ;

      $http.post('/rest',{ func: 'taskAllGet', // my message
        ex_parm: { taskUUID:    l_uuid }
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.haveClicked = lp.haveClicked + l_uuid + ",";
          lp.rtnInfo = data.rtnInfo;
          var ltmp1 = (data.exObj || []);
          if (ltmp1.length > 0){
            for (var i=0; i< ltmp1.length; i++) {
              ltmp1[i]._exState = "clean";
              ltmp1[i].preFix = "...." + l_preFix + "-" + String(i);
            }
            //lp.taskSet = lp.taskSet.concat(ltmp1); // 防止新增加的，再检索出来重复~~
            [].splice.apply(lp.taskSet, [aIndex + 1, 0].concat(ltmp1))
          }
          else{ // 没有数据了。不用干活。
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskSave = function(){
      if (lp.task.STATE == exDb.planState[2] && (lp.task.FINISH||'').length==0) lp.task.FINISH = exDb.getDateTime(new Date());
      $http.post('/rest',{ func: 'taskEditSave',
        ex_parm: { msgObj: lp.task}
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          switch (lp.task._exState) {
            case 'dirty':
              lp.task._exState = "clean";
              lp.taskSet[lp.curIndex] = lp.task;
              break;
            case 'new':
              lp.task._exState = "clean";
              lp.taskSet.unshift(lp.task);
              break;
          }
          lp.taskEditMask(false);
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskCancel = function(){
      lp.taskEditMask(false);
      if (lp.curIndex >= 0  && lp.task._exState!="new") lp.taskSet[lp.curIndex] = lp.pristineTask;
    };
    lp.taskDelete = function(){
      $http.post('/rest',{ func: 'taskEditDelete',ex_parm: { msgObj: lp.task}  })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          if (data.rtnCode > 0){
            for (var i in lp.taskSet){
              if (lp.taskSet[i].UUID == lp.task.UUID) {
                if (lp.showDebug) console.log("get it delete " + lp.task.UUID);
                lp.taskSet.splice(i,1);
                lp.taskEditMask(false);
                break;
              }
            }
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskfilter = function(){
      //参数重置。
      lp.taskSet = [];  // 当前网页的数据集合。     -- 查询条件改变。要重头来。
      lp.curOffset = 0;  // 当前查询的偏移页面量。  -- 查询条件改变。要重头来。
      lp.limit = 5;      // 当前查询显示限制。
      if  (lp.seekUserFlag && ((lp.seekUser||'').length == 0)) lp.seekUserFlag = false;
      lp.filterCache = {  seekContentFlag : lp.seekContentFlag, seekContent: lp.seekContent,
        seekStateFlag: lp.seekStateFlag , seekState: lp.seekState,
        seekUserFlag: lp.seekUserFlag, seekUser: lp.seekUser, seekTop: true, seekUUID: ""
      }
      lp.taskGet();   // 应该把状态push进去，否则还是按照原来的逻辑进行get。
    };
    lp.taskGet = function(){
      $http.post('/rest',{ func: 'taskListGet', // my message
        ex_parm: { taskType: lp.aType, limit:lp.limit, offset:lp.curOffset,
          filter: lp.filterCache
        }
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          var ltmp1 = (data.exObj || []);
          if (ltmp1.length > 0){
            for (var i=0; i< ltmp1.length; i++) {
              ltmp1[i]._exState = "clean";
              ltmp1[i].preFix = String(i + lp.curOffset);
              ltmp1[i].classShow = "prefixHead";
            }
            lp.taskSet = lp.taskSet.concat(ltmp1); // 防止新增加的，再检索出来重复~~
            var hashKey  = {}, lRet = [];
            for (var i in lp.taskSet) {
              var key = lp.taskSet[i].UUID;
              if (hashKey[key] != 1) { hashKey[key] = 1; lRet.push(lp.taskSet[i]);}
            }
            lp.taskSet = lRet;
            lp.curOffset = lp.curOffset + lp.limit;
          }
          else{ // 没有数据了。关闭按钮。

          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    }
    lp.selectUser = function(){
      (lp.allSelectUser = lp.task.OUGHT.split(',')).pop();
      exDb.getAllUserPromise().then( function (data) {
        var lrtn = data.exObj;
        lp.allOtherUser =[];
        console.log(lrtn);
        for (var i in lrtn) {  if (lp.task.OUGHT.indexOf(lrtn[i].NICKNAME + ",") < 0 ) lp.allOtherUser.push(lrtn[i].NICKNAME); };
        lp.selectUserMode=true;
      }, function (reason) { console.log(reason); lp.allOtherUser = []  });

    };
    lp.selectUserMove = function(aInOut){
      if (aInOut) {
        for (var i in lp.userSelected){
          lp.allSelectUser.splice(lp.allSelectUser.indexOf(lp.userSelected[i]), 1);
          lp.allOtherUser.push(lp.userSelected[i]);
        }
      }
      else{
        for (var i in lp.userOthers){
          lp.allOtherUser.splice(lp.allOtherUser.indexOf(lp.userOthers[i]), 1);
          lp.allSelectUser.push(lp.userOthers[i]);
        }
      }
    };
    lp.selectUserOk = function(){
      /// 根据选中的用户进行。
      lp.task.OUGHT = lp.allSelectUser.join(",") + ",";
      lp.selectUserMode = false;
    };
    switch (lp.aType)
    {
      case "main":
      default :
        lp.taskfilter();  // 默认来一次。
        break;
    }
  }]);
  app.config(['$routeProvider', function($routeProvider) {
      $routeProvider.       // main.html <--------
        when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
        when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
        when('/chang', { templateUrl: '/partials/userChange.html', controller: "ctrlChangUser" }).
        when('/main', {templateUrl: '/partials/main.html',   controller: "ctrlMain"}).
        when('/msgEdit/:id', {templateUrl: '/partials/msgEdit.html',   controller: "ctrlMsgEdit"}).
        when('/taskList/:aType', {templateUrl: '/partials/taskList.html',   controller: "ctrlTaskList"}).
        when('/workList/:aType', {templateUrl: '/partials/workList.html', controller: "ctrlWorkList"}).
        when('/taskAll/:aType', {templateUrl: '/partials/taskAll.html', controller: "ctrlTaskAll"}).
        ///workList/xx?xxx=1&dd=2  -> {xxx: "1", dd: "2", aType: "xx"}
        otherwise({redirectTo: '/'});
    }]);

  app.directive('validDateModel', function() {
    return {
      require:"ngModel",
      link: function (scope, element, attrs, actr) {
        console.log('link parsers to datetime ' + element[0].id);
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

  app.config(['localStorageServiceProvider', function(localStorageServiceProvider){
      localStorageServiceProvider.setPrefix('exPrefix');  // .setStorageCookieDomain('example.com');    // .setStorageType('sessionStorage');
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


