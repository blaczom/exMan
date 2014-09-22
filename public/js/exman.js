
(function(){

var app = angular.module("exman", ['utils']); 
        
app.controller("regUser", ['$http', 'md5', function($http, md5){
    this.user = objUser;
    this.addUser = function(){
        this.user.userPassMd5 = md5.createHash(this.user.userPass);
        $http.post('/reg', {txtUserName:this.user.username, txtUserPwd:this.user.userPassMd5})
            .success(function(data, status, headers, config) {   
                alert("good");
            }).
            error(function(data, status, headers, config) { 
                alert("error " + status);
            });
    };
    
    this.checkUser = function(aUser){
        return true;
    };  
    this.mdpass = md5.createHash("");
    this.md5 = md5.createHash;
}]);  
    
var objUser = {
    userName: "",
    userPass: "",
    userPass2: "",
    userPassMd5: "", 
    rememberMe: true   
}

})();