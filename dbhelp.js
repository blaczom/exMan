/**
 * Created by donghai on 2014/9/26.
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


exports.genSave = function (aObj, aTable) {
  if (!aObj._exState) {
    console.log(aObj + " not a db object.");
    return ""
  }

  var l_cols = [];
  var l_vals = [];
  for (var i in aObj) {
    // 列名， i， 值 aObj[i]. 全部转化为string。
    if (!(i[0] == '_')) {
      console.log(typeof(aObj[i]));
      switch (typeof(aObj[i])) {
        case "string":
          l_cols.push(i);
          l_vals.push("'" + aObj[i] + "'");
          break;
        case "boolean":
          l_cols.push(i);
          l_vals.push("'" + aObj[i] + "'");
          break;
        case "function":
          break;
        default:
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
      ls_sql = "update " + aTable + ' set ' + lt.join(',') + " where uuid = '" + aObj['UUID'] +"'";
      break;
    default : // do nothing.
      ls_sql = "";
  }
  return ls_sql;
}
exports.genModel = function()
{
  var DB = require('./db');
  DB.directDb.get("select * from WORK ", function(err,rtn) {
    console.log("--------------Work-----------");
    for (var i in rtn) {
      console.log("this." + i + " = "+ rtn[i]  +" ;");  // 没错误顺便输出对象的数据库属性。
    }
    DB.directDb.get("select * from TASK ", function (err, rtn) {
      console.log("--------------Task-----------");
      for (var i in rtn) {
        console.log("this." + i + " = "+ rtn[i]  +" ;");  // 没错误顺便输出对象的数据库属性。
      }
      DB.directDb.get("select * from user ", function (err, rtn) {
        console.log("--------------User-----------");
        for (var i in rtn) {
          console.log("this." + i + " = "+ rtn[i]  +" ;");  // 没错误顺便输出对象的数据库属性。
        }
      })
    })
  })
}