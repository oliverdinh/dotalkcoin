pragma solidity ^0.4.0;

import './zeppelin/ownership/Ownable.sol';
import './DotalkWhitelist.sol';
import './zeppelin/math/SafeMath.sol';

contract DotalkApprover {
    DotalkWhitelist public list;
    mapping(address=>uint)    public participated;

    uint                      public saleStartTime;
    uint                      public firstRoundTime;
    uint                      public saleEndTime;
    uint                      public xtime = 5;/// multiply the cap

    using SafeMath for uint;


    function DotalkApprover( DotalkWhitelist _whitelistContract,
    uint                      _saleStartTime,
    uint                      _firstRoundTime,
    uint                      _saleEndTime ) public {
        list = _whitelistContract;
        saleStartTime = _saleStartTime;
        firstRoundTime = _firstRoundTime;
        saleEndTime = _saleEndTime;

        require( list != DotalkWhitelist(0x0) );
        require( saleStartTime < firstRoundTime );
        require(  firstRoundTime < saleEndTime );
    }

    // this is a seperate function so user could query it before crowdsale starts
    function contributorCap( address contributor ) public constant returns(uint) {
        uint  cap= list.getCap( contributor );
        uint higherCap = cap;

        if ( now > firstRoundTime ) {
            higherCap = cap.mul(xtime);
        }
        return higherCap;
    }


    function eligible( address contributor, uint amountInWei ) public constant returns(uint) {
        if( now < saleStartTime ) return 0;
        if( now >= saleEndTime ) return 0;

        uint cap = list.getCap( contributor );

        if( cap == 0 ) return 0;

        uint higherCap = cap;
        if ( now > firstRoundTime ) {
            higherCap = cap.mul(xtime);
        }

        uint remainedCap = higherCap.sub(participated[ contributor ]);
        if( remainedCap > amountInWei ) return amountInWei;
              else return remainedCap;

    }

    function eligibleTestAndIncrement( address contributor, uint amountInWei ) internal returns(uint) {
        uint result = eligible( contributor, amountInWei );
        if ( result > 0) {
            participated[contributor] = participated[contributor].add( result );
        }
        return result;
    }


    function contributedCap(address _contributor) public constant returns(uint) {
        if (participated[_contributor] == 0 ) return 0;

        return participated[_contributor];
    }

     function contributedInternalCap(address _contributor) view internal returns(uint) {
         if (participated[_contributor] == 0 ) return 0;

        return participated[_contributor];
    }


    function saleEnded() public constant returns(bool) {
        return now > saleEndTime;
    }

    function saleStarted() public constant returns(bool) {
        return now >= saleStartTime;
    }
}
