/**
 * Created by Administrator on 2014/10/10.
 */

DB = require('../db');
DbHelp = require('../dbhelp');
fs = require('fs');
var Q = require('q');

insUser = "insert into user(NICKNAME,PASS) values ( 'xman','') " ;
insTask = "insert into task(UUID) values ('testtask1') ";
insWork = "insert into WORK(UUID) values ('testwork1') ";

var allPromise = Q.all([
  DB.Q.runSql(insUser), DB.Q.runSql(insTask), DB.Q.runSql(insWork),
  DB.Q.allSql("select * from user where nickname='xman'"),
  DB.Q.allSql("select * from task where uuid='testtask1'"),
  DB.Q.allSql("select * from work where uuid='testwork1'")
]);

allPromise.then(function(row){
    for (var i in row) {
      if (row[i]) { assert.equals(row[i].length, 1); }
    }
  }
  ,console.error) ;
/*
  // 用于根据数据库生成对象的属性。
allPromise.then(
  function(row){
    var gRtn = [];
    for (var i in row)
    { if (row[i]) { console.log(row[i]); gRtn.push(row[i][0])} }
    var lsFile = "" // 顺便根据数据库生成 js 的数据模型。
    var linesep = "\r\n";
    for (var i in gRtn) {
      lsFile = lsFile + "var s" + i + " = function() { " + linesep;
      for (var j in gRtn[i]) {   lsFile = lsFile + 'this.' + j + " = '';" + linesep;   }
      lsFile = lsFile + "this._exState='';" + linesep;
      lsFile = lsFile + "this._exDataSet={};" + linesep;
      lsFile =  lsFile +  "}" + linesep;
    }
    console.log(lsFile);
    fs.appendFileSync('jsMode.js', lsFile);
  },
  console.error );
*/
