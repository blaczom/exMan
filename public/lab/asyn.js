async = require('async');
var callback = function(whoami) {
    console.log(whoami);
}


var i = Math.random()*5000;
var j = Math.random()*5000;
var k = Math.random()*5000;

var a = function() { console.log("run 1"); };
var b = function() { console.log("run 2"); };
var c = function() { console.log("run 3"); };


async.series(
  [    
    function() { console.log("run 1");setTimeout(function(){ console.log(1); callback(11);}, 5000); }(),  
    function() { console.log("run 2");setTimeout(function(){ console.log(2); callback(22);}, 3000); }(),  
    function() { console.log("run 3");setTimeout(function(){ console.log(3); callback(33);}, 2000); }()  
     
  ], function(err, values) {
        console.log(err);
    }
);

console.log("ui am here");