
(function(){
var app = angular.module("exman", ['utils']);
app.controller("regUser", ['$http', 'md5', function($http, md5){
    this.user = objUser;
    this.rtnInfo = "";
    this.addUser = function(){
        this.user.userPassMd5 = md5.createHash(this.user.userPass);
        $http.post('/reg', {txtUserName:this.user.userName, txtUserPwd:this.user.userPassMd5})
            .success(function(data, status, headers, config) {   
                this.rtnInfo = data.rtnInfo;
                this.rtnCode = data.rtnCode;
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