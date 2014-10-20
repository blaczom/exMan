
  var app = angular.module("AMail", ['ngRoute']).
    config(['$routeProvider', function($routeProvider) {
      $routeProvider.
      when('/', {
        controller: ListController,
        templateUrl: 'list.html'
      }).
      when('/view/:id', {
        controller: DetailController,
        templateUrl: 'detail.html'
      }).
      otherwise({
        redirectTo: '/'
      });
  }]);

  // 一些虚拟的邮件
  var messages = [{
    id: 0, sender: 'jean@somecompany.com', subject: 'Hi there, old friend',
    date: 'Dec 7, 2013 12:32:00', recipients: ['greg@somecompany.com'],
    message: 'Hey, we should get together for lunch sometime and catch up.'
      +'There are many things we should collaborate on this year.'
  }, {
    id: 1,  sender: 'maria@somecompany.com',
    subject: 'Where did you leave my laptop?',
    date: 'Dec 7, 2013 8:15:12', recipients: ['greg@somecompany.com'],
    message: 'I thought you were going to put it in my desk drawer.'
      +'But it does not seem to be there.'
  }, {
    id: 2, sender: 'bill@somecompany.com', subject: 'Lost python',
    date: 'Dec 6, 2013 20:35:02', recipients: ['greg@somecompany.com'],
    message: "Nobody panic, but my pet python is missing from her cage."
  }];
  // 把我们的邮件发布给邮件列表模板
  function ListController($scope) {
    $scope.messages = messages;
  };
  // 从路由信息（从URL 中解析出来的）中获取邮件id，然后用它找到正确的邮件对象
  function DetailController($scope, $routeParams) {
    $scope.message = messages[$routeParams.id];
  };

