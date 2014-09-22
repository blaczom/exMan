var gUid = require('uuid');

var sqlite3 = require('sqlite3');
var gdb = new sqlite3.Database('exman.db');
gdb.run("CREATE TABLE if not exists userinfo(UserName varchar(64) NOT NULL, UserPass varchar(64) NOT NULL);");

var reConnect = function(){
    if (!gdb)  var gdb = new sqlite3.Database('exman.db');  // 时间长了可能会自动断掉。
}

var User = function(){
    this.user = { userId: gUid.v1(),
                    userName:"",
                    userPass :"" };

    this.save = function save( aCallback){
        var err, result='';
        try {gdb.run("INSERT INTO userinfo(username,userpass) VALUES (?, ?)",  [this.user.userName, this.user.userPass]);}
            catch (err) { aCallback(err,result); }            
            finally {  aCallback(null, result); }            
    };
    //根据用户名得到用户数量
    this.getUserNumByName = function (aUserName, aCallback) {
        gdb.get("SELECT COUNT(1) AS num FROM userinfo WHERE username = ?", aUserName, function(err, row) {  if (err) { console.log("getUserNumByName Error: " + err.message); }
            aCallback(err,row);  });
    };
    //根据用户名得到用户信息
    this.getUserByUserName = function (aUserName, aCallback) {
        gdb.get("SELECT * FROM userinfo WHERE username = ?", [aUserName], function (err, row) {
            if (err) {console.log("getUserByUserName Error: " + err.message);}
            aCallback(err,row); });        
    };
    this.getAllUser = function(aCallback) {
        gdb.all("SELECT * FROM userinfo ", function (err, row) {
            if (err) {console.log("getAllUser Error: " + err.message);}
            aCallback(err,row); });
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

