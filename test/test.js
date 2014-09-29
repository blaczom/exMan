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

describe('db test', function(){
  describe('#user', function(){
    it('test user create/save/update', function() {
      u1 = DB.User.new();
      u1.NICKNAME = 'fire';
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
          DB.close();
        });
      });
    })
  })
});