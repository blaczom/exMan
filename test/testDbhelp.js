/**
 * Created by blaczom on 2014/10/10.
 ------------------
 var ls_sql = dbHelp.genSave(aTarget, aTable);
 根据aTarget的_exState属性(new,dirty,clean)返回对应aTable的sql语句。
 返回：aTarget的字段 insert/update语句。
 ------------------
 DbHelp = require('./dbhelp');DbHelp.genModel();
 返回：select数据库的this对象。
 -------------------
 *
 *
 */
var assert = require("assert");
var DB = require('../db');
var DbHelp = require('../dbhelp');

var u1 = DB.User;
var ls_sql = DbHelp.genSave(u1, "user");
var ls_gen = "insert into user(NICKNAME,PASS,REMPASS,MOBILE,EMAIL,IDCARD,UPUSER,LEVEL,GRANT,SYNC)" +
  " values ( '','','','','','','','','','')";

assert.equal(ls_sql, ls_gen);
//DbHelp.genModel();