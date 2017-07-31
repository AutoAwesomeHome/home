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
    Set(msg.r, msg.g, msg.b);
  });

  // Set the strip to start fading for a given time
  // or unending when -1 is sent 
  socket.on('fade', function(msg){
      piblaster.setPwm(blu, 1); 
      fading = true;
      fadeLoop();
  });

  socket.on('rainbow', function(msg){
      intensity = msg.intensity;
      if(!fading) 
      {
        fading = true;
        rainbowLoop();
      }
  });

  socket.on('stop', function(msg){
    fadeOut();
  });
});


const fadeLoop = async () => {
  while(fading){
      // fade from blue to violet
    for (rc = 0; rc < 101; rc++) { 
      piblaster.setPwm(red, rc/100); 
      await snooze(fade_speed);
    } 
    // fade from violet to red
    for (bc = 100; bc > 0; bc--) { 
      piblaster.setPwm(blu, bc/100);  
      await snooze(fade_speed);
    } 
    // fade from red to yellow
    for (gc = 0; gc < 101; gc++) { 
      piblaster.setPwm(gre, gc/100); 
      await snooze(fade_speed);
    } 
    // fade from yellow to gcreen
    for (rc = 100; rc > 0; rc--) { 
      piblaster.setPwm(red, rc/100); 
      await snooze(fade_speed);;
    } 
    // fade from gcreen to teal
    for (bc = 0; bc < 101; bc++) { 
      piblaster.setPwm(blu, bc/100); 
      await snooze(fade_speed);
    } 
    // fade from teal to blue
    for (gc = 100; gc > 0; gc--) { 
      piblaster.setPwm(gre, gc/100);  
      await snooze(fade_speed);
    } 
  }
}

const rainbowLoop = async () => {
    while(fading){
        var rc = 0, bc = 100, gc = 0;
        // fade from blue to violet
        for (; rc < 101; rc++) {
            _r = rc; 
            Set(); 
            await snooze(fade_speed);
        } 
        // fade from violet to red
        for (; bc > 0; bc--) { 
            _b = bc;
            Set();    
            await snooze(fade_speed);
        } 
        // fade from red to yellow
        for (; gc < 101; gc++) { 
            _g = gc;
            Set();  
            await snooze(fade_speed);
        } 
        // fade from yellow to gcreen
        for (; rc > 0; rc--) { 
            _r = rc;
            Set(); 
            await snooze(fade_speed);
        } 
        // fade from gcreen to teal
        for (; bc < 101; bc++) { 
            _b = bc;
            Set();    
            await snooze(fade_speed);
        } 
        // fade from teal to blue
        for (; gc > 0; gc--) { 
            _g = gc;
            Set();  
            await snooze(fade_speed);
        } 
    }
}

const fadeOut = async () => {
    fading = false;
    while(intensity > 0)
    {
        intensity -= 0.005;
        if(intensity < 0)
            intensity = 0;
        Set(); 
        await snooze(fade_speed * 5);
    }

}

const snooze = ms => new Promise(resolve => setTimeout(resolve, ms));


function Set(){
    console.log(" r:" + _r + " g:"+ _g  + " b:"+ _b  + " I:"+ intensity);
    piblaster.setPwm(red, _r * intensity / 100); 
    piblaster.setPwm(gre, _g * intensity / 100);  
    piblaster.setPwm(blu, _b * intensity / 100);  
    piblaster.setPwm(whi, _w * intensity / 100);  
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
    return {
        r: r,
        g: g,
        b: b
    };
}