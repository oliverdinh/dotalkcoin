pragma solidity ^0.4.0;

import './zeppelin/ownership/Ownable.sol';

contract DotalkWhitelist is Ownable {
    // cap is in wei. The value of 1 is just a stub.
    // after kyc registration ends, we change it to the actual value with setUsersCap
    /// Currenty we set the cap to 1 ETH and the owner is able to change it in the future by call function: setUsersCap
    uint public communityusersCap = 1067*(10**15);
    mapping(address=>uint) public addressCap;

    function DotalkWhitelist() public {}

    event ListAddress( address _user, uint _cap, uint _time );

    // Owner can remove by setting cap = 0.
    // Onwer can also change it at any time
    function listAddress( address _user, uint _cap ) public onlyOwner {
        addressCap[_user] = _cap;
        ListAddress( _user, _cap, now );
    }

    // an optimization in case of network congestion
    function listAddresses( address[] _users, uint[] _cap ) public onlyOwner {
        require(_users.length == _cap.length );
        for( uint i = 0 ; i < _users.length ; i++ ) {
            listAddress( _users[i], _cap[i] );
        }
    }

    function setUsersCap( uint _cap ) public  onlyOwner {
        communityusersCap = _cap;
    }

    function getCap( address _user ) public constant returns(uint) {
        uint cap = addressCap[_user];
        if( cap == 1 ) return communityusersCap;
        else return cap;
    }

    function destroy() public onlyOwner {
        selfdestruct(owner);
    }
}

