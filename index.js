// # SimpleServer
// A simple chat bot server
const apiaiApp = require('apiai')("db81a21d3b0e4a13adcf1bdaf1090d45");
const Shark = require("./src/shark.js");
var logger = require('morgan');
var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var request = require('request');
var router = express();
var shark = new Shark();
var app = express();
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));
var server = http.createServer(app);

app.listen(process.env.PORT || 3000);

app.get('/', (req, res) => {
  res.send("Server chạy ngon lành nhá.");
});

app.get('/webhook', function(req, res) {
  if (req.query['hub.verify_token'] === 'haint') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

// Đoạn code xử lý khi có người nhắn tin cho bot
app.post('/webhook', function(req, res) {
  console.log("nhan tin nhan ");
  var entries = req.body.entry;
  for (var entry of entries) {
    var messaging = entry.messaging;
    for (var message of messaging) {
      var senderId = message.sender.id;
      let sender = message.sender.id;
      console.log("senderId: " +senderId);
      if (message.message) {
        // Nếu người dùng gửi tin nhắn đến
        if (message.message.text) {
        //  var text = message.message.text;
          let text = (message.message.text).trim();

          if(text.toLowerCase() == 'getid' || text.toLowerCase() == "get id")
          {
            sendMessage(senderId, "senderId:" +senderId, false);
          }
          else if(text.toLowerCase() == 'xrp' || text.toLowerCase() == "get xrp")
          {
            var xrpData = 0;
            shark.getXRP()

              .then((results) => sendMessage(senderId,
                "Người bán(Bid):" + results.result.Bid +"\n"
              + "Người mua (Ask):" + results.result.Ask +"\n"
              + "Giá hiện tại:" + results.result.Last +"\n", false));

          } else if(text.toLowerCase() == 'history' || text.toLowerCase() == "get xrp history")
          {
            shark.getXRPHistory()
              .then((results) => sendMessage(senderId, results, false));
          }
          else {
              let apiai = apiaiApp.textRequest(text, {
                  sessionId: 'tabby_cat' // use any arbitrary id
              });
              apiai.on('response', (message) => {
                  // Got a response from api.ai. Let's POST to Facebook Messenger
                  sendMessage(senderId, message, true);
                });
              apiai.on('error', (error) => {
                  console.log(error);
                });
              apiai.end();
          }
        }
      }
    }
  }

  res.status(200).send("OK");
});

// Gửi thông tin tới REST API để Bot tự trả lời
function sendMessage(senderId, response, isAI) {
  let aiText = ""
  if(isAI){
     aiText = response.result.fulfillment.speech;
  } else {
     aiText = response
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: "EAAD7UARi1b8BAOA2erXEqxVSCHjWngVMk3fY6bCCOmxSv3yuSR0q8KtJDbdKElFoK5YtgOEdqaKmPhp5FT0omAC6yMZB5WHiMDydcZAAolHtdKZA0KMNoic1keQ4WjDK8QfzyKTrDGnYawceZBZAKhZB3Hhgs4pt43JmIUaf7ZBaQZDZD",
    },
    method: 'POST',
    json: {
      recipient: {id: senderId},
      message: {text: aiText}
      //message
    }}, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
  });
};
