import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { getSigner } from "./utils.js";
import {
  EAS_CONTRACT_ADDRESS,
  STATE_MACHINE_SCHEMA,
  STATE_MACHINE_SCHEMA_UID,
  STATE_TRANSITION_SCHEMA,
  STATE_TRANSITION_SCHEMA_UID,
} from "./constants.js";

async function getEAS() {
  const eas = new EAS(EAS_CONTRACT_ADDRESS);
  const signer = getSigner();
  await eas.connect(signer);
  return eas;
}

// createStateMachine("Game Character", ["patrol", "attack", "flee"], ["patrol>attack", "attack>flee"], "patrol");
async function createStateMachine(name, states, validTransitions, intialState) {
  const eas = await getEAS();
  const schemaEncoder = new SchemaEncoder(STATE_MACHINE_SCHEMA);
  const encodedData = schemaEncoder.encodeData([
    { name: "name", value: name, type: "string" },
    { name: "states", value: states, type: "string[]" },
    { name: "validTransitions", value: validTransitions, type: "string[]" }, // todo: fix
    { name: "initialState", value: intialState, type: "string" },
  ]);

  const tx = await eas.attest({
    schema: STATE_MACHINE_SCHEMA_UID,
    data: {
      recipient: "0x0000000000000000000000000000000000000000",
      expirationTime: 0, // no expiry
      revocable: false, // not revocable
      data: encodedData,
    },
  });
  const newAttestationUID = await tx.wait();
  return newAttestationUID;
}

// initStateMachine("0x", "patrol", "goku is patrolling", "0x912....");
async function initStateMachine(
  machineAttestationUid,
  state,
  data,
  recipient = "0x0000000000000000000000000000000000000000"
) {
  const eas = await getEAS();
  const schemaEncoder = new SchemaEncoder(STATE_TRANSITION_SCHEMA);
  const encodedData = schemaEncoder.encodeData([
    { name: "state", value: state, type: "string" },
    { name: "data", value: data, type: "string" },
    { name: "final", value: false, type: "bool" },
  ]);
  const tx = await eas.attest({
    schema: STATE_TRANSITION_SCHEMA_UID,
    data: {
      recipient: recipient,
      expirationTime: 0, // no expiry
      revocable: false, // not revocable
      data: encodedData,
      refUID: machineAttestationUid,
    },
  });
  const newAttestationUID = await tx.wait();
  return newAttestationUID;
}

// transitionState("attack", "goku attacked vegeta", false, "0x912....");
async function transitionState(
  prevStateAttestationUid,
  state,
  data,
  final,
  recipient = "0x0000000000000000000000000000000000000000"
) {
  const eas = await getEAS();
  const schemaEncoder = new SchemaEncoder(STATE_TRANSITION_SCHEMA);
  const encodedData = schemaEncoder.encodeData([
    { name: "state", value: state, type: "string" },
    { name: "data", value: data, type: "string" },
    { name: "final", value: final, type: "bool" },
  ]);
  const tx = await eas.attest({
    schema: STATE_TRANSITION_SCHEMA_UID,
    data: {
      recipient: recipient,
      expirationTime: 0, // no expiry
      revocable: false, // not revocable
      data: encodedData,
      refUID: prevStateAttestationUid,
    },
  });
  const newAttestationUID = await tx.wait();
  return newAttestationUID;
}

export { createStateMachine, initStateMachine, transitionState };
