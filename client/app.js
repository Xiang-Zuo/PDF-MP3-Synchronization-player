let ws;
let row = -1;
let col = -1;
let fileNames = [];
let imageElements = [];
let musicFile;
let numOfMeasure = 0;


ws = new WebSocket('ws://localhost:8880');
ws.onopen = function () {
    console.log('Connected!');
};
ws.onmessage = function (event) {
    //console.log(event.data);
    if (event.data instanceof Blob) {
        numOfMeasure++;
        var newImg = document.createElement("img");
        newImg.src = URL.createObjectURL(event.data);
        //console.log(newImg.width + " " + newImg.height);
        //newImg.setAttribute("width", "10%");
        newImg.setAttribute("height", "80");
        if (col !== -1 && row !== -1){
            let id = row + col + "_" + numOfMeasure;
            newImg.setAttribute("id", id);
        }
        col = -1;
        row = -1;
        newImg.setAttribute("onclick", "func(this.id)");
        imageElements.push(newImg);
        sortImageByID();

        //document.getElementById("imageDiv").appendChild(newImg);
    }else{
        if (event.data.includes(".png")){
            let fileID = event.data.replace(".png", "");
            row = fileID.split('_')[0];
            col = fileID.split('_')[1];
            console.log("receive fileID:" + row + col);
        }
    }
};
ws.onclose = function () {
    console.log('Lost connection!');
};
ws.onerror = function () {
    console.log('Error!');
};

function sendPDFFile() {
    let GClef = document.getElementById("GClef");
    let FClef = document.getElementById("FClef");
    let file = document.getElementById('pdfFile').files[0];
    let reader = new FileReader();
    let rawData = new ArrayBuffer();
    let clef;
    if (file == null)
    {
        alert("file is empty");
        return;
    }

    if (GClef.checked !== true && FClef.checked !== true){
        alert("Please choose the clef of the music");
        return;
    }else if (GClef.checked === true && FClef.checked === true) {
        alert("Please choose only one correct of the clef of the music");
        return;
    }else{
        document.getElementsByClassName("loading-mask")[0].style.visibility = 'visible';
        if (GClef.checked === true)
            clef = "clef_G.png";
        else
            clef = "clef_F.png";
    }
    ws.send("clef*" + clef);

    reader.loadend = function() {
    };
    reader.onload = function(e) {
        rawData = e.target.result;
        ws.send(JSON.stringify({
            msgType: "file",
            fileName: file.name
        }));

        ws.send(rawData);
        alert("the File has been transferred.")
        //console.log(rawData)
    };

    reader.readAsArrayBuffer(file);
}

function musicControl() {
    musicFile = document.getElementById('musicFile').files[0];
    let audio = document.getElementById('music');
    var reader = new FileReader();
    reader.onload = function(e) {
        audio.src = this.result;
        audio.controls = true;
    };
    reader.readAsDataURL(musicFile);
}

function sortImageByID() {
    //console.log(imageElements);
    console.log("sort");
    let orderOfMeasure = 0;
    if (imageElements && imageElements.length){
        imageElements.sort(function (a,b) {
            return a.id.localeCompare(b.id)
        })
    } else return;
    //console.log(imageElements);
    var imageDiv = document.getElementById("imageDiv");
    var first = imageDiv.firstElementChild;
    while (first){
        first.remove();
        first = imageDiv.firstElementChild;
    }
    let lineNum = imageElements[0].id.charAt(0);
    imageElements.forEach(function (image) {
        if (image.id.charAt(0) !== lineNum){
            //console.log(lineNum + "   " + image.id);
            let br = document.createElement("br");
            br.setAttribute("id", "line" + lineNum);
            document.getElementById("imageDiv").appendChild(br);
            lineNum = image.id.charAt(0);
        }
        document.getElementById("imageDiv").appendChild(image);
        image.id = image.id.replace(image.id.split('_')[1], orderOfMeasure);
        orderOfMeasure++;
    })
    document.getElementsByClassName("loading-mask")[0].style.visibility = 'hidden';
}

function func(imageID) {
    console.log("click" + imageID + "   " + numOfMeasure);
    let thisMusic = document.getElementById('music');
    let playpoint = (thisMusic.duration / numOfMeasure) * parseFloat(imageID.split("_")[1]);
    console.log(parseFloat(imageID.split("_")[1]));
    console.log(playpoint);
    if (thisMusic.src != null) {
        thisMusic.currentTime = playpoint;
        // if (thisMusic.paused){
        //     thisMusic.currentTime = 3;
        //     thisMusic.play();
        // }else{
        //     thisMusic.pause();
        // }
    }
}

function backgroundControl() {
    let theMusic = document.getElementById('music');
    // while (theMusic.src != null){
    //     if (!theMusic.paused){
    //         let currentTime = theMusic.currentTime;
    //         let measure = currentTime / theMusic.duration * numOfMeasure;
    //         console.log(measure);
    //     }
    // }

    let a = setInterval(function () {
        let currentTime = theMusic.currentTime;
        let whichMeasure = currentTime / theMusic.duration * numOfMeasure;
        //console.log(Math.floor(whichMeasure));
        imageElements.forEach(function (image) {
            //console.log(image.id);
            //console.log(image.id.split("_")[1]);
            if (image.id.split("_")[1] == Math.floor(whichMeasure)){
                let theImage = document.getElementById(image.id);
                theImage.setAttribute("height", "90");
                //console.log("aaaaa" + image.id + "________" + whichMeasure)
            }else {
                let theImage = document.getElementById(image.id);
                theImage.setAttribute("height", "80");
            }
        })
        },10);

}