/**
 * Created by Administrator on 2014/11/16.
 */
DB = require('../db');
a = DB.User;

b = DB.User;
console.log(a.NICKNAME, "--", b.NICKNAME);

a.NICKNAME = "TEST";
console.log(a.NICKNAME, "--", b.NICKNAME);


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

/**
 * Created by Administrator on 2014/9/25.
 $ npm install -g mocha
 $ mkdir test
 $ $EDITOR test/test.js
 var assert = require("assert")
 describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(5));
      assert.equal(-1, [1,2,3].indexOf(0));
    })
  })
})
 $  mocha
 */
var DB = require('../db');
var assert = require("assert");
var DbHelp = require('../dbhelp');
var rtnFunc = function(aErr, aRtn){if (aErr) console.log(aErr); };

describe('test for all', function(){
  describe('db.js', function(){
    describe('#user', function(){
      it('test user create/save/update', function() {
        u1 = DB.User.new();
        u1.NICKNAME = 'test';
        DB.User.save(u1, function (err, row) {
          console.log('save new user: ' + u1.NICKNAME)
        });
        u1.EMAIL = 'Fire@noserver.com';
        u1._exState = 'dirty';
        DB.User.save(u1, function (err, row) {
          console.log('update EMAIL: ' + u1.EMAIL)
        });
      });
      it('test user get', function() {
        var uRtn1, uRtn2;
        DB.User.getBy("where UUID='" + u1.UUID + "'" , function(er,ret){
          if (er) {console.log(er); }
          uRtn1 = ret ;
          DB.User.getByNickName("fire", function(er,ret){
            if (er) {console.log(er); }
            uRtn2 = ret;
            assert.equal(uRtn1, uRtn2);
            assert.equal(uRtn1[0].EMAIL, u1.EMAIL);
            assert.equal(uRtn1[0].NICKNAME, u1.NICKNAME);
            assert.
              DB.close();
          });
        });
      })
    });
    describe('#task', function(){
      it('test task new-save-get ', function() {
        work1 = DB.Work.new();
        DB.Work.save(work1, function(aErr, aRtn){
          DB.directDb.get("select * from WORK where UUID=?", work1.UUID, function(err,rtn){
            for (var i in rtn) {
              assert.equal(gRtn[i],task1[i]);
            }
          });
        });
      })
    });
  });
  /*
   describe('dbhelp.js'), function(){
   describe('#gen save sql'), function(){

   }
   }; */

});


/*
 -------------------------------------------
 t1 = DB.Task.new();
 t2 = DB.Task.new();
 t3 = DB.Task.new();
 t2.UPTASK = t1.UUID;
 t3.UPTASK = t1.UUID;
 t21 = DB.Task.new();
 t22 = DB.Task.new();
 t21.UPTASK = t2.UUID;
 t22.UPTASK = t2.UUID;
 DB.Task.save(t1,  function(err, row){console.log('new save')});
 DB.Task.save(t2,  function(err, row){console.log('new save')});
 DB.Task.save(t3,  function(err, row){console.log('new save')});
 DB.Task.save(t21,  function(err, row){console.log('new save')});
 DB.Task.save(t22,  function(err, row){console.log('new save')});
 DB.Task.getBy("",  function(err, row){ gRtn = row })
 gRoot = { UUID: t1.UUID };
 DB.Task.getChildren(gRoot, function(err, row){console.log('show children')});
 sql = "SELECT * FROM Task where UPTASK='" + gRoot.UUID + "'"
 DB.runSql(sql, function(err, row){ gtt = row })


 DB = require('./db');


 生成对象的语句：
 work1 = DB.Work.new();
 DB.Work.save(work1, rtnFunc);
 DB.directDb.get("select * from WORK ", function(err,rtn){gRtn = rtn} );
 for (var i in gRtn) { console.log("this." + i + " = '' ;" ) ;}

 task1 = DB.Task.new();
 DB.Task.save(task1, rtnFunc);
 DB.directDb.get("select * from task  ", function(err,rtn){gRtn = rtn} );
 for (var i in gRtn) { console.log("this." + i + " = '' ;" ) ;}
 for (var i in gRtn) { if (gRtn[i] != task1[i]) console.log(i + "wrong") }


 var u2;
 aCallback = function(err, row){u2 = row};
 u1.get("where UUID='" + u1.UUID + "'" , function(er,ret){u2=ret;})

 var str = JSON.stringify(u2);
 var obj2 = JSON.parse(str);


 */