var gUid = require('uuid');

var sqlite3 = require('sqlite3');
var gdb = new sqlite3.Database('exman.db');
gdb.run("CREATE TABLE if not exists userinfo(UserId char(36), UserName varchar(64) NOT NULL, " +
  "UserPass varchar(64) NOT NULL);");

var reConnect = function(){
  if (!gdb)  var gdb = new sqlite3.Database('exman.db');  // 时间长了可能会自动断掉。
}

var User = function(){
  this.userId =  gUid.v1();
  this.userName = "";
  this.userPass = "";
  User.prototype.save = function (aCallback){
    try {
      gdb.run("INSERT INTO userinfo(userid, username,userpass) VALUES (?,?,?)",
        [this.userId, this.user.userName, this.user.userPass],
        function (err, row){
          if (err) { console.log("save Error: " + err.message);  }
          aCallback(err, row);
        }
      );
    }
    catch (err) { aCallback(err,result); }
    finally {  aCallback(null, result); }
  };
  User.prototype.getNumByName = function (aUserName, aCallback) {
    try {
      gdb.get("SELECT COUNT(1) AS num FROM userinfo WHERE username = ?", aUserName,
        function (err, row) {
          if (err) { console.log("getNumByName Error: " + err.message); }
          aCallback(err, row);
        }
      );
    }
    catch (err) { aCallback(err,result); }
    finally {  aCallback(null, result); }
  }
  User.prototype.getByName = function (aUserName, aCallback) {
    try {
      gdb.get("SELECT * FROM userinfo WHERE username = ?", [aUserName],
        function (err, row) {
          if (err) {  console.log("getByName Error: " + err.message); }
          aCallback(err, row);
        }
      );
    }
    catch (err) { aCallback(err,result); }
    finally {  aCallback(null, result); }
  }
  User.prototype.getAllUser = function (aCallback) {
    try {
      gdb.all("SELECT * FROM userinfo ", function (err, row) {
        if (err) {  console.log("getAllUser Error: " + err.message);  }
        aCallback(err, row);
      });
    }
    catch (err) { aCallback(err,result); }
    finally {  aCallback(null, result); }
  }
}

module.exports = {
  factory: function (aName) {
    if (['User', 'Object'].indexOf(aName) >= 0) {
      return eval('new ' + aName + '()')
    }
    else {
      console.log("no such object " + aName);
    }
  }
}

