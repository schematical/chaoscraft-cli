const path = require('path');
module.exports = {
    repo:{
        zip_url: 'https://github.com/schematical/chaoscraft/archive/master.zip'
    },
    local:{
        chaoscraft_bot_repo_path: path.join(process.cwd(), 'chaoscraft-master'),
        log_dir: path.join(process.cwd(), 'logs')

    }
}