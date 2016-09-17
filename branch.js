'use strict';

const fs = require('fs');
const Canvas = require('canvas');
const randy = require('randy');
const seed = require('seed-random');
const Twit = require('twit');
const argv = require('minimist')(process.argv.slice(2));
require('dotenv').config();

var T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

const squareSize = 500;
const color1 = randomColor();
const color2 = randomColor();

const Image = Canvas.Image;
const canvas = new Canvas(2 * squareSize, squareSize);
const ctx = canvas.getContext('2d');


// background color
ctx.fillStyle = color2;
ctx.fillRect(0,0,squareSize,squareSize);
ctx.fillStyle = color1;
ctx.fillRect(squareSize, 0, (squareSize * 2), squareSize);

const start = [squareSize, squareSize / 2];

const draw = function (direction, points) {
  var point = points.shift();
  var x = point[0];
  var y = point[1];
  for (var i = 0; i < 2; i++) {
    ctx.moveTo(x, y);
    if (direction === 'forward') {
      var newX = x + randy.randInt(50,100);
    } else {
      var newX = x - randy.randInt(50,100);
    }
    var newY = y +randy.randInt(-100,100);
    ctx.lineTo(newX, newY);
    points.push([newX, newY]);
  }
  if ((x > 0) && (x < (2 * squareSize))) {
    draw(direction, points);
  }
}

ctx.beginPath();
draw('forward', [start]);
ctx.strokeStyle = color2;
ctx.stroke();

ctx.beginPath();
draw('backward', [start]);
ctx.strokeStyle = color1;
ctx.stroke();

if (argv.test) {
  // write to file
  var out = fs.createWriteStream(__dirname + '/branch.png');
  var stream = canvas.pngStream();
  stream.on('data', function(chunk){
    out.write(chunk);
  });

  stream.on('end', function(){
    console.log(`>> ${color1}, ${color2}`);
    console.log('>> saved png');
  });
} else {
  // create tweet
  T.post('media/upload', { media_data: canvas.toBuffer().toString('base64') }, function (err, data, response) {
    if (err) { console.log(err); }
    var mediaIdStr = data.media_id_string;
    var altText = 'branches';
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

    T.post('media/metadata/create', meta_params, function (err, data, response) {
      // if (err) { console.log(err); }
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet)
        var params = { status: '', media_ids: [mediaIdStr] };

        T.post('statuses/update', params, function (err, data, response) {
          if (err) {
            console.log('Error posting status: \n'+err);
          } else {
            console.log(data, response);
          }
        });
      }
    });
  });
}

function randomColor() {
  return '#000000'.replace(/0/g, function () {return (~~(Math.random()*16)).toString(16);});
}
