// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {IEAS, Attestation, AttestationRequest, AttestationRequestData} from "eas-contracts/IEAS.sol";
import {NO_EXPIRATION_TIME, EMPTY_UID} from "eas-contracts/Common.sol";
import "eas-contracts/ISchemaRegistry.sol";
import {SchemaResolver} from "eas-contracts/resolver/SchemaResolver.sol";

contract EASResolver is SchemaResolver {
    struct BaseState {
        string name;
        string[] states;
        string[] transitions;
        string initialState;
    }

    struct ParsedState {
        uint256[] states;
        string[] stateString;
        mapping(uint => uint[]) transitions;
        uint256 initialState;
        bytes32 uid;
    }

    BaseState public baseState;
    ParsedState public parsedState;
    int public lastState;
    address public validAttester;

    IEAS eas = IEAS(0xC2679fBD37d54388Ce493F1DB75320D236e1815e);

    constructor() SchemaResolver(eas) {}

    function parseState(BaseState memory state) public {
        parsedState.states = new uint256[](state.states.length);

        parsedState.stateString = state.states;

        parsedState.initialState = 999;

        for (uint256 i = 0; i < state.states.length; i++) {
            parsedState.states[i] = i;

            if (
                keccak256(bytes(state.initialState)) ==
                keccak256(bytes(state.states[i]))
            ) {
                parsedState.initialState = i;
            }
        }

        for (uint256 i = 0; i < state.transitions.length; i++) {
            (uint256 a, uint256 b) = parseTransition(
                state.transitions[i],
                parsedState.stateString
            );

            uint[] storage temp = parsedState.transitions[a];
            temp.push(b);
        }

        require(parsedState.initialState != 999, "Invalid initial state");
    }

    function onAttest(
        Attestation calldata attestation,
        uint256 value
    ) internal override returns (bool) {
        bytes32 uid = attestation.uid;
        bytes32 schema = attestation.schema;
        // uint64 time = attestation.time;
        // uint64 expirationTime = attestation.expirationTime;
        // uint64 revocationTime = attestation.revocationTime;
        bytes32 refUID = attestation.refUID;
        // address recipient = attestation.recipient;
        address attester = attestation.attester;
        // bool revocable = attestation.revocable;
        // bytes memory attestData = attestation.data;

        SchemaRecord memory record = eas.getSchemaRegistry().getSchema(schema);

        string
            memory genesisFsm = "string name,string[] states,string[] validTransitions,string initialState";
        string memory propagateFsm = "string state,string data,bool final";

        string memory receivedSchema = record.schema;

        if (keccak256(bytes(receivedSchema)) == keccak256(bytes(genesisFsm))) {
            (
                string memory name,
                string[] memory states,
                string[] memory transitions,
                string memory initialState
            ) = abi.decode(
                    attestation.data,
                    (string, string[], string[], string)
                );

            baseState = BaseState({
                name: name,
                states: states,
                transitions: transitions,
                initialState: initialState
            });

            parseState(baseState);
            parsedState.uid = uid;
            return true;
        } else if (
            keccak256(bytes(propagateFsm)) == keccak256(bytes(receivedSchema))
        ) {
            if (validAttester == address(0)) {
                validAttester = attester;
            } else {
                require(validAttester == attester, "Invalid attester");
            }

            (string memory state, string memory data, bool finalState) = abi
                .decode(attestation.data, (string, string, bool));

            int parsedStateNum = -1;
            for (uint i = 0; i < parsedState.stateString.length; i++) {
                if (
                    keccak256(bytes(parsedState.stateString[i])) ==
                    keccak256(bytes(state))
                ) {
                    parsedStateNum = int(i);
                }
            }
            require(parsedStateNum != -1, "Invalid state");

            if (refUID == parsedState.uid) {
                require(
                    keccak256(bytes(state)) ==
                        keccak256(bytes(baseState.initialState)),
                    "Invalid initial state"
                );
                lastState = int(parsedStateNum);
            } else {
                bool stateCheck = false;
                uint[] memory possibleStates = parsedState.transitions[
                    uint(lastState)
                ];

                for (uint i = 0; i < possibleStates.length; i++) {
                    if (possibleStates[i] == uint(parsedStateNum)) {
                        lastState = int(parsedStateNum);
                        stateCheck = true;
                        break;
                    }
                }

                require(stateCheck, "could not find next state");
            }

            return true;
        }
        // revert
    }

    function onRevoke(
        Attestation calldata attestation,
        uint256 value
    ) internal override returns (bool) {
        return true;
    }

    function parseTransition(
        string memory transitionStr,
        string[] memory stateStrings
    ) public view returns (uint, uint) {
        bytes memory transition = bytes(transitionStr);
        string memory x;
        string memory y;
        bool check;
        for (uint i = 0; i < transition.length; i++) {
            if (transition[i] == 0x3e) {
                check = true;
                continue;
            }
            if (!check) x = string(abi.encodePacked(x, transition[i]));
            else y = string(abi.encodePacked(y, transition[i]));
        }

        int a = -1;
        int b = -1;

        for (uint i = 0; i < stateStrings.length; i++) {
            if (a < 0) {
                if (
                    keccak256(abi.encodePacked(stateStrings[i])) ==
                    keccak256(abi.encodePacked(x))
                ) {
                    a = int(i);
                }
            }

            if (b < 0) {
                if (
                    keccak256(abi.encodePacked(stateStrings[i])) ==
                    keccak256(abi.encodePacked(y))
                ) {
                    b = int(i);
                }
            }
        }

        require(a != b, "Invalid state transition");

        require(a != -1, "Invalid a state");
        require(b != -1, "Invalid a state");

        return (uint(a), uint(b));
    }
}
