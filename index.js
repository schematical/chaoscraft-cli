#!/usr/bin/env node
const inquirer = require('inquirer');
const forever = require('forever-monitor');
const _ = require('underscore');
const path = require('path');
const fs = require('fs');
const request = require('request');
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
    Run(){
        return this.PromptMain();
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
        return inquirer
            .prompt([
                /* Pass your questions in here */
                {type: 'input', name: 'chaoscraft_repo_path', default:  process.cwd()  },
                {type: 'input', name: 'count', default:  1  },
                {type: 'input', name: 'log_dir', default:  path.join(process.cwd(), 'logs') }
            ])
            .then(answers => {

                return new Promise((resolve, reject)=>{

                    try {
                        if(!fs.existsSync(answers.log_dir)){
                            fs.mkdirSync(answers.log_dir);
                        }
                        let logFile = path.join(answers.log_dir, this._childCount + '.log');
                        var child = new (forever.Monitor)('index.js', {
                            max: 3,
                            silent: true,
                            args: [],
                            sourceDir: 'dist',
                            cwd: answers.chaoscraft_repo_path,
                            env: {NODE_ENV: 'production'},
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
                .then(()=>{
                    return this.PromptMain();
                })
            });

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
            console.log("Starting Download...");
            request(
                config.get('repo.zip_url')
            ).pipe(fs.createWriteStream(zipPath))
                .on('end', ()=>{
                    console.log(" Download End...");
                    return resolve();
                })
                .on('error', (err)=>{
                    console.error("Download Error: " + err.message);
                    return reject(err);
                });
        })
        .then(()=>{
            return new Promise((resolve, reject)=>{
                var extract = require('extract-zip')
                extract(zipPath, {dir: process.cwd() }, function (err) {
                    // extraction is complete. make sure to handle the err
                    if(err) return reject(err);
                    console.log("Done extracting to: ", process.cwd());
                    return resolve();
                })
            })

        })
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
app.Run();
