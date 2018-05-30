pragma solidity ^0.4.0;

import './zeppelin/token/StandardToken.sol';
import './zeppelin/ownership/Ownable.sol';

contract DotalkTokenSmartContract is StandardToken, Ownable {
    string  public  constant name = "Dotalk Token";
    string  public  constant symbol = "Dotalk";
    uint8    public  constant decimals = 18;

    uint    public  saleStartTime;
    uint    public  saleEndTime;
    uint    public lockedDays = 0;

    address public  tokenSaleContract;
    address public adminAddress;

    modifier onlyWhenTransferEnabled() {
        if( now <= (saleEndTime + lockedDays * 1 days) && now >= saleStartTime ) {
            require( msg.sender == tokenSaleContract || msg.sender == adminAddress );
        }
        _;
    }

    modifier validDestination( address to ) {
        require(to != address(0x0));
        require(to != address(this) );
        _;
    }

    function DotalkTokenSmartContract( uint tokenTotalAmount, uint startTime, uint endTime, uint lockedTime, address admin ) public {
        // Mint all tokens. Then disable minting forever.
        balances[msg.sender] = tokenTotalAmount;
        totalSupply = tokenTotalAmount;
        Transfer(address(0x0), msg.sender, tokenTotalAmount);

        saleStartTime = startTime;
        saleEndTime = endTime;
        lockedDays = lockedTime;

        tokenSaleContract = msg.sender;
        adminAddress = admin;
        transferOwnership(admin); // admin could drain tokens that were sent here by mistake
    }

    function transfer(address _to, uint _value)
    public
    onlyWhenTransferEnabled
    validDestination(_to)
    returns (bool) {
        return super.transfer(_to, _value);
    }

    function transferFrom(address _from, address _to, uint _value)
    public
    onlyWhenTransferEnabled
    validDestination(_to)
    returns (bool) {
        return super.transferFrom(_from, _to, _value);
    }

    event Burn(address indexed _burner, uint _value);

    function burn(uint _value) public onlyWhenTransferEnabled
    returns (bool){
        balances[msg.sender] = balances[msg.sender].sub(_value);
        totalSupply = totalSupply.sub(_value);
        Burn(msg.sender, _value);
        Transfer(msg.sender, address(0x0), _value);
        return true;
    }


    function emergencyERC20Drain( ERC20 token, uint amount ) public onlyOwner {
        token.transfer( owner, amount );
    }
}
