#!/usr/bin/env node
const inquirer = require('inquirer');
const forever = require('forever-monitor');
const _ = require('underscore');
const path = require('path');
const fs = require('fs-extra');
const request = require('request');
const program = require('commander');
const { exec } = require('child_process');
process.env["NODE_CONFIG_DIR"] = path.join(__dirname, "config");
const config = require('config');

const ENUM = {
    MainFunctions:{
        start: 'start',
        pull: 'pull',//And build?
        list: 'list',
        stop: 'stop',
        init: 'init',
        auth: 'auth',
        //update: 'update',
        tail: 'tail'
    }
}
///home/user1a/WebstormProjects/schematical-chaoscraft/bot/
class App{
    constructor(){
        this._childCount = 0;
        this._children = {};
    }
    Run(cmd){
        switch(cmd){
            case('pull'):
                return this.Pull();
            default:
                console.log("Prompting Main...");
                return this.PromptMain();
        }

    }
    PromptMain(){
        return inquirer
            .prompt([
                /* Pass your questions in here */
                {type: 'list', name: 'function_selection', choices:Object.keys(ENUM.MainFunctions)},
            ])
            .then(answers => {
                switch(answers.function_selection){
                    case(ENUM.MainFunctions.start):
                        return this.Start();
                    break;
                    case(ENUM.MainFunctions.list):
                        return this.List();
                    break;
                    case(ENUM.MainFunctions.pull):
                        return this.Pull();
                    break;
                }
                console.error("TODO: Finish this function: " + answers.function_selection)
            });
    }
    Start(){
        /*return inquirer
            .prompt([
                /!* Pass your questions in here *!/
                {type: 'input', name: 'chaoscraft_repo_path', default:  path.join(process.cwd(), 'chaoscraft-master')  },
                {type: 'input', name: 'count', default:  1  },
                {type: 'input', name: 'log_dir', default:  path.join(process.cwd(), 'logs') }
            ])
            .then(answers => {*/

                return new Promise((resolve, reject)=>{
console.log("Starting: " + config.get('local.chaoscraft_bot_repo_path'));
                    try {
                        if(!fs.existsSync(config.get('local.log_dir'))){
                            fs.mkdirSync(config.get('local.log_dir'));
                        }
                        let logFile = path.join(config.get('local.log_dir'), this._childCount + '.log');
                        var child = new (forever.Monitor)('index.js', {
                            max: 3,
                            silent: true,
                            args: [],
                            sourceDir: 'dist',
                            cwd: config.get('local.chaoscraft_bot_repo_path'),
                            env: { NODE_ENV: 'production'},
                            outFile: logFile,
                            errFile: logFile
                        });
                        let childProcess = new ChildProcess(child, this._childCount);


                        this._children[this._childCount] = childProcess;
                        this._childCount += 1;

                        childProcess.Start();
                    }catch(err){
                        return reject(err);
                    }
                    console.log("Process Started");
                    return resolve();
                })
                /*.then(()=>{
                    return this.PromptMain();
                })
            });*/

    }
    List(){


        return inquirer
            .prompt([
                /* Pass your questions in here */
                {type: 'list', name: 'child_selection', choices:Object.keys(this._children)},
            ])
            .then(answers => {

                console.error("You selected child: " + answers.child_selection)
            });

    }
    Pull(){
        let zipPath = path.join(process.cwd(), 'chaoscraft-source.zip');

        return new Promise((resolve, reject)=>{
            let repoUrl = config.get('repo.zip_url');
            console.log("Starting Download... " + repoUrl);
            request(
                repoUrl
            ).pipe(fs.createWriteStream(zipPath))
                .on('finish', ()=>{
                    console.log(" Download End...");
                    return resolve();
                })
                .on('error', (err)=>{
                    console.error("Download Error: " + err.message);
                    return reject(err);
                });
        })
        .then(()=>{
            console.log("Moving on...");
            return new Promise((resolve, reject)=>{
                var extract = require('extract-zip');
                console.log("Extracting: " + zipPath + ' - ' + process.cwd());
                extract(zipPath, {dir: process.cwd() }, function (err) {
                    // extraction is complete. make sure to handle the err
                    if(err) return reject(err);
                    console.log("Done extracting to: ", process.cwd());
                    return resolve();
                })
            })

        })
        .then(()=>{
            return new Promise((resolve, reject)=>{
                console.log("Running `npm install`..");

                return exec(
                    'npm i',
                    {
                        cwd: config.get('local.chaoscraft_bot_repo_path')
                    },
                    (err) => {
                        if(err){
                            return reject(err);
                        }
                        console.log("`npm install` finished");
                        return resolve();
                    }
                );

            })
        })
        .then(()=>{
            return new Promise((resolve, reject)=>{
                console.log("Running `tsc`..");
                return exec(
                    path.join(__dirname, 'node_modules', 'typescript', 'bin', 'tsc'),
                    {
                        cwd: config.get('local.chaoscraft_bot_repo_path')
                    },
                    (err, stdout, stderror) => {
                        if(err){
                            console.error("`tsc` finished with error: ")
                                console.log(stdout);
                            console.log(stderror);
                            return reject(err);
                        }
                        console.log("`tsc` finished successfully");
                        return resolve();
                    }
                );
            })
        })
        .then(()=>{
            console.log("ChaosCraft - Pull and Build Finished Successfully");
        })
        /*.then(()=>{
            return inquirer
                .prompt([
                    /!* Pass your questions in here *!/
                    {type: 'input', name: 'done' },
                ])
        })*/
        .catch((err)=>{
            console.error("Err:", err.message, err.stack);
        })
    }
    Auth(){
        return inquirer
            .prompt([
                /* Pass your questions in here */
                {type: 'input', name: 'username'},
                {type: 'password', name: 'password'}
            ])
            .then(answers => {
                // Use user feedback for... whatever!!
                console.log(answers);
            });
    }
}
class ChildProcess{
    constructor(process, index){
        this._process = process;
        this._index = index;
        this._process.on('exit',  _.bind(this.onExit, this));
        this._process.on('restart',  _.bind(this.onRestart, this));


    }
    Start(){
        this._process.start();
    }
    onExit(){
        console.log('ChaosCraft Process Number ' + this._index + ' has exited after 3 restarts');
    }
    onRestart(){
        console.error('Forever restarting script for ' + this._process.times + ' time');
    }
}


let app = new App();

program
    .version('0.1.0')
    .action(function () {
        console.log("Show Help")
    });

program
    .command('pull')
    //.arguments('pull')
    .description('Pulls down the latest version of the code from the repos and builds it')
    .action(function () {
        app.Pull();
    });

program
    .command('start')
    .option("-c, --count [count]", "How many bots to start")
    //.arguments('')
    .description('Starts running the bots')
    .action(function () {
        app.Start();
    });

program
    .command('init')
    //.arguments('')
    .description('Setsup your local env for ChaosCraft')
    .action(function () {
        app.Init();
    });


if (!process.argv.slice(2).length || !/[arudl]/.test(process.argv.slice(2))) {
    program.outputHelp();
    process.exit();
}
program.parse(process.argv);
