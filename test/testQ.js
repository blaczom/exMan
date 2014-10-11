/**
 * Created by blaczom on 2014/10/11.
 */

DB = require('../db');
DbHelp = require('../dbhelp');
fs = require('fs');


var Q = require('q');
var rtnFunc = function(){ console.log(arguments) };

var testQ = function (aSql) {
  console.log(" runsql testQ " + aSql);
  var deferred = Q.defer();
  setTimeout( function () {
    console.log(" timeout testQ " + aSql);
    var err = null, row = "time out->arg->" + aSql;
    if (err) deferred.reject(err) // rejects the promise with `er` as the reason
    else deferred.resolve(row) // fulfills the promise with `data` as the value
  }, 1000);
  return deferred.promise;
};
/*
// 第一个then，如果返回的是一个变量。直接将变量发送给第一个then返回的promis2，作为他的then参数。第2个then不return变量， 就是undefined。
var gRtn1 = testQ('test111').then(function(x){console.log('first then ' + x);return x }, rtnFunc)
  .then(function(x){console.log('second then ' + x);  }, rtnFunc)
  .then(function(x){console.log('third then ' + x);return x }, rtnFunc)
  .then(function(){
    console.log("------ the 1th test over --------");
  })

//第一个then返回了一个promise类型。第2个then，就作为返回的promise的继续。相当于。testQ('test22222').then。嵌套写法而已。
var gRtn2 = testQ('test222').then(function(x){ return testQ('test2222222') }, rtnFunc)
  .then(function(x){console.log('222 second then ' + x); console.log(arguments) }, rtnFunc)
  .then(function(){
    console.log("------ the 2th test over --------");
  })
/////////////////// 相当于。
 var gRtn2 = testQ('test222').then(
 function(x){ testQ('test2222222').then(
 function(x) { console.log('222 second then ' + x);
    console.log(arguments);
    console.log("------ the 2th test over --------");
    })
 }) ;
*/


//第一个参数是resolvePromise, 第二个是rejectPromise.第三估计是updatePromise
var thenAble = {
  then : function(x,y,z){console.log(" i am thenable"); console.log(arguments);y('777'); x('666');}
}
//第一个then返回了一个thenable的对象。第2个then就会调用这个对象的then，并且把3个promise的状态函数作为参数传给他（前2个都调用，只有第一个有效），然后会自动返回promise）
// 注意只有throw出去的expetion，才会调用rejection。
var gRtn3 = testQ('test333').then(function(x){ return thenAble }, rtnFunc)
  .then(function(x){console.log('333 second then '); console.log(arguments) }, rtnFunc)
  .then(function(){
    console.log(arguments)
    console.log("----------over --------")
  },rtnFunc())

/*

DB.Q.allSql("select * from user where NICKNAME='xman' ")
  .then( function (row) {
    console.log(row);
    return DB.Q.allSql("select * from task where uuid='testtask1'");
  })
  .then( function (row) {
    console.log(row);
    return DB.Q.allSql("select * from work where uuid='testwork1'");
  }).then( function (row) {
    console.log(row);
  })
  .fail(function(){console.log(arguments) } )

*/