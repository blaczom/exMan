var app = angular.module('myApp', []);

app.factory('Service', function () {
  return {id: "345", name: "teddy"};
});

app.controller('SelectController', function($scope, Service) {
  $scope.service = Service;

  $scope.$watch('service', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      alert('SelectController value changed!');
    }
  }, true);


  $scope.generate = function() {
    $scope.service.name = "jimmy";
  };
});

app.controller('GraphController', function($scope, Service) {
  $scope.service = Service;
  $scope.$watch('service', function(newVal, oldVal) {
    if (newVal !== oldVal) {
      alert("GraphController changed");
    }
  }, true);
});