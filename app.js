var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var spark = require('spark');

app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);
    console.log(process.env.ParticleDeviceId + " " + process.env.ParticleAccessToken);
    
});

spark.on('login', function() {
    spark.getEventStream('tempf', process.env.ParticleDeviceId, function(msg) {
        if (msg) {
            console.log("Event: " +msg.name +":" + msg.data);
            io.emit('tempf', msg.data);      
        }
    });
    
    spark.getEventStream('spark/status', process.env.ParticleDeviceId, function(msg) {
        if (msg) {
            console.log("Device status: " + msg.data);
            io.emit('devicestatus', msg.data);
        }
    });
});

spark.login({ accessToken: process.env.ParticleAccessToken });
