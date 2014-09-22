var sqlite3 = require('sqlite3');
var gdb = new sqlite3.Database('exman.db');
gdb.run("CREATE TABLE if not exists userinfo(UserName varchar(64) NOT NULL, UserPass varchar(64) NOT NULL);");

var User = function(aUser){
    username = aUser.username;
    userpass = aUser.userpass;
}


var UserOper = {    
    save: function save(aUser, aCallback){
        var err, result='';
        try {gdb.run("INSERT INTO userinfo(username,userpass) VALUES (?, ?)",  [aUser.username, aUser.userpass]);}
            catch (err) { aCallback(err,result); }            
            finally {  aCallback(null, result); }            
    };
    //根据用户名得到用户数量
    getUserNumByName: function getUserNumByName(aUserName, aCallback) {
        gdb.get("SELECT COUNT(1) AS num FROM userinfo WHERE username = ?", aUserName, function(err, row) {  if (err) { console.log("getUserNumByName Error: " + err.message); }
            aCallback(err,row);  });
    }
    //根据用户名得到用户信息
    getUserByUserName:function getUserNumByName(aUserName, aCallback) {
        gdb.get("SELECT * FROM userinfo WHERE username = ?", [aUserName], function (err, row) {
            if (err) {console.log("getUserByUserName Error: " + err.message);}
            aCallback(err,row); });        
    };       
}

var db = {
    userOper: UserOper, 
    user : function(aUserName, aUserPass){ return new User(aUserName, aUserPass); }
}

module.exports = db;

