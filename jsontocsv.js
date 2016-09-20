var json2csv = require('json2csv');
var mongoose = require('mongoose');
var mongoose = require('mongoose');
var fs = require('fs');
mongoose.connect('mongodb://localhost/TGNH');
var priceSchema = new mongoose.Schema({
  Volumn : String,
  Price: String,
  PriceTGNH: String
});
var productSchema = new mongoose.Schema({
  _id: String,
  ProductName: String,
  ProductPrices:[priceSchema],
  ProductSex: String,
  ProductLabel: String
},{_id:false});
var Product = mongoose.model('Product',productSchema);
Product.find({},function(err,products){
  console.log(products);
  /*var fields = ['ProductName','ProductSex','ProductLabel','ProductPrices'];
  var data = products;
  var csv = json2csv({data:data,fields:fields});
  fs.writeFile('file.csv', csv, function(err) {
  if (err) throw err;
  console.log('file saved');
  });*/
  var jsonfile = require('jsonfile')

  var file = 'data.json'
  var obj = products;

  jsonfile.writeFile(file, obj, function (err) {
    console.error(err)
  })
});
