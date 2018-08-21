const WD = '/home/user1a/WebstormProjects/schematical-chaoscraft/bot';
process.cwd(WD);
const forever = require('forever-monitor');
var child = new (forever.Monitor)('index.js', {
    max: 3,
    silent: false,
    args: [],
    sourceDir: 'dist',
    cwd: WD
});

child.on('exit', function () {
    console.log('your-filename.js has exited after 3 restarts');
});

child.start();