import {
  createStateMachine,
  initStateMachine,
  transitionState,
} from "./fsm.js";

const STATES = {
  PATROL: "patrol",
  ATTACK: "attack",
  FLEE: "flee",
};

async function main(player1, player2) {
  const gameUid = await createStateMachine(
    "DBZ Character",
    [STATES.PATROL, STATES.ATTACK, STATES.FLEE],
    [
      `${STATES.PATROL}>${STATES.ATTACK}`,
      `${STATES.ATTACK}>${STATES.FLEE}`,
      `${STATES.FLEE}>${STATES.PATROL}`,
    ],
    STATES.PATROL
  );
  console.log("Game: ", gameUid);
  const gokuStateMachineUid = await initStateMachine(
    gameUid,
    STATES.PATROL,
    "goku is patrolling",
    player1
  );
  console.log("Goku: ", gokuStateMachineUid);
  const vegetaStateMachineUid = await initStateMachine(
    gameUid,
    STATES.PATROL,
    "vegeta is patrolling",
    player1
  );
  console.log("Vegeta: ", vegetaStateMachineUid);
  const gokuStateUid = await transitionState(
    gokuStateMachineUid,
    STATES.ATTACK,
    "Goku attacked Vegeta",
    false,
    player1
  );
  console.log("Goku attacked Vegeta: ", gokuStateUid);
  const vegetaStateUid = await transitionState(
    vegetaStateMachineUid,
    STATES.ATTACK,
    "Vegeta attacked Goku",
    false,
    player2
  );
  console.log("Vegeta attacked Goku: ", vegetaStateUid);
  const gokuStateUid2 = await transitionState(
    gokuStateUid,
    STATES.FLEE,
    "Goku fleed",
    true,
    player1
  );
  console.log("Goku fleed: ", gokuStateUid2);
  const vegetaStateUid2 = await transitionState(
    vegetaStateUid,
    STATES.FLEE,
    "Vegeta fleed",
    true,
    player2
  );
  console.log("Vegeta fleed: ", vegetaStateUid2);
}

main();
