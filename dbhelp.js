/**
 * Created by donghai on 2014/9/26.
 *
 *
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
