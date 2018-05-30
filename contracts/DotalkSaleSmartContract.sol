pragma solidity ^0.4.0;

import './DotalkTokenSmartContract.sol';
import './DotalkApprover.sol';
import './DotalkWhitelist.sol';

contract DotalkSaleSmartContract is DotalkApprover{
    address             public admin;
    address             public multiSigWallet; // can be a single wallet
    DotalkTokenSmartContract public token;
    uint                public raisedWei;
    bool                public haltSale;
    uint                constant toWei = (10**18);
    uint                public minCap = toWei.div(2);

    mapping(bytes32=>uint) public proxyPurchases;

    function DotalkSaleSmartContract( address _admin,
    address _multiSigWallet,
    DotalkWhitelist _whiteListContract,
    uint _totalTokenSupply,
    uint _companyTokenSupply,
    uint _saleStartTime,
    uint _firstRoundTime,
    uint _saleEndTime,
    uint _lockedDays)

    public

    DotalkApprover( _whiteListContract,
    _saleStartTime,
    _firstRoundTime,
    _saleEndTime )
    {
        admin = _admin;
        multiSigWallet = _multiSigWallet;

        token = new DotalkTokenSmartContract( _totalTokenSupply,
        _saleStartTime,
        _saleEndTime,
        _lockedDays, ///change depending on each project
        _admin );

        // transfer preminted tokens to company wallet
        token.transfer( multiSigWallet, _companyTokenSupply );
    }

    function setHaltSale( bool halt ) public {
        require( msg.sender == admin );
        haltSale = halt;
    }

    function() public payable {
        buy( msg.sender );
    }

    event ProxyBuy( bytes32 indexed _proxy, address _recipient, uint _amountInWei );
    function proxyBuy( bytes32 proxy, address recipient ) public payable returns(uint){
        uint amount = buy( recipient );
        proxyPurchases[proxy] = proxyPurchases[proxy].add(amount);
        ProxyBuy( proxy, recipient, amount );


        return amount;
    }

    event Buy( address _buyer, uint _tokens, uint _payedWei );
    function buy( address recipient ) public payable returns(uint){
        require( tx.gasprice <= 50000000000 wei );

        require( ! haltSale );
        require( saleStarted() );
        require( ! saleEnded() );

        // check min buy at least 0.5 ETH;
        uint weiContributedCap = contributedInternalCap(recipient);

        if (weiContributedCap == 0 ) require( msg.value >= minCap);



        uint weiPayment = eligibleTestAndIncrement( recipient, msg.value );

        require( weiPayment > 0 );


        // send to msg.sender, not to recipient
        if( msg.value > weiPayment ) {
            msg.sender.transfer( msg.value.sub( weiPayment ) );
        }

        // send payment to wallet
        sendETHToMultiSig( weiPayment );
        raisedWei = raisedWei.add( weiPayment );
        uint recievedTokens = weiPayment.mul( 11750 );

        assert( token.transfer( recipient, recievedTokens ) );


        Buy( recipient, recievedTokens, weiPayment );

        return weiPayment;
    }

    function sendETHToMultiSig( uint value ) internal {
        multiSigWallet.transfer( value );
    }

    event FinalizeSale();
    // function is callable by everyone
    function finalizeSale() public {
        require( saleEnded() );
        require( msg.sender == admin );

        // burn remaining tokens
        token.burn(token.balanceOf(this));

        FinalizeSale();
    }

    // ETH balance is always expected to be 0.
    // but in case something went wrong, we use this function to extract the eth.
    function emergencyDrain(ERC20 anyToken) public returns(bool){
        require( msg.sender == admin );
        require( saleEnded() );

        if( this.balance > 0 ) {
            sendETHToMultiSig( this.balance );
        }

        if( anyToken != address(0x0) ) {
            assert( anyToken.transfer(multiSigWallet, anyToken.balanceOf(this)) );
        }

        return true;
    }

    // just to check that funds goes to the right place
    // tokens are not given in return
    /*function debugBuy() public payable {
        require( msg.value == 123 );
        sendETHToMultiSig( msg.value );
    }*/
}