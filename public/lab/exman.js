
(function(){

var app = angular.module("exman", []);

app.run(function($rootScope) {
    $rootScope.global_name = "Ari Lerner";
    });


app.controller('testWatch', ['$scope', function($scope) {
    $scope.w1 = 'World';
    this.w2 = 'w2';
    $scope.counter = 234;
    $scope.thisCounter = 0;
    
    $scope.$watch('w2', function(newValue, oldValue) {
        $scope.counter = $scope.counter + 1;
        $scope.thisCounter = $scope.thisCounter + 1;
    });
    

  }]);
  
           
app.controller("regUser", function(){
    this.user = objUser;
    this.addUser = function(aUser){
        return true;
    };
    this.checkUser = function(aUser){
        return true;
    };  
    global_name = this.user;
});
                  

var objUser = {
    userName: "",
    userPass: "",
    userPass2: "",
    rememberMe: true   
}



app.controller('MainCtrl', function($scope) {
    $scope.updated = 0;
    $scope.text = "1111111";
    $scope.stop = function() {
        textWatch();
    };
    var textWatch = $scope.$watch('text', function(newVal, oldVal) {
        if (newVal === oldVal) { return; }  
        $scope.updated++;
    });
});

})();