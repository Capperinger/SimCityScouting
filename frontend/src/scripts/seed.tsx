export interface ScoutingSubmission extends Record<string, unknown> {
    name: string;
    eventName: string;
    teamNumber: number;
    matchNumber: number;
    autoFuel: number;
    autoClimbed: boolean;
    autoHoardedFuel: boolean;
    shift1HubActive: boolean;
    shift2HubActive: boolean;
    shift3HubActive: boolean;
    shift4HubActive: boolean;
    transitionCollected: boolean;
    shift1Collected: boolean;
    shift2Collected: boolean;
    shift3Collected: boolean;
    shift4Collected: boolean;
    transitionFuel: number;
    shift1Fuel: number;
    shift2Fuel: number;
    shift3Fuel: number;
    shift4Fuel: number;
    shift1Defense: boolean;
    shift2Defense: boolean;
    shift3Defense: boolean;
    shift4Defense: boolean;
    shift1HoardedFuel: boolean;
    shift2HoardedFuel: boolean;
    shift3HoardedFuel: boolean;
    shift4HoardedFuel: boolean;
    endgameFuel: number;
    endgameClimbLevel: "Didn't climb" | "Level 1" | "Level 2" | "Level 3";
    notes: string;
    robotError: Record<string, boolean>;
    failure: boolean;
}

const events = ["NE District Minuteman Event", "NE District URI Event"];
const robotErrorOptions = [
    "Intake issues",
    "Shooter issues",
    "Stuck on fuel",
    "Climb Failed",
    "Robot unresponsive",
    "Part broke off",
    "Did not participate",
    "Auto stop",
    "E-stop",
    "Robot could not get off after climb",
    "Other",
];
const notes = [
    "Good robot",
    "Good history",
    "Lucky match",
    "Played better than expected",
    "Played worse than expected",
    "Unlucky match",
    "Outlier match",
    "Great drivers",
    "Bad drivers",
    "Aggressive",
    "Passive",
    "Fast robot",
    "Slower robot",
    "Interesting mechanism",
    "Poor history",
];
const climbLevels: ScoutingSubmission["endgameClimbLevel"][] = [
    "Didn't climb",
    "Level 1",
    "Level 2",
    "Level 3",
];

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomBoolean() {
    return Math.random() < 0.5;
}

export default function seedDataBase(
    teamNumber = 9999,
): ScoutingSubmission {
    const robotError = Object.fromEntries(
        robotErrorOptions.map((option) => [option, Math.random() < 0.08]),
    );
    const shift1HubActive = randomBoolean();

    return {
        name: "seed",
        eventName: events[randomInt(0, events.length - 1)],
        teamNumber,
        matchNumber: randomInt(1, 300),
        autoFuel: randomInt(0, 32),
        autoClimbed: randomBoolean(),
        autoHoardedFuel: randomBoolean(),
        shift1HubActive,
        shift2HubActive: !shift1HubActive,
        shift3HubActive: shift1HubActive,
        shift4HubActive: !shift1HubActive,
        transitionCollected: randomBoolean(),
        shift1Collected: randomBoolean(),
        shift2Collected: randomBoolean(),
        shift3Collected: randomBoolean(),
        shift4Collected: randomBoolean(),
        transitionFuel: randomInt(0, 20),
        shift1Fuel: randomInt(0, 47),
        shift2Fuel: randomInt(0, 47),
        shift3Fuel: randomInt(0, 47),
        shift4Fuel: randomInt(0, 47),
        shift1Defense: randomBoolean(),
        shift2Defense: randomBoolean(),
        shift3Defense: randomBoolean(),
        shift4Defense: randomBoolean(),
        shift1HoardedFuel: randomBoolean(),
        shift2HoardedFuel: randomBoolean(),
        shift3HoardedFuel: randomBoolean(),
        shift4HoardedFuel: randomBoolean(),
        endgameFuel: randomInt(0, 20),
        endgameClimbLevel: climbLevels[randomInt(0, climbLevels.length - 1)],
        notes: notes[randomInt(0, notes.length - 1)],
        robotError,
        failure: Object.values(robotError).some(Boolean),
    };
}
