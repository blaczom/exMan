var gUid = require('uuid');
var sqlite3 = require('sqlite3');

// if exist exman.db, means the sql ddl have been execute.
var fs = require('fs');

if (!fs.exists('exman.db'))
{
  console.log("no databse file. will create it.");
  var l_run = [];
  l_run.push( "CREATE TABLE if not exists USER(UUID CHAR(36), NICKNAME NVARCHAR2(36) NOT NULL, " +
    " PASS CHAR(36) NOT NULL, REMPASS BOOL, MOBILE NVARCHAR2(20), EMAIL NVARCHAR2(80), IDCARD NVARCHAR2(30), " +
    " UPMAN NVARCHAR2(36), LEVEL INTEGER, GRANT INTEGER  );");
  l_run.push("CREATE UNIQUE INDEX if not exists  [pk_usernick] ON [USER] ([NICKNAME]);");

  l_run.push("CREATE TABLE if not exists TASK(UUID CHAR(36), UPTASK CHAR(36), START DATETIME NOT NULL, " +
    " FINISH DATETIME NOT NULL, STATE NVARCHAR2(8), OWNER NVARCHAR2(36) NOT NULL, LEVEL INTEGER NOT NULL, " +
    " PRIVATE BOOLEAN);");
  l_run.push("CREATE INDEX if not exists [idx_task_owner] ON [TASK] ([OWNER] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_uuid] ON [TASK] ([UUID] ASC);");
  l_run.push("CREATE INDEX if not exists [idx_task_state] ON [TASK] ([STATE] ASC);");

  l_run.push("CREATE TABLE if not exists LOG(UUID CHAR(36), UPTASK CHAR(36), CREATETIME DATETIME NOT NULL,  " +
    " UPDATETIME DATETIME, STATE NVARCHAR2(8), OWNER NVARCHAR2(36) NOT NULL, PRIVATE BOOLEAN" +
    " MEMEN BOOLEAN, MEMTIMER NVARCHAR2(60) );");

  l_run.push( "CREATE TABLE if not exists MSG(UUID CHAR(36), CREATETIME DATETIME NOT NULL,  " +
    " MSG NVARCHAR2(6000), TARGET NVARCHAR2(6000), OVER NVARCHAR2(6000), VALIDATE DATETIME) ");

  l_run.push( "CREATE TABLE if not exists TASK_MAN(TASK_ID CHAR(36), MAN_ID CHAR(36) ) ");
//每次执行前删除一边 validate过期的东东。
  var l_init = true;
}
var gdb = new sqlite3.Database('exman.db');

if (l_init) {
  gdb.serialize(function() {
    for (var i in l_run) {
      gdb.run(l_run[i], function (err, row) {
        if (err) {
          console.log("run Error: " + err.message + " " + l_run[i]);
        }
      });
    }
  });
}

var reConnect = function(){
  if (!gdb)  var gdb = new sqlite3.Database('exman.db');  // 时间长了可能会自动断掉?
};

var User = function(){
  this.UUId =  gUid.v1();
  this.nickName = "";
  this.Pass = "";
  this.rempass = true;
  this.mobile = "";
  this.email = "";
  this.idcard = "" ;
  this.upman = "";
  this.LEVEL= 0;
  this.grant = 0;

  User.prototype.save = function (aCallback){
    try {
      gdb.get("select COUNT(1) AS num from User where uuid=?", this.UUID, function(aErr, aRow){
        if (aErr){ console.log("save Error: " + aErr.message);  }
        if (aRaw > 0){
          gdb.run("update User(userid, username,userpass) VALUES (?,?,?)",
            [this.userId, this.user.userName, this.user.userPass],
            function (err, row){
              if (err) { console.log("save Error: " + err.message);  }
              aCallback(err, row);
            }
          );
        }
        else {
          gdb.run("INSERT INTO User(userid, username,userpass) VALUES (?,?,?)",
            [this.userId, this.user.userName, this.user.userPass],
            function (err, row){
              if (err) { console.log("save Error: " + err.message);  }
              aCallback(err, row);
            }
          );
        }
      });

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
  };
  User.prototype.get = function (aWhere, aCallback) {
    try {
      if ( aWhere.length > 0 ) {
        gdb.get("SELECT * FROM USER WHERE ", [aUserName],
          function (err, row) {
            if (err) {  console.log("getByName Error: " + err.message); }
            aCallback(err, row);
          }
        );
      }
    }
    catch (err) { aCallback(err,result); }
    finally {  aCallback(null, result); }
  };
};


exports.User = User;
/*
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
*/
