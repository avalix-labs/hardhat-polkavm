// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Counter {
  uint256 public count;

  event Increment(uint256 by);

  function inc() public {
    count += 1;
    emit Increment(1);
  }

  function incBy(uint256 by) public {
    require(by > 0, "incBy: increment should be positive");
    count += by;
    emit Increment(by);
  }
}
