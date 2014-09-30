
(function(){
var app = angular.module("exman", ['utils']);
app.controller("regUser", ['$http', 'md5', '$scope', function($http, md5, $scope){
    var lp = $scope;
    lp.user = objUser;
    lp.rtnInfo = "";
    lp.addUser = function(){
      lp.user.userPassMd5 = md5.createHash(lp.user.userPass);
        $http.post('/reg', {txtUserName:lp.user.userName, txtUserPwd:lp.user.userPassMd5})
            .success(function(data, status, headers, config) {
            lp.rtnInfo = data.rtnInfo;
            lp.rtnCode = data.rtnCode;
            }).
            error(function(data, status, headers, config) { 
                alert("error " + status);
            });
    };

}]);

var objUser = {
  userName: "",
  userPass: "",
  userPass2: "",
  userPassMd5: "",
  rememberMe: true
}


})();