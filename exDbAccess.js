/**
 * Created by blaczom4gmail on 2014/11/17.
 */

var ex = require('./exUtil');

var gdbFile = 'exman.db'; // if exist exman.db, means the sql ddl have been execute.
var fs = require('fs');
var gdb = require('./exDbSqlite3');
var Q = require('q');

var logInfo = ex.info;
var logErr = ex.err;
var funcErr = function(err) { logErr(err) };

var objUser = function() {
  this.NICKNAME = '';
  this.PASS = '';
  this.REMPASS = '';
  this.MOBILE = '';
  this.EMAIL = '';
  this.IDCARD = '';
  this.UPUSER = '';
  this.LEVEL = '';
  this.GRANT = '';
  this.SYNC = '';
  this._exState = "new";  // new , clean, dirty.
  this._exDataSet = {};    // 扩展用。日后可以用于前台的数据更新判断. new buffer, old buffer.
};
objUser.prototype.new = function(){  return(new objUser()); };
objUser.prototype.save = gdb.helpUser.save;
objUser.prototype.delete = gdb.helpUser.delete;
objUser.prototype.getByNickName = gdb.helpUser.getByNickName;

var objTask = function() {
  this.UUID = '';
  this.UPTASK = '';
  this.PLANSTART = '';
  this.PLANFINISH = '';
  this.FINISH = '';
  this.STATE = '';
  this.OWNER = '';
  this.OUGHT = '';
  this.PRIVATE = '';
  this.CONTENT = '';
  this.SYNC = '';
  this._exState = 'new';
  this._exDataSet = {};
};
objTask.prototype.new  = function(){  return(new objTask()); };
objTask.prototype.save  = gdb.helpTask.save;
objTask.prototype.delete = gdb.helpTask.delete;
objTask.prototype.getByUUID = gdb.helpTask.getByUUID;
objTask.prototype.getChildren = gdb.helpTask.getChildren;

var objWork = function() {
  this.UUID = '';
  this.UPTASK = '';
  this.CREATETIME = '';
  this.LASTMODIFY = '';
  this.OWNER = '';
  this.PRIVATE = '';
  this.LEVEL = '';
  this.CONTENT = '';
  this.MEMPOINT = '';
  this.MEMEN = '';
  this.MEMTIMER = '';
  this.STATE = '';
  this.SYNC = '';
  this._exState = 'new';
  this._exDataSet = {};
};
objWork.prototype.new = function(){  return(new objWork()); };
objWork.prototype.save = gdb.helpWork.save;
objWork.prototype.delete = gdb.helpWork.delete;
objWork.prototype.getByUUID = gdb.helpWork.getByUUID;

exports.USER = new objUser();
exports.TASK = new objTask();
exports.WORK = new objWork();
exports.setDirty = function(aParm) { aParm._exState = 'dirty' };
exports.setNew = function(aParm) { aParm._exState = 'new' };
exports.setClean = function(aParm) { aParm._exState = 'clean' };
exports.runSql = gdb.runSql;
exports.runSqlPromise = gdb.runSqlPromise;
exports.db = gdb;