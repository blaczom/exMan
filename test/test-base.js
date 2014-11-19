
var testObj = {
  obj : function(aName, aObj) { return {  name : aName, obj : aObj } },
  //ok : function(aObj){ console.log(aObj.name + "测试成功:->", aObj.obj); },
  ok : function(aObj){},  // 不打印，屏幕干净一些。
  no : function(aObj){
    console.log("------测试失败:---->" + aObj.name, aObj.obj);
    return false;
  }
};

exports.testObj = testObj;
