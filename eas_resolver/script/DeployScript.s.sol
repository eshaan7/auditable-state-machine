// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console} from "forge-std/Script.sol";
import {EASResolver} from "src/EASResolver.sol";

contract DeployScript is Script {
    function setUp() public {}

    function run() public {
        vm.broadcast();

        EASResolver easResolver = new EASResolver();

        console.log("EASResolver address: ", address(easResolver));
    }
}
