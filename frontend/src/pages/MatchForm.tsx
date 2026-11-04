import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import BinaryChoice from "../components/BinaryChoice";
import MultiCounterInput from "../components/MultiCounterInput";
import IntegerInput from "../components/IntegerInput";
import Dropdown from "../components/Dropdown";
import AutoResizeTextarea from "../components/AutoResizeTextArea";
import CheckboxDropdown from "../components/CheckboxDropdown";
import { writeToDb, wsSend } from "../scripts/firebase";
import { readCookie } from "../scripts/user";
import { debug } from "../scripts/debug";
import { useTimer } from "../scripts/timer";
import { log } from "../scripts/log";
import DropdownSearch from "../components/DropdownSearch";

const MatchForm: React.FC = () => {
    log(`User ${readCookie("user")} on matchform`);

    const navigate = useNavigate();
    const { seconds, start, reset } = useTimer(0);

    useEffect(() => {
        if (readCookie("user") == undefined) {
            navigate("/login");
        }
        wsSend(readCookie("user") ?? "");
    }, [navigate]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        if (seconds > 1 || readCookie("dih")) {
            window.addEventListener("beforeunload", handleBeforeUnload);
        }
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [seconds]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            wsSend(readCookie("user") ?? "");
        }, 5000);

        return () => {
            clearInterval(intervalId);
        };
    }, []);

    const [section, setSection] = useState<
        "setup" | "auto" | "teleop" | "endgame" | "errors"
    >("setup");

    type checkboxDropdownList = Record<string, boolean>;

    // this boolean is used to show a message if the data was not sent
    const [sent, setSent] = useState<boolean>(true);
    // Setup values
    const [eventName, setEventName] = useState<string>("");
    const [teamNumber, setTeamNumber] = useState<string>("");
    const [matchNumber, setMatchNumber] = useState(0);

    // Auto values
    const [autoFuel, setAutoFuel] = useState(0);
    const [autoClimbed, setAutoClimbed] = useState(false);
    const [autoHoardedFuel, setautoHoardedFuel] = useState(false);

    // Teleop values
    const [teleopShift, setTeleopShift] = useState(0);

    const [transitionFuel, setTransitionFuel] = useState(0);
    const [shiftHubActive, setShiftHubActive] = useState(false);

    const [shift1Fuel, setShift1Fuel] = useState(0);
    const [shift2Fuel, setShift2Fuel] = useState(0);
    const [shift3Fuel, setShift3Fuel] = useState(0);
    const [shift4Fuel, setShift4Fuel] = useState(0);

    const [transitionCollected, setTransitionCollected] = useState(true);
    const [shift1Collected, setShift1Collected] = useState(true);
    const [shift2Collected, setShift2Collected] = useState(true);
    const [shift3Collected, setShift3Collected] = useState(true);
    const [shift4Collected, setShift4Collected] = useState(true);

    const [shift1Defense, setShift1Defense] = useState(true);
    const [shift2Defense, setShift2Defense] = useState(true);
    const [shift3Defense, setShift3Defense] = useState(true);
    const [shift4Defense, setShift4Defense] = useState(true);

    const [shift1HoardedFuel, setShift1HoardedFuel] = useState(true);
    const [shift2HoardedFuel, setShift2HoardedFuel] = useState(true);
    const [shift3HoardedFuel, setShift3HoardedFuel] = useState(true);
    const [shift4HoardedFuel, setShift4HoardedFuel] = useState(true);

    // Endgame values
    const [endgameFuel, setEndgameFuel] = useState(0);
    const [endgameClimbLevel, setEndgameClimbLevel] = useState<
        "Didn't climb" | "Level 1" | "Level 2" | "Level 3"
    >("Didn't climb");

    const [notes, setNotes] = useState<string>("");

    // finale  values

    const robotErrors = [
        "Intake issues",
        "Shooter issues",
        "Stuck on Fuel",
        "Climb Failed",
        "Robot unresponsive",
        "Part broke off",
        "Did not participate",
        "Auto stop",
        "E-stop",
        "Robot could not get off after climb",
        "Other",
    ];

    const [robotErrorsCheck, setRobotErrorsCheck] =
        useState<checkboxDropdownList>({
            "Intake issues": false,
            "Shooter issues": false,
            "Stuck on fuel": false,
            "Climb Failed": false,
            "Robot unresponsive": false,
            "Part broke off": false,
            "Did not participate": false,
            "Auto stop": false,
            "E-stop": false,
            "Robot could not get off after climb": false,
            Other: false,
        });

    const events = ["NE District Minuteman Event", "NE District URI Event"];

    const goBack = () => {
        if (seconds > 1) {
            if (readCookie("dih") == "true") {
                const inp = prompt("enter your username to continue");
                if (inp == readCookie("user")) {
                    navigate("/");
                }
            } else {
                const inp = prompt("Are you sure? type ok");
                if (inp == "ok" || inp == "Ok") {
                    navigate("/");
                }
            }
        } else {
            navigate("/");
        }
    };
    // 1. Create a ref to track the last phase we handled
    const lastPhaseRef = useRef<string>("");

    useEffect(() => {
        let currentPhase = "";
        let currentShift = 0;

        if (seconds >= 1 && seconds <= 20) {
            currentPhase = "auto";
        } else if (seconds > 23 && seconds <= 33) {
            currentPhase = "teleop-0";
            currentShift = 0;
        } else if (seconds > 33 && seconds <= 58) {
            currentPhase = "teleop-1";
            currentShift = 1;
        } else if (seconds > 58 && seconds <= 83) {
            currentPhase = "teleop-2";
            currentShift = 2;
        } else if (seconds > 83 && seconds <= 108) {
            currentPhase = "teleop-3";
            currentShift = 3;
        } else if (seconds > 108 && seconds <= 133) {
            currentPhase = "teleop-4";
            currentShift = 4;
        } else if (seconds > 133 && seconds <= 163) {
            currentPhase = "endgame";
        } else if (seconds > 163) {
            reset();
        }

        if (currentPhase !== "" && currentPhase !== lastPhaseRef.current) {
            console.log(`Switching to: ${currentPhase}`);

            if (currentPhase === "auto") {
                // Timer phase transitions intentionally synchronize the active form section.
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSection("auto");
            } else if (currentPhase.startsWith("teleop")) {
                setSection("teleop");
                setTeleopShift(currentShift);
            } else if (currentPhase === "endgame") {
                setSection("endgame");
            }

            lastPhaseRef.current = currentPhase;
        }

        if (seconds === 0) lastPhaseRef.current = "";
    }, [seconds, reset]);

    async function submitData() {
        //make sure certain fields are filled out
        const check: boolean =
            eventName !== "" && teamNumber !== "" && matchNumber !== 0;

        const data = {
            name: readCookie("user"),
            eventName: eventName,
            teamNumber: parseInt(teamNumber),
            matchNumber: matchNumber,

            autoFuel: autoFuel,
            autoClimbed: autoClimbed,
            autoHoardedFuel: autoHoardedFuel,

            shift1HubActive: shiftHubActive,
            shift2HubActive: !shiftHubActive,
            shift3HubActive: shiftHubActive,
            shift4HubActive: !shiftHubActive,

            transitionCollected: transitionCollected,
            shift1Collected: shift1Collected,
            shift2Collected: shift2Collected,
            shift3Collected: shift3Collected,
            shift4Collected: shift4Collected,

            transitionFuel: transitionFuel,
            shift1Fuel: shift1Fuel,
            shift2Fuel: shift2Fuel,
            shift3Fuel: shift3Fuel,
            shift4Fuel: shift4Fuel,

            shift1Defense: shift1Defense,
            shift2Defense: shift2Defense,
            shift3Defense: shift3Defense,
            shift4Defense: shift4Defense,

            shift1HoardedFuel: shift1HoardedFuel,
            shift2HoardedFuel: shift2HoardedFuel,
            shift3HoardedFuel: shift3HoardedFuel,
            shift4HoardedFuel: shift4HoardedFuel,

            endgameFuel: endgameFuel,
            endgameClimbLevel: endgameClimbLevel,

            notes: notes,
            robotError: robotErrorsCheck,
            failure: Object.values(robotErrorsCheck).some(
                (value) => value === true,
            ),
        };

        /*
        The path for block of data will be submitted as follows:
        /{eventName}/{teamNumber}/{matchNumber}/{timestamp}, timestamp is not finished
        */
        if (!check && !debug) {
            alert("Please fill out all required fields before submitting.");
        } else {
            localStorage.setItem(
                `scoutData-${teamNumber}-${matchNumber}`,
                JSON.stringify(data),
            );
            setSent(false);
            const val = await writeToDb(
                `${teamNumber?.toString()}/${matchNumber?.toString()}`,
                data,
            );
            if (!val) {
                setSent(true);
            } else {
                setSent(false);
            }
            const pathname = window.location.pathname;
            if (pathname === "/match") {
                goBack();
            }
        }
    }

    const tab = (name: string) =>
        `px-5 py-2 rounded-full font-semibold transition-colors ${
            section === name
                ? "bg-sky-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`;
    const tab2 = (name: number) =>
        `px-5 py-2 rounded-full font-semibold transition-colors ${
            teleopShift === name
                ? "bg-sky-600 text-white"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
        }`;

    let content = null;

    const buttonStyle: string =
        "bg-sky-600 text-white font-semibold text-xl px-2 py-2 rounded-full hover:bg-sky-700 transition-colors h-15 w-35";

    if (section === "setup") {
        content = (
            <>
                <Dropdown
                    label="Event"
                    placeholder={"Select event (REQUIRED)"}
                    value={eventName}
                    onChange={setEventName}
                    options={events}
                />
                <IntegerInput
                    value={matchNumber}
                    onChange={setMatchNumber}
                    label={"Match Number"}
                    placeholder="REQUIRED"
                    min={1}
                    max={99999}
                />
                <DropdownSearch
                    options={[
                        "61",
                        "78",
                        "348",
                        "663",
                        "1119",
                        "1153",
                        "1350",
                        "1474",
                        "1699",
                        "1735",
                        "1757",
                        "1768",
                        "2079",
                        "2168",
                        "2262",
                        "3464",
                        "3623",
                        "3719",
                        "4176",
                        "5000",
                        "5112",
                        "5494",
                        "5687",
                        "6324",
                        "6333",
                        "6367",
                        "6620",
                        "8544",
                        "10063",
                        "10066",
                        "10254",
                        "10973",
                    ]}
                    value={teamNumber}
                    placeholder="Team Number"
                    onChange={setTeamNumber}
                />
                <button onClick={start} className={buttonStyle}>
                    start
                </button>
            </>
        );
    } else if (section === "auto") {
        content = (
            <>
                <MultiCounterInput
                    min={0}
                    max={999}
                    value={autoFuel}
                    onChange={setAutoFuel}
                    label={"Auto fuel"}
                />
                <BinaryChoice
                    label={"Auto climb succeed?"}
                    options={["yes", "no"]}
                    value={autoClimbed}
                    onChange={setAutoClimbed}
                />
                <BinaryChoice
                    label={"fuel -> Alliance zone"}
                    options={["yes", "no"]}
                    onChange={setautoHoardedFuel}
                    value={autoHoardedFuel}
                />
            </>
        );
    } else if (section === "teleop") {
        let shiftcontent = null;
        if (teleopShift === 0) {
            shiftcontent = (
                <>
                    <MultiCounterInput
                        min={0}
                        max={999}
                        value={transitionFuel}
                        onChange={setTransitionFuel}
                        label={"Transition Fuel"}
                    />

                    <BinaryChoice
                        label={"Collected from Neutral"}
                        options={["yes", "no"]}
                        value={transitionCollected}
                        onChange={setTransitionCollected}
                    />

                    <p className="font-bold text-white text-l pb-1">
                        If the robot failed to lower from climb, state that in
                        the errors tab
                    </p>
                </>
            );
        } else if (teleopShift === 1) {
            shiftcontent = (
                <>
                    <BinaryChoice
                        label={"Hub Active?"}
                        options={["yes", "no"]}
                        onChange={setShiftHubActive}
                        value={shiftHubActive}
                    />
                    <MultiCounterInput
                        min={0}
                        max={999}
                        value={shift1Fuel}
                        onChange={setShift1Fuel}
                        label={"Fuel"}
                    />
                    <BinaryChoice
                        label={"Collected from Neutral"}
                        options={["yes", "no"]}
                        value={shift1Collected}
                        onChange={setShift1Collected}
                    />
                    <BinaryChoice
                        label={"Played Defense?"}
                        options={["yes", "no"]}
                        onChange={setShift1Defense}
                        value={shift1Defense}
                    />
                    <BinaryChoice
                        label={"fuel -> Alliance zone"}
                        options={["yes", "no"]}
                        onChange={setShift1HoardedFuel}
                        value={shift1HoardedFuel}
                    />
                </>
            );
        } else if (teleopShift === 2) {
            shiftcontent = (
                <>
                    <BinaryChoice
                        label={"Hub Active?"}
                        options={["yes", "no"]}
                        onChange={(isActive) =>
                            setShiftHubActive(!isActive)
                        }
                        value={!shiftHubActive}
                    />
                    <MultiCounterInput
                        min={0}
                        max={999}
                        value={shift2Fuel}
                        onChange={setShift2Fuel}
                        label={"Fuel"}
                    />
                    <BinaryChoice
                        label={"Collected from Neutral"}
                        options={["yes", "no"]}
                        value={shift2Collected}
                        onChange={setShift2Collected}
                    />
                    <BinaryChoice
                        label={"Played Defense?"}
                        options={["yes", "no"]}
                        onChange={setShift2Defense}
                        value={shift2Defense}
                    />
                    <BinaryChoice
                        label={"fuel -> Alliance zone"}
                        options={["yes", "no"]}
                        onChange={setShift2HoardedFuel}
                        value={shift2HoardedFuel}
                    />
                </>
            );
        } else if (teleopShift === 3) {
            shiftcontent = (
                <>
                    <BinaryChoice
                        label={"Hub Active?"}
                        options={["yes", "no"]}
                        onChange={setShiftHubActive}
                        value={shiftHubActive}
                    />
                    <MultiCounterInput
                        min={0}
                        max={999}
                        value={shift3Fuel}
                        onChange={setShift3Fuel}
                        label={"Fuel"}
                    />
                    <BinaryChoice
                        label={"Collected from Neutral"}
                        options={["yes", "no"]}
                        value={shift3Collected}
                        onChange={setShift3Collected}
                    />
                    <BinaryChoice
                        label={"Played Defense?"}
                        options={["yes", "no"]}
                        onChange={setShift3Defense}
                        value={shift3Defense}
                    />
                    <BinaryChoice
                        label={"fuel -> Alliance zone"}
                        options={["yes", "no"]}
                        onChange={setShift3HoardedFuel}
                        value={shift3HoardedFuel}
                    />
                </>
            );
        } else if (teleopShift === 4) {
            shiftcontent = (
                <>
                    <BinaryChoice
                        label={"Hub Active?"}
                        options={["yes", "no"]}
                        onChange={(isActive) =>
                            setShiftHubActive(!isActive)
                        }
                        value={!shiftHubActive}
                    />
                    <MultiCounterInput
                        min={0}
                        max={999}
                        value={shift4Fuel}
                        onChange={setShift4Fuel}
                        label={"Fuel"}
                    />
                    <BinaryChoice
                        label={"Collected from Neutral"}
                        options={["yes", "no"]}
                        value={shift4Collected}
                        onChange={setShift4Collected}
                    />
                    <BinaryChoice
                        label={"Played Defense?"}
                        options={["yes", "no"]}
                        onChange={setShift4Defense}
                        value={shift4Defense}
                    />
                    <BinaryChoice
                        label={"fuel -> Alliance zone"}
                        options={["yes", "no"]}
                        onChange={setShift4HoardedFuel}
                        value={shift4HoardedFuel}
                    />
                </>
            );
        }
        content = (
            <div className="flex flex-col items-center justify-start pt-2.5 w-full">
                {/* Main Button Container */}
                <div className="flex flex-row flex-wrap justify-center gap-4 pb-5 max-w-[400px]">
                    <button
                        className={tab2(0)}
                        onClick={() => setTeleopShift(0)}
                    >
                        Tran
                    </button>
                    <button
                        className={tab2(1)}
                        onClick={() => setTeleopShift(1)}
                    >
                        Shift 1
                    </button>
                    <button
                        className={tab2(2)}
                        onClick={() => setTeleopShift(2)}
                    >
                        Shift 2
                    </button>
                    <button
                        className={tab2(3)}
                        onClick={() => setTeleopShift(3)}
                    >
                        Shift 3
                    </button>
                    <button
                        className={tab2(4)}
                        onClick={() => setTeleopShift(4)}
                    >
                        Shift 4
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex flex-col items-center justify-center">
                    {shiftcontent}
                </div>
            </div>
        );
    } else if (section === "endgame") {
        content = (
            <>
                <MultiCounterInput
                    min={0}
                    max={999}
                    value={endgameFuel}
                    onChange={setEndgameFuel}
                    label={"Endgame fuel scored"}
                />
                <Dropdown
                    value={endgameClimbLevel}
                    options={["Didn't climb", "Level 1", "Level 2", "Level 3"]}
                    label={"Endgame Climb Level"}
                    onChange={(e) => {
                        setEndgameClimbLevel(
                            e as
                                | "Didn't climb"
                                | "Level 1"
                                | "Level 2"
                                | "Level 3",
                        );
                    }}
                />
                <CheckboxDropdown
                        label={"Select Robot Errors"}
                        optionList={robotErrors}
                        optionCheck={robotErrorsCheck}
                        onChange={setRobotErrorsCheck}
                    />

                    <AutoResizeTextarea
                        value={notes}
                        onChange={setNotes}
                        placeholder="Other notes about robot"
                    />
                    <button className={buttonStyle} onClick={submitData}>
                        Submit
                    </button>
                    {!sent ? (
                        <div className="flex flex-col items-center space-y-2 ">
                            <h3 className="font-semibold text-red-800 text-2xl pb-1">
                                If you are seeing this message, you either have
                                poor connectivity, or you have encountered an
                                error. If you encountered an error, a message
                                should have shown up stating you had an error.
                                If no message showed up, then you're
                                connectivity is poor. If your data gets sent,
                                then this page will automatically close. If you
                                need to fill out another form, you may press the
                                back button, but remember to submit later in the
                                "view local storage" page.
                            </h3>
                            <button className={buttonStyle} onClick={goBack}>
                                Back
                            </button>
                        </div>
                    ) : (
                        <></>
                    )}
            </>
        );
    }

    return (
        <div className="overflow-x-auto flex flex-col items-center justify-start space-y-6 pt-12.5">
            <button className={buttonStyle} onClick={goBack}>
                Back
            </button>
            <div className="flex flex-col items-center justify-start pt-2.5 w-full">
                {/* Main Button Container */}
                <div className="flex flex-row flex-wrap justify-center gap-4 pb-5 max-w-[400px]">
                    <button
                        className={tab("setup")}
                        onClick={() => setSection("setup")}
                    >
                        Setup
                    </button>
                    <button
                        className={tab("auto")}
                        onClick={() => setSection("auto")}
                    >
                        Auto
                    </button>
                    <button
                        className={tab("teleop")}
                        onClick={() => setSection("teleop")}
                    >
                        Teleop
                    </button>
                </div>

                <div className="flex flex-row space-x-4">
                    <button
                        className={tab("endgame")}
                        onClick={() => setSection("endgame")}
                    >
                        Endgame
                    </button>
                </div>
            </div>
            {content}
        </div>
    );
};

export default MatchForm;
