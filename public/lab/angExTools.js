
(function(){
  var app = angular.module("extools", []);
  app.controller("exCtrl", ['$http',"$scope", function($http, $scope){
    var lp = $scope;
    lp.txtReq = "";
    lp.txtReturn = "";
    lp.addPass = "";
    lp.postReq = function(){
        $http.post('/extools',  { exReq: lp.txtReq, exAdmin:lp.addPass  } )
           .success(function(data, status, headers, config) {
              // $scope.$apply(this.txtReturn);
            lp.txtReturn = JSON.stringify(data);
            })
          .error(function(data, status, headers, config) {
                alert("error " + status);
          });
    };
  }]);
})();