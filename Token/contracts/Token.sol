//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Token is ERC20, Ownable {
    constructor(string memory _Name, string memory _Symbol)
        ERC20(_Name, _Symbol)
    {
        _mint(msg.sender, 10000000000000000000000);
    }

    function mint(address _recipient, uint256 _tokenAmount) public onlyOwner {
        _mint(_recipient, _tokenAmount);
    }

    function burn(address _tokenHolder, uint256 _tokenAmount) public onlyOwner {
        _burn(_tokenHolder, _tokenAmount);
    }
}
