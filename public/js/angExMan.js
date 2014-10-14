  var app = angular.module("exman", ['ngRoute', 'exService', 'exFactory']);

  app.controller("ctrlLogin", ['$http', '$scope', '$location', 'exDb', function($http, $scope, $location, exDb) {
    var lp = $scope;
    lp.user = exDb.userNew();
    lp.user.NICKNAME =exDb.getUser();
    lp.rtnInfo = "";
    lp.userLogin = function () {
      $http.post('/rest',
        { func: 'userlogin',
          ex_parm: { txtUserName: lp.user.NICKNAME,
            txtUserPwd: lp.user.PASS, remPass: lp.user.REMPASS
          }
        })
        .success(function (data, status, headers, config) {
          if (data.rtnCode > 0) {
            console.log('goo #/main');
            $location.path('/main');
            exDb.setUser(lp.user.NICKNAME);
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
          lp.user.NICKNAME = data.ex_parm.nickName;
          lp.user.PASS = data.ex_parm.pass;
          lp.user.REMPASS = (data.ex_parm.remPass=="true"?true:false);
          exDb.setUser(lp.user.NICKNAME);
        }
      })
      .error(function (data, status, headers, config) {
        lp.rtnInfo = JSON.stringify(status);
      });
  }]);
  app.controller("ctrlRegUser", ['$http', '$scope', 'exDb', function($http, $scope, exDb){
    var lp = $scope;
    lp.user = exDb.userNew();
    lp.rtnInfo = "";
    lp.userReg = function(){
      $http.post('/rest',
        { func: 'userReg',
          ex_parm: { txtUserName: lp.user.NICKNAME, txtUserPwd: lp.user.PASS  }
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
  app.controller("ctrlTaskList", ['$http', '$scope', '$routeParams', 'exUtil', 'exDb',
    function($http, $scope, $routeParams, exUtil, exDb)  {
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
    lp.rtnInfo = "";   // 返回提示用户的信息。
    // lp.task = exDb.taskNew();    // 暂时给遮挡编辑任务页面提供。
    lp.curIndex = null;     //当前编辑的索引值
    lp.editMode = false;    // 是否在单记录编辑模式。
    lp.planState = exDb.planState;  // 选择的task状态内容。

    lp.dateTimePattern = /^[0-9]$/ ;
      // "^[0-9]{4}-(((0[13578]|(10|12))-(0[1-9]|[1-2][0-9]|3[0-1]))|(02-(0[1-9]|[1-2][0-9]))|((0[469]|11)-(0[1-9]|[1-2][0-9]|30)))$";
    //     "(([1-9]{1})|([0-1][0-9])|([1-2][0-3])):([0-5][0-9])$"
    lp.taskAdd = function(aIndex){   // 增加和编辑。
      console.log("add " + aIndex);
      lp.curIndex = aIndex;
      lp.task = exDb.taskNew();
      lp.task.OWNER = exDb.getUser();
      lp.task._exState = 'new';
      if(aIndex != null){
        lp.task.UPTASK = lp.taskSet[aIndex].UUID;
      }
      lp.editMode = true;
    };
    lp.taskEdit = function(aIndex){
      console.log("edit " + aIndex);
      lp.curIndex = aIndex;
      lp.task = lp.taskSet[aIndex];
      lp.task._exState = 'dirty';
      lp.task.PRIVATE = (lp.task.PRIVATE=="true" || lp.task.PRIVATE===true)?true:false;
      lp.editMode = true;
    };
    lp.taskSave = function(){
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
          lp.editMode = false;
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskCancel = function(){
      lp.editMode = false;
    };
    lp.taskDelete = function(){
      $http.post('/rest',{ func: 'taskEditDelete',
        ex_parm: { msgObj: lp.task}
      })
        .success(function (data, status, headers, config) {    // 得到新的消息
          lp.rtnInfo = data.rtnInfo;
          if (data.rtnCode > 0){
            for (var i in lp.taskSet){
              if (lp.taskSet[i].UUID == lp.task.UUID) {
                if (lp.showDebug) console.log("get it delete " + lp.task.UUID);
                lp.taskSet.splice(i,1);
                lp.editMode = false;
                break;
              }
            }
          }
        })
        .error(function (data, status, headers, config) {
          lp.rtnInfo = JSON.stringify(status);
        });
    };
    lp.taskTest =function(aIndex){lp.rtnInfo = "asdfasdfa"; lp.editMode=true; }
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
          exDb.setUser(data.rtnUser);
          // 如果是选中了用户，却又是空咱班？
          if (! lp.seekUser) lp.seekUser = data.rtnUser;
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
            console.log(lRet);
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
      case "mine":
      case "ought":
      default :
        lp.taskfilter();  // 默认来一次。
        break;
    }



  }]);

  app.config(['$routeProvider', function($routeProvider) {
      $routeProvider.       // main.html <--------
        when('/', { templateUrl: '/partials/login.html', controller: "ctrlLogin" } ).
        when('/reg', { templateUrl: '/partials/reg.html', controller: "ctrlRegUser" }).
        when('/main', {templateUrl: '/partials/main.html',   controller: "ctrlMain"}).
        when('/msgEdit/:id', {templateUrl: '/partials/msgEdit.html',   controller: "ctrlMsgEdit"}).
        when('/taskList/:aType', {templateUrl: '/partials/taskList.html',   controller: "ctrlTaskList"}).
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


