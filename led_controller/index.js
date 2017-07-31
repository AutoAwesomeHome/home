var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var piblaster = require('pi-blaster.js');


// name GPIO pins to their corresponding led color
var red = 22, // Check
    gre = 27, // Check
    blu = 18,   // Check
    whi = 25

var _r = 0, _g = 0, _b = 0, _w = 0;
var _h = 0, _s = 1, _v = 1;

 var intensity = 1;
 var fade_speed = 10;
 var fading = false;


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});



io.on('connection', function(socket){
  // Set manual RGB by passing a msg object containing
  // the separate values
  socket.on('rgbw', function(msg){
    fading = false;
    Set_RGB(msg.r, msg.g, msg.b);
  });

  // Set the strip to start fading with a given intensity
  socket.on('rainbow', function(msg){
      intensity = msg.intensity;
      if(!fading) 
      {
        fading = true;
        hsvloop();
      }
  });

  socket.on('stop', function(msg){
    fadeOut();
  });
});


const hsvloop = async () => {
    while(fading)
    {
        _h += 0.002;
        if(_h > 1)
            _h = 0;

        Set_HSV();
        await snooze(fade_speed);
    }
}


const fadeOut = async () => {
    fading = false;
    while(intensity > 0)
    {
        intensity -= 0.007;
        if(intensity < 0)
            intensity = 0;
        Set_RGB(); 
        await snooze(fade_speed * 5);
    }

}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));


function Set_RGB(){
    console.log(" r:" + _r + " g:"+ _g  + " b:"+ _b  + " I:"+ intensity);
    piblaster.setPwm(red, _r * intensity); 
    piblaster.setPwm(gre, _g * intensity);  
    piblaster.setPwm(blu, _b * intensity);  
    piblaster.setPwm(whi, _w * intensity);  
}

function Set_HSV(){
    console.log(" h:" + _h + " s:"+ _s  + " v:"+ _v  + " I:"+ intensity);
    HSVtoRGB(_h, _s, _v);
    Set_RGB();
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});



/* accepts parameters
 * h  Object = {h:x, s:y, v:z}
 * OR 
 * h, s, v
*/
function HSVtoRGB(h, s, v) {
    var r, g, b, i, f, p, q, t;
    if (arguments.length === 1) {
        s = h.s, v = h.v, h = h.h;
    }
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    _r = r;
    _g = g;
    _b = b;
}