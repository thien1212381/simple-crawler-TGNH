var request = require('request');
var cheerio = require('cheerio');
var URL = require('url-parse');
var async = require('async');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/TGNH');

var productSchema = new mongoose.Schema({
  _id: String,
  ProductName: String,
  ProductPrices:[],
  ProductSex: String,
  ProductLabel: String,
  ProductDescription:String
},{_id:false});
var Product = mongoose.model('Product',productSchema);

var ROOT_PAGE = 'http://www.thegioinuochoa.com.vn';
var arrProduct = [];
console.time('pop');
async.waterfall([
  function(callback){
    getLinkCategory(ROOT_PAGE,callback);
  },
  function(arrCategory,callback){
    getLinkProduct(arrCategory,callback);
  },
  function(arrProduct,callback){
    crawlerProduct(arrProduct,callback);
  }
],function(err){
  console.log(arrProduct.length);
  console.log('DONE!!!!!!!!!!!!!!!!!!!!!!!!!');
  console.timeEnd('pop');
});

function getLinkCategory(ROOT_PAGE,callback){
  var arrCategory = [];
  request(ROOT_PAGE,function(err,res,body){
    if(err) return callback(err);
    if(res.statusCode!==200) console.log(res.statusCode);
    var $ = cheerio.load(body);
    var categoryLinks = $('a[href]');
    categoryLinks.each(function(){
      if(arrCategory.length>14) {
        return;
      }
      var href = $(this).attr('href');
      if(href.indexOf('.html')!==-1){
        arrCategory.push(ROOT_PAGE+href);
      }
    })
    return callback(null,arrCategory);
  })
};

function getLinkProduct(arrCategory,callback){
  /*var link = arrCategory.pop();
  if(arrCategory.length==0) return callback(null,arrProduct);
  request(link,function(err,res,body){
    if(err) return callback(err);
    var $=cheerio.load(body);
    var items = $('.items');
    items.each(function(){
      var href = $(this).children('a[href]').first().attr('href');
      arrProduct.push(ROOT_PAGE+href);
    })
    getProduct(arrCategory,callback);
  })*/
  async.each(arrCategory,function(categoryLink,cb){
    getalllinkproduct(categoryLink,cb);
  },function(err,result){
    if(err) return callback(err);
    return callback(null,arrProduct);
  })

};

function crawlerProduct(arrProduct,callback){
  async.each(arrProduct,function(productLink,cb){
    request({url:productLink,timeout:1500000 },function(err,res,body){
      if(err) {console.log(productLink+'------>'+'This link is error!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'+err);return cb(null);}
      var $=cheerio.load(body);
      var product = new Product();
      product.ProductName = $('td.img-wrapper div.title h1').text();
      product.ProductName = product.ProductName.indexOf(' ')==0?product.ProductName.substring(1):product.ProductName;
      product.ProductSex= $('td.desc-wrapper div.title img').attr('id');
      product.ProductLabel= $('td.desc-wrapper div.clear strong').text();
      product.ProductDescription = $('td.desc-wrapper div.desc').text();
      product._id = product.ProductName+'_'+product.ProductSex;
      var prices =[];
      var priceSelector = $('tbody tr[itemprop="offers"]');
      priceSelector.each(function(){
        var priceTGNH= parseInt($(this).children('td.g').children('span.price').text().replace(/\./g,''));
        var price= parseInt($(this).children('td.hidden-xs').first().text().replace(/\./g,''));
        var volumn= $(this).children('td').first().text();
        var priceJson = {Volumn:volumn,Price:price,PriceTGNH:priceTGNH};
        prices.push(priceJson);
      });
      product.ProductPrices = prices;
      product.save(function(err){
        if(err) console.log('Duplicate----------------------------------------');
        else console.log('Added-----------------------------------------------');
        return cb(null);
      })
    })
  },function(err,result){
    if(err) return callback(err);
    return callback(null);
  })
};

function getalllinkproduct(link,callback){
  request(link,function(err,res,body){
    //console.log(link);
    if(err) return callback(err);
    var $=cheerio.load(body);
    var items = $('.items');
    items.each(function(){
      var href = $(this).children('a[href]').first().attr('href');
      arrProduct.push(ROOT_PAGE+href);
    })
    var isDisabledNextPage;
    do
    {
      isDisabledNextPage = $('ul').hasClass('pagination')?$('li').hasClass('next disabled'):true;
      if(isDisabledNextPage) {return callback(null,body);}
      else{
        var nextpage = $('.next a[href]').attr('href');
        return getalllinkproduct(ROOT_PAGE+nextpage,callback);
      }
    }while(!isDisabledNextPage);
  })
}
