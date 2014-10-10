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
DB = require('../db');
var assert = require("assert");
DbHelp = require('../dbhelp');
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