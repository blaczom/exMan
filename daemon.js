/**
 * Created by blaczom on 2014/10/21.
    var fs = require("fs");
    var fd = fs.openSync('demo1.txt', 'a');
    var written = fs.writeSync(fd, new Date());
    fs.writeSync(fd, argv);
    fs.writeSync(fd, "\r\n");
    fs.closeSync(fd);
 子进程不能olog到窗口。
}

 main(process.argv.slice(2));

 */

var child_process = require('child_process');
function spawn() {
  var worker = child_process.spawn('node', [ 'bin/www' ]);
  worker.on('exit', function (code) {
    if (code !== 0) {
      console.log('i am dieing~~~~', code);
      spawn();
  }});
  worker.on('error', function (code) {
      console.log('i am err~~~~', code);
      spawn();
  });
};
spawn();

