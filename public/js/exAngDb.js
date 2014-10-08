/**
 * Created by blaczom@gmail.com on 2014/10/8.
 */

angular.module('exFactory', []).
  factory('exDb', function(){



    var objUser = {
      UUID : "",
      NICKNAME : "",
      PASS : "",
      PASS2: "",
      PASSMd5: "",
      REMPASS : true,
      MOBILE : "",
      EMAIL : "",
      IDCARD : "" ,
      DEPART :"",
      UPMAN : "",
      LEVEL : 0,
      GRANT : 0,
      _exState : "new" // new , clean, dirty.
    }

    return{
      current: ""
    }
  });