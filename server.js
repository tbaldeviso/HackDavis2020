var express = require('express');
var fs = require('fs');
var util = require('util');
var mime = require('mime');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});

// Set up auth
var vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
    keyFilename: '../Hack Davis 2020-6d0daaf83738.json'
});

var app = express();

// Simple upload form
var form = '<!DOCTYPE HTML><html><body>' +
  `<link rel="stylesheet" type="text/css" href="css/style.css" />`+
  "<h1>Waste Bud</h1>" +
  `<span>Upload an image of waste to be categorized!</span>` +
  "<form method='post' action='/upload' enctype='multipart/form-data'>" +
  "<div><input type='file' name='image'/></div>" +
  "<input type='submit' /></form>" +
  '</body></html>';

app.get('/', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end(form);
});

// Get the uploaded image
// Image is uploaded to req.file.path
app.post('/upload', upload.single('image'), function(req, res, next) {
  client
    .labelDetection(req.file.path)
    .then(results => {
        var labels = results[0].labelAnnotations;
        console.log(labels)
        res.writeHead(200, {
            'Content-Type': 'text/html'
          });

          res.write(`<!DOCTYPE HTML><html><body><link rel="stylesheet" type="text/css" href="css/uploadstyle.css" /><h1>Waste Bud</h1>`);

          // Base64 the image so we can display it on the page
          res.write('<img width=150 class="center" src="' + base64Image(req.file.path) + '"><br>');

          // List of regex per category
          const recycleList = [
              /bottle/i,
              /can(\s|$)/i,
              /lid/i,
              /plastic/i,
              /cardboard/i,
              /paper/i,
              /linen/i,
              /fabric/i,
              /rag/i
          ];
          const compostList = [
              /produce/i,
              /cuisine/i,
              /meat/i,
              /egg/i,
              /bread/i,
              /pasta/i,
              /vegetable/i,
              /food/i,
              /soil/i,
              /plant/i,
              /leaves/i,
              /grass/i
          ];
          const landfillList = [
              /cigarette/i,
              /ceramic/i,
              /styrofoam/i,
              /wood/i,
              /diaper/i,
              /rubber\sband/i,
              /dish/i,
              /glass/i,
              /foil/i,
              /wrapper/i
          ];
  
          // Filter out any labels not pertaining to any of the categories
          var recycle = labels.filter(label => recycleList.some(function(x){
            return x.test(label.description)
          }));
          var compost = labels.filter(label => compostList.some(function(x){
            return x.test(label.description)
          }));
          var landfill = labels.filter(label => landfillList.some(function(x){
            return x.test(label.description)
          }));

          // Sum up scores for each category
          var recyclescore = 0;
          recycle.forEach(element => {
            recyclescore = recyclescore + element.score
          });
          var compostscore = 0;
          compost.forEach(element => {
            compostscore = compostscore + element.score
          });
          var landfillscore = 0;
          landfill.forEach(element => {
            landfillscore = landfillscore + element.score
          });

          // Waste category has the highest score
          if (recyclescore > compostscore && recyclescore > landfillscore) {
            res.write(`<img class="logo" src="./images/Logos/RecycleLogo.png"> </img> <span>Recycle</span>`);
          } else if (compostscore > recyclescore && compostscore > landfillscore) {
            res.write(`<img class="logo" src="./images/Logos/CompostLogo.png"> </img> <span>Compost</span>`);
          } else if (landfillscore > compostscore && landfillscore > recyclescore) {
            res.write(`<img class="logo" src="./images/Logos/LandfillLogo.png"> </img> <span>Landfill</span>`);
          } else if (recyclescore == 0 && landfillscore == 0 && compostscore == 0){
            res.write(`<span>Cannot identify category</span>`);
          }

          // Delete file (optional)
          fs.unlinkSync(req.file.path);
      
          // Add ending html including back button
          res.end('<br><br><a href="javascript:history.back()">Go Back</a></body></html>');
  })
  .catch(err => {
      console.error('ERROR:', err);
  });


});

// Include css folder
app.use('/css',express.static(__dirname +'/css'));
app.use('/images',express.static(__dirname +'/images'));

// Listen to local host on port 8080
app.listen(8080);
console.log('Server Started in https://localhost:8080');

// Turn image into Base64 so we can display it easily
function base64Image(src) {
  var data = fs.readFileSync(src).toString('base64');
  return util.format('data:%s;base64,%s', mime.lookup(src), data);
}