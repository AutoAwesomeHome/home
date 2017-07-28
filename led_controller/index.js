var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var piblaster = require('pi-blaster.js');


// name GPIO pins to their corresponding led color
var r = 22,
	g = 27,
	b = 18,
	w = 17


app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    
    var splits = msg.split(",")
    piblaster.setPwm(r, msg[0] ); 
    piblaster.setPwm(g, msg[1] ); 
    piblaster.setPwm(b, msg[2] ); 
    piblaster.setPwm(a, msg[3] ); 

	console.log('message: ' + msg);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});