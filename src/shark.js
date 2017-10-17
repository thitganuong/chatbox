var bittrex = require('node.bittrex.api');
const LocalStore = require("./nedb.js")
const FacebookBot = require("./facebook_bot.js");
var facebookBot = new FacebookBot();

var db = new LocalStore();
var numOfNen = 4
, recentNenCheck = 2
, percentCheck = 5;

class Shark {
  constructor() {
		bittrex.options({
      'apikey' : '',
      'apisecret' : '',
			'baseUrl' : 'https://bittrex.com/api/v1.1',
	  	'stream' : false, // will be removed from future versions
	  	'verbose' : true,
	  	'cleartext' : true
		});
  }

  getXRP(){
      return new Promise((resolve, reject) => {
      var url = 'https://bittrex.com/api/v1.1/public/getticker?market=USDT-XRP';
      var price = 0;
          bittrex.sendCustomRequest( url, function( data, err ) {
            if (data == null) return reject();
            var array = JSON.parse(data.toString());
          //  var results = array.result.Bid;
          //      price = results;
          //      console.log("kq:" + results);
          //      return resolve(results);
                return resolve(array);
          })
		    });
      }

  getXRPHistory(){
    return new Promise((resolve, reject) => {
			bittrex.getmarkethistory({market : 'USDT-XRP'},function(error,data) {
				if (data == null) return reject();
				var array = JSON.parse(data.toString());
				//var results = array.result.filter(function(coin){ return coin.MarketName.indexOf('BTC-') != -1; });
				return resolve(array);
    	})
		});
  }

  getCoins() {
		return new Promise((resolve, reject) => {
			bittrex.getmarketsummaries(function(data) {
				if (data == null) return reject();
				var array = JSON.parse(data.toString());
				var results = array.result.filter(function(coin){ return coin.MarketName.indexOf('BTC-') != -1; });
				return resolve(results);
    	})
		});
	}

  insertResults(results){
    var data = [];
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      var coin = {};
      coin.id = result.MarketName;
      coin.data = {'last':result.Last,'vol':result.Volume};
      data.push(coin);
    }
    return db.insertOrUpdate(data);
  }

  findFeatureCoins(){
    return db.findAllCoins()
             .then((results) => this.processResults(results));
  }

  processResults(results){
    var text = '';
    for (var i = 0; i < results.length; i++) {
      var result = results[i];
      if (result.data.length < numOfNen) continue;
      text += this.processResult(result);
    }
     if (text != '') {
        facebookBot.doTextResponsePromise('1344416672352785',text);//hai
        facebookBot.doTextResponsePromise('1022286617832441',text);//aTHanh

    }
    if (text != '') console.log(text);
  }

  processResult(result){
    var data = result.data.slice(result.data.length-numOfNen, result.data.length);

    for (var i = 0; i < data.length; i++) {
      if (i == data.length-1) break;
      var d = data[i];
      var dn = data[i+1];
      if (dn.last - d.last > 0) {
        d.status = 1; // up
      } else {
        d.status = 2; // down
      }
      d.vol_change = dn.vol - d.vol;
    }
    var d3 = data[3];
    data = data.slice(0, data.length-1);
    var d0 = data[0];
    var d1 = data[1];
    var d2 = data[2];
    var text = '';
    if (d0.status == 1 && d1.status == 1 && d2.status == 1){
      var percent = ((d3.last-d0.last)/d0.last)*100;
      if (percent >= percentCheck && ((d2.vol-d0.vol)/d0.vol*100).toFixed(2) >20) {
        text += result.id + ':' + percent.toFixed(2) + '%\n';
        text += 'Nen : 3\n';
        text += 'Min:' + d0.last + '\n';
        text += 'Max:' + d3.last + '\n';
        text += 'Vol changed:' + ((d2.vol-d0.vol)/d0.vol*100).toFixed(2) + '\n';
        text += 'https://bittrex.com/Market/Index?MarketName=' + result.id + '\n';
      }
    } else if (d1.status == 1 && d2.status == 1 && ((d2.vol-d0.vol)/d0.vol*100).toFixed(2) >20){
      var percent = ((d3.last-d1.last)/d1.last)*100;
      if (percent >= percentCheck) {
        text += result.id + ':' + percent.toFixed(2) + '%\n';
        text += 'Nen : 2\n';
        text += 'Min:' + d1.last + '\n';
        text += 'Max:' + d3.last + '\n';
        text += 'Vol changed:' + ((d2.vol-d1.vol)/d1.vol*100).toFixed(2) + '\n';
        text += 'https://bittrex.com/Market/Index?MarketName=' + result.id + '\n';
      }
    }
    return text;
  }
}

var s = new Shark();
function run() {
  s.getCoins()
   .then((results) => s.insertResults(results))
   .then(() => s.findFeatureCoins())
   .then(() => console.log(new Date().toLocaleString() + ' finish'))
}
var s2 = new Shark();
function runBTC() {
  s2.getCoinsBTC()
   .then((results) => s2.insertResults(results))
   .then(() => s2.findFeatureCoins())
   .then(() => console.log(new Date().toLocaleString() + ' finish'))
}

run();
setInterval(run, 5*60*1000);

module.exports = Shark;
