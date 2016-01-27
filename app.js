var express = require('express');
var app = express();
app.use(express.static('public'));
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
var spark = require('spark');
var sms = require("twilio")(process.env.TwilioAccountSID, process.env.TwilioAccessToken);
var lastPublish;
var lastPublishHot;

app.get('/', function(req, res) {
 res.sendFile(__dirname + '/public/index.html');
});

http.listen(port, function() {
    console.log('listening on *: ' + port);   
});

spark.on('login', function() {
    
    spark.getEventStream('tempf', process.env.ParticleDeviceId, function(msg) {
        if (msg) {
            console.log("Event: " +msg.name +":" + msg.data);
            io.emit('tempf', msg.data);    
            
            if (!lastPublish || Date.now() - lastPublish > 3600000) {
                sendSMS("Sauna's on!");
                lastPublish = Date.now();
            }
            
            if (parseInt(msg.data) > 160 && (!lastPublishHot ||  Date.now() - lastPublishHot > 3600000 )) {
                sendSMS("Sauna's hot and ready!");
                lastPublishHot = Date.now();
            }
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

function sendSMS(message) {
        sms.sendMessage({
            to: process.env.SMSNumber, 
            from: process.env.TwilioPhoneNumber, 
            body: message
        }, function(err, boo) {
            console.log("SMS Err: " + err);
        });
}