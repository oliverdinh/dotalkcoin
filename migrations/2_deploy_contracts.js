var ConvertLib = artifacts.require("./ConvertLib.sol");
//var BigNumber = require("bignumber.js");

var DotalkList = artifacts.require("./DotalkWhitelist.sol");
var DotalkSale = artifacts.require("./DotalkSaleSmartContract.sol");
var adminAddress ="0x2471EC648Db9Eb3e63dbbe1396782B3c6f7A3787";
var multiSigWallet= "0x967cd47aa3195cff1248ac123e8a452d84daba1d";
var totalTokeSupply = 750000000000000000000000000;///new BigNumber(10).pow(18).mul(750000000);
var companyToken= 625000000000000000000000000;///new BigNumber(10).pow(18).mul(749920000);
var saleStartTime_second_from_now = 1519390800;/// Math.floor(Date.now() / 1000) +  5 *60;
var firstRoundStarTime_second_from_now = 1519412399;/// Math.floor(Date.now() / 1000) +  50*60; /// change to 60 second to 6 hours = 6 * 60*60
var saleEndTime_second_from_now = 1519995599;///Math.floor(Date.now() / 1000) +   95* 60; /// change to 7 days= 60*60*24*7

var DotalkListAddress="0x7c20e0a4185d3382ef7c7ccbf58351423607ae90";
var lockedDays = 7;


module.exports = function(deployer) {
 //deployer.deploy(DotalkList);


 deployer.deploy(DotalkSale, adminAddress, multiSigWallet, DotalkListAddress, totalTokeSupply,
        companyToken, saleStartTime_second_from_now, firstRoundStarTime_second_from_now, saleEndTime_second_from_now, lockedDays);



};
