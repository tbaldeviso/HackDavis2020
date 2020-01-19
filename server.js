var express = require('express');
var fs = require('fs');
var util = require('util');
var mime = require('mime');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});

// Set up auth
var vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient({
    keyFilename: '../key.json'
});

var app = express();

// Simple upload form
var form = '<!DOCTYPE HTML><html><body>' +
  "<h1>Recycle Buddy</h1>" +
  `<link rel="stylesheet" type="text/css" href="css/style.css" />`+
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
        res.writeHead(200, {
            'Content-Type': 'text/html'
          });

          res.write('<!DOCTYPE HTML><html><body><link rel="stylesheet" type="text/css" href="css/style.css" />');
      
          // Base64 the image so we can display it on the page
          res.write('<img width=200 class="center" src="' + base64Image(req.file.path) + '"><br>');

          const recycleList = [/bottle/i, /can(\s|$)/i];
          const compostList = [/food/i, /soil/i, /plant/i, /leaves/i, /grass/i];
          const landfillList = [/foil/i, /wrapper/i, /plastic/i, /lid/i];
          var recycle = labels.filter(label => recycleList.some(function(x){
            return x.test(label.description)
          }));
          var compost = labels.filter(label => compostList.some(function(x){
            return x.test(label.description)
          }));
          var landfill = labels.filter(label => landfillList.some(function(x){
            return x.test(label.description)
          }));

          if (recycle.length > 0) {
            res.write(`<span>Cans and Bottles</span>`);
          } else if (compost.length > 0) {
            res.write(`<span>Compost</span>`);
          } else if (landfill.length > 0) {
            res.write(`<span>Landfill</span>`);
          } else {
            res.write(`<span>Cannot identify category</span>`);
          }

          // Delete file (optional)
          fs.unlinkSync(req.file.path);
      
          res.end('<br><a href="javascript:history.back()">Go Back</a></body></html>');
  })
  .catch(err => {
      console.error('ERROR:', err);
  });


});

app.use('/css',express.static(__dirname +'/css'));

app.listen(8080);
console.log('Server Started');

// Turn image into Base64 so we can display it easily

function base64Image(src) {
  var data = fs.readFileSync(src).toString('base64');
  return util.format('data:%s;base64,%s', mime.lookup(src), data);
}