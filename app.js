var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var spark = require('spark');
var lastPublish;
var lastTemp;

app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);   
});

spark.on('login', function() {
    
    spark.getDevice(process.env.ParticleDeviceId, function(err, device) {
        if (err) {
            console.log("Error getting device: " + err);
            return;
        }
        
        console.log("Device connected: "  + device.connected);
        
        device.getVariable('tempf', function(err, data) {
            if (err) {
                console.log("Error getting initial temp: " + err);
                return;
            }
        
            console.log("Current temp: " + data.result);
            lastTemp = data.result;
        });
    });
    
    io.on('connection', function(socket){
        console.log('a user connected');
        socket.emit('tempf', {tempf: lastTemp, updated: lastPublish});    
    });
    
    spark.getEventStream('tempf', process.env.ParticleDeviceId, function(msg) {
        if (msg) {
            console.log("Event: " +msg.name +":" + msg.data);
            
            lastTemp = msg.data;
            lastPublish = Date.now();
            
            io.emit('tempf',  {tempf: lastTemp, updated: lastPublish});    
        }   
    });
});

spark.login({ accessToken: process.env.ParticleAccessToken });
