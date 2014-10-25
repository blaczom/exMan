/**
 * Created by Administrator on 2014/10/10.
 */

DB = require('../db');
DbHelp = require('../dbhelp');
fs = require('fs');
var Q = require('q');
/*
insUser = "insert into user(NICKNAME,PASS) values ( 'xman','') " ;
insTask = "insert into task(UUID) values ('testtask1') ";
insWork = "insert into WORK(UUID) values ('testwork1') ";
insAuth = "insert into CREATEUSER values ('00112233440000000000000000000000', 2, 2) ";

var allPromise = Q.all([
  DB.Q.runSql(insUser), DB.Q.runSql(insTask), DB.Q.runSql(insWork),DB.Q.runSql(insAuth),
  DB.Q.allSql("select * from user where nickname='xman'"),
  DB.Q.allSql("select * from task where uuid='testtask1'"),
  DB.Q.allSql("select * from work where uuid='testwork1'"),
  DB.Q.allSql("select * from CREATEUSER where uuid='00112233440000000000000000000000'")
]);

allPromise.then(function(row){
    for (var i in row) {
      if (row[i]) { assert.equals(row[i].length, 1); }
    }
  }
  ,console.error) ;
*/
var stackSubQ = []
DB.Q.allSql("select * from task where uptask=''")
  .then(function(row1){
    for (var i in row1) { // 对返回的所有数据集进行处理。
      stackSubQ.push( DB.Q.allSql("select count(*) as COUNT, state as STATE from task where uptask='" + row1[i].UUID + "' group by STATE") )
    }
    Q.all(stackSubQ).then(function(row2){
      var l_a = [0,0,0], l_rtn = row2;
      console.log(row2);
      for (var i in row2) {
        if (row2[i].length > 0 ){
          for (var ii in row2[i]) {
            var l_rtn = row2[i][ii]
            switch (l_rtn.STATE) {
              case '结束':
                l_a[2] = l_rtn.COUNT;
                break;
              case '进行':
                l_a[1] = l_rtn.COUNT;
                break;
              case '计划':
                l_a[0] = l_rtn.COUNT;
                break;
            }
          }
          row1[i].subTask = l_a.join('|');
          console.log(row1[i]);
        }
        else   row1[i].subTask = "nochild";
      }
    })
  }).fail(console.error);


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

/*

 DB.Q.allSql("select * from user").then(function(row1){grtn=row1});
 grtn[0]
 grtn[0].EMAIL = "it's for single quote:' andalso doubel quote:'' ok."

 DB.Q.allSql("update user set EMAIL = ? where NICKNAME=?", [grtn[0].EMAIL, grtn[0].NICKNAME]).then(function(row1){console.error});
 */
