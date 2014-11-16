/**
 * Created by Administrator on 2014/11/16.
 */
DB = require('../db');
a = DB.User;

b = DB.User;
console.log(a.NICKNAME, "--", b.NICKNAME);

a.NICKNAME = "TEST";
console.log(a.NICKNAME, "--", b.NICKNAME);
