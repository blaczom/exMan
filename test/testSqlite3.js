var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('flaws.sqlite');

db.serialize(function() 
{
    db.run("create table IF NOT EXISTS cover_report(filename TEXT, path TEXT) ");
    db.run("create table IF NOT EXISTS raw_data(flawno TEXT, flawid TEXT, filename TEXT) ");
}
);

function saveReport(path, filename, content) {
    // console.log("SAVE REPORT:" + path);    
    try {   
        var stmt = db.prepare("INSERT INTO cover_report(filename,path) VALUES (?,?);");
        stmt.run([filename, path]);
        stmt.finalize();
        console.log("====save REPORT:" + path);
    } 
    catch ( e ) { console.log(e); } 
    finally {
    }

}

function GetReport()
{
    console.log("------GET begig:------");
    var path = "d:/";
    db.each("SELECT filename FROM cover_report where path = ?", [path], function(err, row) {
        var filename = row.filename;
        console.log("------GET filename:------" + filename);
        var stmt2 = db.prepare("INSERT INTO raw_data(flawno,flawid,filename) VALUES (?,?,?)");
        for(var i = 0, len = 3; i < len; ++i) {            
            stmt2.run([path, filename, filename]);
        }
        stmt2.finalize();
    });
    console.log("------GET end:------");
}

function listTarget(root) {
    var fs = require("fs");
    
    fs.readdir("d:/", function(err, files){
        for (i in files) {
            var index = files[i].indexOf(".py");
            if(index >= 0) {
                //其实是异步抽取，为了简便所以简化为同步 
                console.log(files[i] + " saved !");
                saveReport("d:/", files[i], files[i]);
            }        
        }
    });       
};

var async = require('async')
async.series([
  listTarget("d:/"), GetReport()
], function(err, values) {
    console.log(err);
});

// listTarget("d:/"); GetReport();
