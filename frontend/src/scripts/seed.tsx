const emptyList =
    '{"eventName" : "", "teamNumber": 0, "matchNumber": 0, "name": "seed", "scoutingTeam": 0, "autoFuel": 0, "autoClimbed": false, "autoHoardedFuel": false, "transitionFuel": 0, "shift1HubActive": false, "shift1Fuel": 0, "shift1Defense": false, "shift1HoardedFuel": false, "shift2HubActive": false, "shift2Fuel": 0, "shift2Defense": false, "shift2HoardedFuel": false, "shift3HubActive": false, "shift3Fuel": 0, "shift3Defense": false, "shift3HoardedFuel": false, "shift4HubActive": false, "shift4Fuel": 0, "shift4Defense": false, "shift4HoardedFuel": false, "endgameFuel": 0, "endgameClimbLevel": "Level 1", "crossedBump": false, "underTrench": false, "robotError": [], "notes": ""}';

// Setup values
let scoutingTeam = 0;
let eventName = "";
let teamNumber = 0;
let matchNumber = 0;

// Auto values
let autoFuel = 0;
let autoClimbed = false;
let autoHoardedFuel = false;

// Teleop values
let transitionFuel = 0;
let shift1HubActive = false;
let shift2HubActive = false;
let shift3HubActive = false;
let shift4HubActive = false;

let shift1Fuel = 0;
let shift2Fuel = 0;
let shift3Fuel = 0;
let shift4Fuel = 0;

let shift1Defense = false;
let shift2Defense = false;
let shift3Defense = false;
let shift4Defense = false;

let shift1HoardedFuel = false;
let shift2HoardedFuel = false;
let shift3HoardedFuel = false;
let shift4HoardedFuel = false;

// Endgame values
let endgameFuel = 0;
let endgameClimbLevel = "0";

// finale  values
let crossedBump = false;
let underTrench = false;
const robotErrorCheck: Record<string, boolean> = {
    "Intake issues": false,
    "Climb Failed": false,
    "Robot unresponsive": false,
    "Robot part fell off": false,
    "Did not participate": false,
    "Auto stop": false,
    "Robot could not get off after climb": false,
    Other: false,
};
let notes = "";

const robotErrorList: string[] = [
    "Intake issues",
    "Climb Failed",
    "Robot unresponsive",
    "Robot part fell off",
    "Auto stop",
    "Robot did not get off after climb",
    "other",
];

const noteList: string[] = [
    "Good robot",
    "Good history",
    "Lucky match",
    "Played better than expected",
    "Played worse than expected",
    "Unlucky match",
    "Outlier match",
    "Great drivers",
    "Bad drivers",
    "Agressive",
    "Passive",
    "Fast robot",
    "Slower robot",
    "Interesting mechanism",
    "Poor history",
    "Thank you sam",
];

/**
 * Returns an example scouting as a JSON.
 */
