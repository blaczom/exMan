/**
 * Created by blaczom on 2014/9/26.
 *
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

var checkOption = function(aOption, aCol){
  // 检查aCol的选项。
  if (aOption) {
    if (aOption.hasOwnProperty("include")){
      if (aOption["include"].indexOf(aCol + ',') >= 0) return true;
    };
    if (aOption.hasOwnProperty("exclude")){
      if (aOption["exclude"].indexOf(aCol + ',') >= 0) return false;
    };
    return true;
  }
  else return true;
}
exports.genSave = function (aObj, aTable, aOption) {    // aOption: include:"col1,col2,"
  if (!aObj._exState) {
    console.log(aObj + " not a db object.");
    return ""
  }

  var l_cols = [];
  var l_vals = [];
  for (var i in aObj) {
    // 列名， i， 值 aObj[i]. 全部转化为string。
    if (!(i[0] == '_') && checkOption(aOption, aObj[i])) {
      var lsTmp = (aObj[i]==null) ? "" : aObj[i];
      switch (typeof(lsTmp)) {
        case "string": case "boolean":case "object":
          l_cols.push(i);
          l_vals.push("'" + lsTmp + "'");
          break;
        case "number":
          l_cols.push(i);
          l_vals.push(lsTmp);
          break;
        case "function":
          break;
        default:
          console.log("--dbhelp.js don't now what it is-" + i + ":" + aObj[i] + ":" + typeof(lsTmp));
          l_cols.push(i);
          l_vals.push(aObj[i].toString());
          break;
      }
    }
  }
  var l_sql="";
  switch (aObj._exState) {
    case "new": // insert into table(col1, col2, ) values (val1, val2, );
      ls_sql = "insert into " + aTable + '(' + l_cols.join(',') + ") values ( " + l_vals.join(',') + ')';
      break;
    case "dirty": // update table set col1=val, col2="", where uuid = "";
      var lt = [];
      for (i = 0 ; i < l_cols.length; i ++) lt.push(l_cols[i] + "=" + l_vals[i] );
      if ('USER,'.indexOf(aTable.toUpperCase()) >= 0 )
        ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where NICKNAME = '" + aObj['NICKNAME'] +"'";
      else
        ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where uuid = '" + aObj['UUID'] +"'";
      break;
    default : // do nothing.
      ls_sql = "";
  }
  return ls_sql;
}

exports.genModel = function(aOpt)
{
  var DB = require('./db');
  if (aOpt)
    var ls_pre = "", ls_sep = ":", ls_end = "'',";
  else
    var ls_pre = "this.", ls_sep = "=", ls_end = "'';";
  DB.directDb.get("select * from WORK ", function(err,rtn) {
    console.log("--------------Work-----------");
    for (var i in rtn) {
      console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
    }
    DB.directDb.get("select * from TASK ", function (err, rtn) {
      console.log("--------------Task-----------");
      for (var i in rtn) {
        console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
      }
      DB.directDb.get("select * from user ", function (err, rtn) {
        console.log("--------------User-----------");
        for (var i in rtn) {
          console.log(ls_pre + i +  ls_sep + rtn[i]  + ls_end);  // 没错误顺便输出对象的数据库属性。
        }
      })
    })
  })
}