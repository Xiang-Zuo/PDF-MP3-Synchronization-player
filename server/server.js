const request = require('request');
const WebSocket = require('ws').Server;
const fs = require('file-system');
const spawn = require("child_process").spawn;
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));

let fileName = null;
let clef = null;

function webSocket() {
    const wss = new WebSocket({
        port: 8880
    });
//webSocket Server, communicate with client
    wss.on('connection', function (ws) {
        console.log("ws connected");
        ws.onmessage = function (event) {
            if (typeof event.data === "string") {
                if (event.data.substring(0,5) === "clef*" ){
                    clef = event.data.split("*")[1];
                }else{
                    let msg = JSON.parse(event.data);
                    fileName = msg.fileName;
                }
            } else if (typeof event.data === "object"){
                storeFile(event.data);
            }
        };
        ws.on('end', function () {
            ws.close();
            console.log('Connection ended...');
        });
        var watch = require('node-watch');
        watch('./log.txt', { recursive: true }, async function(evt, name) {
            fs.readFile('log.txt', (err, data) => {
                if (err) throw err;
                //console.log(data.toString());
                if (data.includes("complete successfully!"))
                {
                    ws.send("music score sheet process completed");
                    let dirName = './image/' + fileName.replace(".pdf", "") + "/";

                    fs.readdirSync(dirName).forEach(function (file, index) {
                        setTimeout(function () {
                            fs.readFile(dirName + file, function (err, data) {
                                if (err) throw err;

                                ws.send(file);
                                ws.send(data);
                                console.log("sending file data " + file);

                            });
                        }, 500 * (index + 1))
                    });
                }
            });
        });
        fs.writeFile('./log.txt',"");
    });
}

function storeFile(fileData) {
    if (fileName == null || fileData == null){
        return false;
    }
    fs.writeFile(fileName, fileData, (err) => {
        if (err) throw err;

        console.log('The file has been saved!');
        if (fileName.includes(".pdf")) {
            convertToImage(process.cwd() + '/', fileName);
        }
    });
}

function convertToImage(path, fileName) {

    filePath = path + fileName;
    savePath = path + fileName.replace(".pdf", ".png");

    var convertapi = require('convertapi')('BgctOIH1oiRXLQxN');
    convertapi.convert('png', {
        File: filePath,
        GraphicsAntialiasing : '2'
    }, 'pdf').then(function (result) {
        result.saveFiles(savePath);
    });

    cropImage(fileName);
}

function cropImage(fileName) {
    filePath = './' + fileName.replace(".pdf", ".png");
    const timeout = setInterval(function () {
        const file =  './' + fileName.replace(".pdf", ".png");
        const fileExists = fs.existsSync(file);

        if (fileExists) {
            clearInterval(timeout);
            fs.access(filePath, fs.F_OK, (err) => {
                if (err) {
                    console.error(err);
                }
                else {
                    if (clef === null){
                        console.log("Error, clef is null");
                    }else
                        spawn('python', ["./detect.py", fileName.replace(".pdf", ".png"), clef], {stdio: 'inherit'});
                }
            })
        }else
            console.log("file not exist")
    }, 2000);
}

webSocket();