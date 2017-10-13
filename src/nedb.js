const async = require('async');
var NetDatabase = require('nedb')
, db = new NetDatabase({ filename: 'db/coins.db', autoload: true })

class LocalStore {

  findAllCoins(){
    return new Promise((resolve, reject) => {
      db.find({}, function (err, docs) {
        resolve(docs);
      });
    })
  }

  doInsertOrUpdates(coins,count) {
    var dataInserts = [];
    var dataUpdates = [];
    for (var i = 0; i < coins.length; i++) {
      var coin = coins[i];
      if (count==0) {
        var dataInsert = {};
        dataInsert.id = coin.id;
				dataInsert.data = [coin.data];
        dataInserts.push(dataInsert);
      } else {
        var dataUpdate = {};
        dataUpdate.id = coin.id;
				dataUpdate.data = coin.data;
        dataUpdates.push(dataUpdate);
      }
    }
    return this.inserts(dataInserts)
               .then(() => this.updates(dataUpdates))
  }

  insertOrUpdate(coins){
    return this.countAll()
               .then((count) => this.doInsertOrUpdates(coins,count))
  }

  countAll(coins){
    return new Promise((resolve, reject) => {
      db.count({}, function (err, count) {
        resolve(count);
      });
    })
  }

  updates(dataUpdates) {
    return new Promise((resolve, reject) => {
      if (dataUpdates.length == 0) return resolve();
      async.mapSeries(dataUpdates, function(dataUpdate, callback){
    		db.update({ id: dataUpdate.id }, { $push: { data: dataUpdate.data } }, {}, function () {
    			callback(null, null);
    		});
    	}, function (err, res){
        if (err) console.log('Error updates' + err);
    		db.persistence.compactDatafile();
        console.log(new Date().toLocaleString() + ' Updates : ' + dataUpdates.length);
        resolve()
    	});
    })
  }

  inserts(dataInserts) {
    return new Promise((resolve, reject) => {
      if (dataInserts.length == 0) return resolve();
      db.insert(dataInserts, function (err, newDoc) {
    		if (err) console.log('Error inserts' + err);
    		db.persistence.compactDatafile();
        console.log(new Date().toLocaleString() + ' Inserts : ' + dataInserts.length);
        resolve()
    	});
    })
  }
}

module.exports = LocalStore;
