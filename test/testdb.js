/**
 * Created by Administrator on 2014/10/10.
 */

DB = require('../db');
DbHelp = require('../dbhelp');
fs = require('fs');

insUser = "insert into user(NICKNAME,PASS) values ( 'xman','') "
insTask = "insert into task(UUID) values ('testtask1') "
insWork = "insert into WORK(uuid) values ('testwork1') "

var funcErr = function() { console.log(arguments) }
var funcBack = function() { console.log(arguments) }

var lsFile = "";  // 顺便根据数据库生成 js 的数据模型。
var linesep = "\r\n";
lsFile = "var User = function{ " + linesep;


DB.Q.runSql(insUser).then(
  function() {
    DB.Q.allSql("select * from user where NICKNAME='xman' ").then(
      function (row) {  console.log(row) }, funcErr
    )
  },funcErr
).then(
  DB.Q.runSql(insTask).then(
    function(){
      DB.Q.allSql("select * from task where uuid='testtask1'").then(
        function(row){ assert.ok(row.length, 1) }, funcErr
      )
    },funcErr), funcErr
).then(
  DB.Q.runSql(insWork).then(
    function(){
      DB.Q.allSql("select * from work where uuid='testwork1'").then(
        function(row){ assert.ok(row.length, 1) })
    },funcErr
  )
).then(
  DB.Q.allSql("select * from user where nickname='xman'").then(
    function(row){
      for (var i in row[0]) { lsFile = lsFile +'this.' + i + " = '';" + linesep; }
      lsFile = lsFile + "}" + linesep + "var Task = function{ " + linesep;
      console.log(row);
    } ,funcErr
  )
).then(
  DB.Q.allSql("select * from task where uuid='testtask1'").then(
    function(row){
      for (var i in row[0]) { lsFile = lsFile +'this.' + i + " = '';" + linesep; }
      lsFile = lsFile + "}" + linesep + "var Work = function{ " + linesep;
    } ,funcErr
  )
).then(
  DB.Q.allSql("select * from work where uuid='testwork1'").then(
    function(row){
      for (var i in row[0]) { lsFile = lsFile +'this.' + i + " = '';" + linesep; }
      lsFile = lsFile + "}" + linesep;
    },funcErr
  )
).then(
  fs.appendFileSync('jsMode.js', new Buffer(lsFile))
).fail(funcErr);



