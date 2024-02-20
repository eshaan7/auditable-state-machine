import { SchemaRegistry } from "@ethereum-attestation-service/eas-sdk";
import {
  SCHEMA_REGISTRY_CONTRACT_ADDRESS,
  SCHEMA_RESOLVER_ADDRESS,
  STATE_MACHINE_SCHEMA,
  STATE_TRANSITION_SCHEMA,
} from "./constants.js";
import { getSigner } from "./utils.js";

async function getSchemaRegistry() {
  const signer = getSigner();
  const schemaRegistry = new SchemaRegistry(SCHEMA_REGISTRY_CONTRACT_ADDRESS);
  await schemaRegistry.connect(signer);
  return schemaRegistry;
}

async function registerStateMachineSchema() {
  const schemaRegistry = await getSchemaRegistry();
  const transaction = await schemaRegistry.register({
    schema: STATE_MACHINE_SCHEMA,
    resolverAddress: SCHEMA_RESOLVER_ADDRESS,
    revocable: false,
  });
  const attestationId = await transaction.wait();
  console.log("registerStateMachineSchema: ", attestationId);
}

async function registerStateTransitionSchema() {
  const schemaRegistry = await getSchemaRegistry();
  const transaction = await schemaRegistry.register({
    schema: STATE_TRANSITION_SCHEMA,
    resolverAddress: SCHEMA_RESOLVER_ADDRESS,
    revocable: false,
  });
  const attestationId = await transaction.wait();
  console.log("registerStateTransitionSchema: ", attestationId);
}

export { registerStateMachineSchema, registerStateTransitionSchema };