export default function seedDataBase() {
    function getRandomInt(min: number, max: number): number {
        const minCeiled = Math.ceil(min);
        const maxFloored = Math.floor(max);
        // The maximum is inclusive and the minimum is inclusive
        return (
            Math.floor(Math.random() * (maxFloored - minCeiled + 1)) + minCeiled
        );
    }

    const baseJsonList = JSON.parse(emptyList);

    // EventName
    if (getRandomInt(0, 1) == 0) {
        eventName = "NE District Minuteman Event";
    } else {
        eventName = "Ne District URI Event";
    }

    // Scouting Team
    scoutingTeam = getRandomInt(1, 9998);

    // teamNumber
    teamNumber = 9999;

    // matchNumber
    matchNumber = getRandomInt(1, 300);

    // autoFuel
    autoFuel = getRandomInt(8, 32);

    // autoClimbLevel
    if (getRandomInt(0, 1) == 0) {
        autoClimbed = false;
    } else {
        autoClimbed = true;
    }

    // autoHoardedFuel
    if (getRandomInt(0, 7) == 0) {
        autoHoardedFuel = true;
    } else {
        autoHoardedFuel = false;
    }

    // transitionFuel
    transitionFuel = getRandomInt(4, 16);

    // shift1HubActive
    if (autoFuel > 20) {
        shift1HubActive = false;
    } else {
        shift1HubActive = true;
    }

    // shift1Fuel & shift1Defense
    if (!shift1HubActive) {
        shift1Fuel = 0;
        if (getRandomInt(0, 1) == 0) {
            shift1Defense = false;
        } else {
            shift1Defense = true;
        }
    } else {
        shift1Fuel = getRandomInt(15, 36);
        shift1Defense = false;
    }

    // shift1HoardedFuel
    if (getRandomInt(0, 4) == 0) {
        shift1HoardedFuel = true;
    } else {
        shift1HoardedFuel = false;
    }

    // shift2HubActive
    if (shift1HubActive) {
        shift2HubActive = false;
    } else {
        shift2HubActive = true;
    }

    // shift2Fuel & shift2Defense
    if (!shift2HubActive) {
        shift2Fuel = 0;
        if (getRandomInt(0, 1) == 0) {
            shift2Defense = false;
        } else {
            shift2Defense = true;
        }
    } else {
        if (shift1Defense == true) {
            shift2Fuel = getRandomInt(21, 47);
        } else {
            shift2Fuel = getRandomInt(15, 36);
        }
        shift2Defense = false;
    }

    // shift2HoardedFuel
    if (getRandomInt(0, 4) == 0) {
        shift2HoardedFuel = true;
    } else {
        shift2HoardedFuel = false;
    }

    // shift3HubActive
    if (shift1HubActive) {
        shift3HubActive = true;
    } else {
        shift3HubActive = false;
    }

    // shift3Fuel & shift3Defense
    if (!shift3HubActive) {
        shift3Fuel = 0;
        if (getRandomInt(0, 1) == 0) {
            shift3Defense = false;
        } else {
            shift3Defense = true;
        }
    } else {
        if (shift2Defense == true) {
            shift3Fuel = getRandomInt(21, 47);
        } else {
            shift3Fuel = getRandomInt(15, 36);
        }

        shift3Defense = false;
    }

    // shift3HoardedFuel
    if (getRandomInt(0, 4) == 0) {
        shift3HoardedFuel = true;
    } else {
        shift3HoardedFuel = false;
    }

    // shift4HubActive
    if (shift1HubActive) {
        shift4HubActive = false;
    } else {
        shift4HubActive = true;
    }

    // shift4Fuel & shift4Defense
    if (!shift4HubActive) {
        shift4Fuel = 0;
        if (getRandomInt(0, 1) == 0) {
            shift4Defense = false;
        } else {
            shift4Defense = true;
        }
    } else {
        if (shift3Defense == true) {
            shift4Fuel = getRandomInt(21, 47);
        } else {
            shift4Fuel = getRandomInt(15, 36);
        }

        shift4Defense = false;
    }

    // shift4HoardedFuel
    if (getRandomInt(0, 4) == 0) {
        shift4HoardedFuel = true;
    } else {
        shift4HoardedFuel = false;
    }

    // endgameFuel
    endgameFuel = getRandomInt(8, 26);

    // endgameClimbLevel
    endgameClimbLevel = getRandomInt(0, 3).toString();

    if (endgameClimbLevel == "0") {
        endgameClimbLevel = "Didn't climb";
    } else {
        endgameClimbLevel = "Level".concat(" ", endgameClimbLevel);
    }

    // crossedBump
    if (getRandomInt(0, 1) == 0) {
        crossedBump = false;
    } else {
        crossedBump = true;
    }

    // underTrench
    if (getRandomInt(0, 1) == 0) {
        underTrench = false;

        if (!crossedBump) {
            underTrench = true;
        }
    } else {
        underTrench = true;
    }

    // robotErrorCheck
    const selectedErrors: number[] = [getRandomInt(0, 3), getRandomInt(3, 6)];

    for (let i = 0; i < 3; i++) {
        robotErrorCheck[robotErrorList[selectedErrors[i]]] = true;
    }

    // notes
    notes = noteList[getRandomInt(0, 15)];

    // setup
    baseJsonList["eventName"] = eventName;
    baseJsonList["teamNumber"] = teamNumber;
    baseJsonList["matchNumber"] = matchNumber;
    baseJsonList["scoutingTeam"] = scoutingTeam;

    // auto
    baseJsonList["autoFuel"] = autoFuel;
    baseJsonList["autoClimbed"] = autoClimbed;
    baseJsonList["autoHoardedFuel"] = autoHoardedFuel;

    // teleop
    baseJsonList["transitionFuel"] = transitionFuel;

    baseJsonList["shift1HubActive"] = shift1HubActive;
    baseJsonList["shift2HubActive"] = shift2HubActive;
    baseJsonList["shift3HubActive"] = shift3HubActive;
    baseJsonList["shift4HubActive"] = shift4HubActive;

    baseJsonList["shift1Fuel"] = shift1Fuel;
    baseJsonList["shift2Fuel"] = shift2Fuel;
    baseJsonList["shift3Fuel"] = shift3Fuel;
    baseJsonList["shift4Fuel"] = shift4Fuel;

    baseJsonList["shift1Defense"] = shift1Defense;
    baseJsonList["shift2Defense"] = shift2Defense;
    baseJsonList["shift3Defense"] = shift3Defense;
    baseJsonList["shift4Defense"] = shift4Defense;

    baseJsonList["shift1HoardedFuel"] = shift1HoardedFuel;
    baseJsonList["shift2HoardedFuel"] = shift2HoardedFuel;
    baseJsonList["shift3HoardedFuel"] = shift3HoardedFuel;
    baseJsonList["shift4HoardedFuel"] = shift4HoardedFuel;

    // endgame
    baseJsonList["endgameFuel"] = endgameFuel;
    baseJsonList["endgameClimbLevel"] = endgameClimbLevel;

    // finale
    baseJsonList["crossedBump"] = crossedBump;
    baseJsonList["underTrench"] = underTrench;
    baseJsonList["robotError"] = robotErrorCheck;
    baseJsonList["notes"] = notes;

    return baseJsonList;
}
