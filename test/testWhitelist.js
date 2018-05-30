var WhiteList = artifacts.require("./DotalkWhitelist.sol");
var BigNumber = require('bignumber.js');
var Helpers = require('./helpers.js');


var listContract;



var addresses = [ "0x50b2a33e722a475727adb20f867df6ab111468ef",
    "0xf97d8980e42d06142a54450334a0097ddde7a9d5",
    "0x4b21d9c5a88b6765838f624ce37ad1209464a76e" ];

var caps = [  new BigNumber(1), new BigNumber(2), new BigNumber(3)];

var owner;
var nonOwner;

var userCapAmount = new BigNumber(15);

////////////////////////////////////////////////////////////////////////////////



contract('white list', function(accounts) {

    beforeEach(function(done){
        done();
    });
    afterEach(function(done){
        done();
    });


    it("deploy contract", function() {
        owner = accounts[2];
        nonOwner = accounts[0];
        return WhiteList.new({from:owner,gas:4000000}).then(function(instance){
            listContract = instance;
        });
    });

    /// set user cap by owner account of smart contract
    it("set user cap by owner account", function() {
        return listContract.setUsersCap(userCapAmount, {from:owner}).then(function(){
            return listContract.communityusersCap();
        }).then(function(result){
            assert.equal( result.valueOf(), userCapAmount.valueOf(), "community user cap is incorrect");
        });
    });

    /// failed to set user cap by non-owner account
    it("failed set user cap by non-owner account", function() {
        return listContract.setUsersCap(userCapAmount.plus(5), {from:nonOwner}).then(function(){
            assert.fail("failed to set user cap");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            // assert( Helpers.throwErrorMessage(error), error);
            // check that value was not set
            return listContract.communityusersCap();
        }).then(function(result){
            assert.equal( result.valueOf(), userCapAmount.valueOf(), "User Cap Amount is changed");
        });
    });

    /// failed to transfer ownership from non-owner account
    it("failed transfer ownership from non owner account", function() {
        return listContract.transferOwnership(accounts[3], {from:nonOwner}).then(function(){
            assert.fail("failed to transferOwnership account");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            //  assert( Helpers.throwErrorMessage(error), error);
            // check that value was not set
            return listContract.owner();
        }).then(function(result){
            assert.equal( result.valueOf(), owner.valueOf(), "Error: ownership is changed");
        });
    });

    /// transfer ownership into another account successfully
    it("transfer ownership from owner", function() {
        return listContract.transferOwnership(accounts[3], {from:owner}).then(function(){
            owner = accounts[3];
            return listContract.owner();
        }).then(function(result){
            assert.equal( result.valueOf(), owner.valueOf(), "Error: ownership is not changed ");
        });
    });



    /// add list of whitelist users
    it("add list of whitelist users into the system", function() {
        return listContract.listAddresses(addresses,caps,{from:owner}).then(function(){
            return listContract.getCap(addresses[0]);
        }).then(function(result){
            assert.equal(result.valueOf(),  userCapAmount, "Error: cap of first user is incorrect");
            return listContract.getCap(addresses[1]);
        }).then(function(result){
            assert.equal(result.valueOf(), caps[1].valueOf(), "Error: cap of the second user is incorrect");
            return listContract.getCap(addresses[2]);
        }).then(function(result){
            assert.equal(result.valueOf(), caps[2].valueOf(), "Error: cap of the third user is incorrect");
        });
    });

    /// remove user by set cap to 0
    it("remove user by set cap to 0", function() {
        caps[1] = new BigNumber(0);
        return listContract.listAddress(addresses[1],caps[1],{from:owner}).then(function(){
            return listContract.getCap(addresses[1]);
        }).then(function(result){
            assert.equal(result.valueOf(), caps[1].valueOf(), "unexpected cap");
        });
    });

    /// failed to add list of whitelist user by non-owner account
    it("list whitelist user from non owner", function() {
        return listContract.listAddresses(addresses,caps,{from:nonOwner}).then(function(){
            assert.fail("expected to fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            // assert( Helpers.throwErrorMessage(error), error);
        });
    });

    /// failed to add a user by non-owner account
    it("add a user from non owner", function() {
        return listContract.listAddress(addresses[1],caps[1],{from:nonOwner}).then(function(){
            assert.fail("expected to fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            //assert( Helpers.throwErrorMessage(error), error);
        });
    });

    /// destroy smart contract by owner account
    it("failed to destroy from non owner", function() {
        return listContract.destroy({from:nonOwner}).then(function(){
            assert.fail("expected to fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            //assert( Helpers.throwErrorMessage(error), error);
        });
    });

    /// destroy smart contract by owner account
    it("destroy from owner", function() {
        return listContract.destroy({from:owner});
    });


});
