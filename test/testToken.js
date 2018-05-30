
var Token = artifacts.require("./DotalkTokenSmartContract.sol");
var BigNumber = require('bignumber.js');
var Helpers = require('./helpers.js');

////////////////////////////////////////////////////////////////////////////////

var tokenContract;
var saleStartTime;
var saleEndTime;

var tokenOwner;
var tokenAdmin;

var lockedDay = 0;

var totalSupply = web3.toWei( new BigNumber(200000000), "ether" );


var erc20TokenContract;

////////////////////////////////////////////////////////////////////////////////

contract('token contract', function(accounts) {

    beforeEach(function(done){
        done();
    });
    afterEach(function(done){
        done();
    });

   

    it("mine one block to get current time", function() {
        return Helpers.sendPromise( 'evm_mine', [] );
    });


    /// test for deploy token
    it("deploy token and init accounts", function() {
        tokenOwner = accounts[0];
        tokenAdmin = accounts[1];

        var currentTime = web3.eth.getBlock('latest').timestamp;

        saleStartTime = currentTime + 120;
        saleEndTime = saleStartTime + 28800;

        // deploy a Dotalk token
        return Token.new(totalSupply, saleStartTime,saleEndTime, lockedDay, tokenAdmin, {from: tokenOwner}).then(function(result){
            tokenContract = result;

            // return totalSupply of contract
            return tokenContract.totalSupply();
        }).then(function(result){
            // check total supply of token smart contract
            assert.equal(result.valueOf(), totalSupply.valueOf(), "total supply are incorrect");

            // check that owner gets all supply
            return tokenContract.balanceOf(tokenOwner);
        }).then(function(result){

            //check that Owner will hold all tokens
            assert.equal(result.valueOf(), totalSupply.valueOf(), "Owner balance are incorrect");
        });
    });

    // owner is able to transfer token before token sale
    it("transfer before token sale by token owner account", function() {
        var value = new BigNumber(5);
        return tokenContract.transfer(accounts[2], value, {from:tokenOwner}).then(function(){
            // get balances of token owner
            return tokenContract.balanceOf(tokenOwner);
        }).then(function(result){
            ///  check balance of Token Owner after transferring successfully
            assert.equal(result.valueOf(), totalSupply.minus(value).valueOf(), "Balance of token owner is incorrect ");
            return tokenContract.balanceOf(accounts[2]);

        }).then(function(result){
            /// check balance of Receiver account
            assert.equal(result.valueOf(), value.valueOf(), "Balance of Received account is incorrect");
        });
    })


    /// increase time of chain to make token sale happen
    it("fast forward to token sale", function() {
        var fastForwardTime = saleStartTime - web3.eth.getBlock('latest').timestamp + 1;
        return Helpers.sendPromise( 'evm_increaseTime', [fastForwardTime] ).then(function(){
            return Helpers.sendPromise( 'evm_mine', [] ).then(function(){
                var currentTime = web3.eth.getBlock('latest').timestamp;
                if( currentTime <= saleStartTime ) assert.fail( "current time is not in a token sale period" );
            });
        });
    });


    /// owner is able to transfer token during crowdsale
    it("transfer from owner during crowdsale period", function() {
        var value = new BigNumber(5);
        return tokenContract.transfer(accounts[2], value, {from:tokenOwner}).then(function(){
            // get balances
            return tokenContract.balanceOf(tokenOwner);
        }).then(function(result){
            assert.equal(result.valueOf(), totalSupply.minus(value.mul(2)).valueOf(), "unexpected balance");
            return tokenContract.balanceOf(accounts[2]);
        }).then(function(result){
            assert.equal(result.valueOf(), value.mul(2).valueOf(), "unexpected balance");
        });
    });

    /// admin is not able to transfer token during token sale
    it("fail Transfer from non owner during crowdsale period", function() {
        var value = new BigNumber(5);
        // transfer token by admin account - accounts[1]
        return tokenContract.transfer(accounts[1], value, {from:accounts[2]}).then(function(){
            assert.fail("transfer is during sale is expected to fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');

        });
    });

    /// non-onwner is not able to transfer token during token sale
    it("fail TransferFrom non owner during crowdsale", function() {
        var value = new BigNumber(5);
        /// transfer token from normal account
        return tokenContract.approve(accounts[5], value, {from:accounts[2]}).then(function(){
            return tokenContract.transferFrom(accounts[2],accounts[3],value,{from:accounts[5]});
        }).then(function(){
            assert.fail("normal account is failed to transfer token during crowdsale perdiod");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
            // revert approve
            return tokenContract.approve(accounts[5], new BigNumber(0), {from:accounts[2]});
        });
    });

    ///increase block timestamp to end crowdsale
    it("fast forward to token sale end", function() {
        var fastForwardTime = saleEndTime - web3.eth.getBlock('latest').timestamp + 1;
        return Helpers.sendPromise( 'evm_increaseTime', [fastForwardTime] ).then(function(){
            return Helpers.sendPromise( 'evm_mine', [] ).then(function(){
                var currentTime = web3.eth.getBlock('latest').timestamp;
                if( currentTime <= saleEndTime ) assert.fail( "current time is earlier than endsale time" );
            });
        });
    });

    /// owner can transfer token to a normal
    it("transfer from owner in token sale", function() {
        var value = new BigNumber(150);
        return tokenContract.transfer(accounts[7], value, {from:tokenOwner});
    });

    /// normal account transfer more than balance
    it("failed transfer more than balance", function() {
        var value = new BigNumber(160);
        return tokenContract.transfer(accounts[8], value, {from:accounts[7]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){
            assert( Helpers.throwErrorMessage(error), "expected throw got " + error);
            //assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// failed to transfer token to address 0
    it("failed transfer to address 0", function() {
        var value = new BigNumber(20);
        return tokenContract.transfer("0x0000000000000000000000000000000000000000", value, {from:accounts[7]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// failed to transfer token to token smart contract
    it("failed transfer to token contract", function() {
        var value = new BigNumber(10);
        return tokenContract.transfer(tokenContract.address, value, {from:accounts[7]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// transfer from normal account to another normal account
    it("transfer token successfullly between user after crowd sale", function() {
        var value = new BigNumber(60);
        return tokenContract.transfer(accounts[8], value, {from:accounts[7]}).then(function(){
            return tokenContract.balanceOf(accounts[7]);
        }).then(function(result){
            assert.equal(result.valueOf(), new BigNumber(90).valueOf(), "balance of From Account is incorrect");
            return tokenContract.balanceOf(accounts[8]);
        }).then(function(result){
            assert.equal(result.valueOf(), new BigNumber(60).valueOf(), "balance of To Account is incorrect");
        });
    });

    /// allow to approve more than user's balance
    it("allow to approve more than balance", function() {
        var value = new BigNumber(150);
        return tokenContract.approve(accounts[9], value, {from:accounts[8]}).then(function(){
            return tokenContract.allowance(accounts[8],accounts[9]);
        }).then(function(result){
            assert.equal(result.valueOf(), value.valueOf(), "failed to approve more than balance");
        });
    });

    /// failed to on behalf of user to transfer more than balance
    it("transferfrom more than balance", function() {
        var value = new BigNumber(140);
        return tokenContract.transferFrom(accounts[8], accounts[7], value, {from:accounts[9]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){
            assert( Helpers.throwErrorMessage(error), "expected throw got " + error);
        });
    });

    // failed to transfer From normal account to address 0
    it(" failed transferfrom to address 0", function() {
        var value = new BigNumber(10);
        return tokenContract.transferFrom(accounts[8], "0x0000000000000000000000000000000000000000", value, {from:accounts[9]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){

            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// failed to on behalf of user to transfer to token smart contract
    it("failed transferfrom to token contract", function() {
        var value = new BigNumber(10);
        return tokenContract.transferFrom(accounts[8], tokenContract.address, value, {from:accounts[9]}).then(function(){
            assert.fail("transfer should fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// on behalf of one account, to transfer token to other user
    it("transferfrom", function() {
        var value = new BigNumber(10);
        return tokenContract.transferFrom(accounts[8], accounts[6], value, {from:accounts[9]}).then(function(){
            // check balance was changed
            return tokenContract.balanceOf(accounts[6]);
        }).then(function(result){
            assert.equal(result.valueOf(), value.valueOf(), "receiver didn't got token");
            return tokenContract.balanceOf(accounts[8]);
        }).then(function(result){
            assert.equal(result.valueOf(), (new BigNumber(50)).valueOf(), "balance of sender didn't change correct");

            // check allwance was changed
            return tokenContract.allowance(accounts[8],accounts[9]);
        }).then(function(result){
            assert.equal(result.valueOf(), (new BigNumber(140)).valueOf(), "allowance of user 9 from sender didn't change");
        });
    });



    it("deploy another token and send it to token contract", function() {
        tokenOwner = accounts[0];
        tokenAdmin = accounts[1];

        var currentTime = web3.eth.getBlock('latest').timestamp;

        saleStartTime = currentTime + 120;
        saleEndTime = saleStartTime + 288000;

        return Token.new(totalSupply, saleStartTime,saleEndTime, lockedDay, tokenAdmin, {from: tokenOwner}).then(function(result){
            tokenContract = result;

            // check total supply
            return tokenContract.totalSupply();
        }).then(function(result){
            assert.equal(result.valueOf(), totalSupply.valueOf(), "unexpected total supply");

            // check that owner gets all supply
            return tokenContract.balanceOf(tokenOwner);
        }).then(function(result){
            assert.equal(result.valueOf(), totalSupply.valueOf(), "unexpected owner balance");
        });
    });



    it("mine one block to get current time", function() {
        return Helpers.sendPromise( 'evm_mine', [] );
    });

    /// token contract receive other tokens except Dotalk Token
    it("deploy a new ERC20 token and transfer it to Dotalk Token Smart Contract", function() {
        var currentTime = web3.eth.getBlock('latest').timestamp;

        saleStartTime = currentTime + 120;
        saleEndTime = saleStartTime + 288000;

        return Token.new(totalSupply, saleStartTime,saleEndTime, lockedDay, tokenAdmin, {from: accounts[5]}).then(function(result){
            erc20TokenContract = result;
            return erc20TokenContract.transfer(tokenContract.address,new BigNumber(100),{from:accounts[5]});
        }).then(function(){
            // check balance
            return erc20TokenContract.balanceOf(tokenContract.address);
        }).then(function(result){
            assert.equal(result.valueOf(),(new BigNumber(100)).valueOf(), "Dotalkt token is failed to receive other ERC20 tokens" );
        });
    });

    /// failed to drain token from token contract by non-admin account
    it("non-admin account failed to drain a token from the contract", function() {
        return tokenContract.emergencyERC20Drain( erc20TokenContract.address, new BigNumber(100), {from:tokenOwner}).then(function(result){
        }).then(function(){
            assert.fail("burn should fail");
        }).catch(function(error){
            assert.isAbove(error.message.search('revert'), -1, 'Revert opcode error must be returned');
        });
    });

    /// admin account drain token from token SmartContract
    it("admin account drain token from token address", function() {
        return tokenContract.emergencyERC20Drain( erc20TokenContract.address, new BigNumber(100), {from:tokenAdmin}).then(function(result){
        }).then(function(){
            return erc20TokenContract.balanceOf(tokenAdmin);
        }).then(function(result){
            assert.equal(result.valueOf(), (new BigNumber(100)).valueOf(), "Admin didn't get token successfully");
        });
    });

});



