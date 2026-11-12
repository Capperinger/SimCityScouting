import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import IntegerInput from "../components/IntegerInput";
import AutoResizeTextarea from "../components/AutoResizeTextArea";
import { readCookie } from "../scripts/user";

import { pitScoutingPath, writeToDb } from "../scripts/firebase";
import Dropdown from "../components/Dropdown";
import BinaryChoice from "../components/BinaryChoice";

const PitScoutingForm: React.FC = () => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate("/");
    };

    useEffect(() => {
        // useEffect to run after component mounts
        if (readCookie("user") == undefined) {
            navigate("/login");
        }
    }, [navigate]);

    const [sent, setSent] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    /*Setup values*/
    const scoutingTeam = 0;
    const [eventName, setEventName] = useState<string>("");
    const matchNumber = 0;
    const [teamnum, setTeamnum] = useState(0);

    /*Values*/
    const [chassisSizew, setChassisSizew] = useState(0);
    const [chassisSizel, setChassisSizel] = useState(0);
    const [startingHeight, setStartingHeight] = useState<string>("");
    const [maxHeight, setMaxHeight] = useState<string>("");
    const [motorTypes, setMotorTypes] = useState<string>("");
    const [outpost, setOutpost] = useState<boolean>(false);
    const [notes, setNotes] = useState<string>("")

    const events = ["NE District Minuteman Event", "NE District URI Event"];

    const [multiShooter, setMultiShooter] = useState(false);
    const [sstatic, setStatic] = useState(false);
    const [crossedBump, setCrossedBump] = useState(false);
    const [underTrench, setUnderTrench] = useState(false);

    async function submitData() {
        const scoutName = readCookie("user");
        const check =
            eventName !== "" &&
            Number.isSafeInteger(teamnum) &&
            teamnum > 0 &&
            scoutName !== undefined;

        const data = {
            name: scoutName,
            teamNumber: teamnum,
            scoutingTeam: scoutingTeam,
            eventName: eventName,
            matchNumber: matchNumber,

            static: !sstatic,
            multiShooter: multiShooter,
            crossedBump: crossedBump,
            underTrench: underTrench,

            chassisSizel: chassisSizel,
            chassisSizew: chassisSizew,
            startingHeight: startingHeight,
            maxHeight: maxHeight,

            motorTypes: motorTypes,
            outpost: outpost,
            notes: notes
        };
        /*
    The path for block of data will be submitted as follows:
    /{eventName}/{teamnum}/{matchNumber}/{timestamp}, timestamp is not finished
    */
        if (!check) {
            alert(
                "Please sign in and enter a valid event and team number before submitting.",
            );
            return;
        }

        try {
            localStorage.setItem(`pitData-${teamnum}`, JSON.stringify(data));
        } catch (error) {
            console.error("Unable to save the local pit scouting backup:", error);
        }

        setIsSubmitting(true);
        setSent(true);
        try {
            const saved = await writeToDb(pitScoutingPath(teamnum), data);
            if (!saved) {
                setSent(false);
                return;
            }

            setSent(true);
            const pathname = window.location.pathname;
            if (pathname === "/pitscouting") {
                goBack();
            }
        } finally {
            setIsSubmitting(false);
        }
    }
    const buttonStyle =
        "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded";

    return (
        <div className="overflow-x-auto flex flex-col items-center justify-start space-y-6 pt-12.5">
            <h1 className="text-4xl font-bold text-white">Pit Scouting Form</h1>

            <button className={buttonStyle} onClick={goBack}>
                Back
            </button>

            <Dropdown
                label="Event"
                placeholder={"Select event"}
                value={eventName}
                onChange={setEventName}
                options={events}
            />

            <IntegerInput
                value={teamnum}
                onChange={setTeamnum}
                label={"Team Number"}
                max={99999}
            />
            <IntegerInput
                value={chassisSizel}
                onChange={setChassisSizel}
                label="Chassis size Length"
            />
            <IntegerInput
                value={chassisSizew}
                onChange={setChassisSizew}
                label="Chassis size Width"
            />
            <h1 className="text-white text-2xl font-semibold">
                chassis {chassisSizel}x{chassisSizew}
            </h1>
            <BinaryChoice
                label={"Shooters turn?"}
                options={["yes", "no"]}
                value={sstatic}
                onChange={setStatic}
            />
            <BinaryChoice
                label={"Multiple Shooters?"}
                options={["yes", "no"]}
                value={multiShooter}
                onChange={setMultiShooter}
            />
            <BinaryChoice
                label={"Over Bump?"}
                options={["yes", "no"]}
                value={crossedBump}
                onChange={setCrossedBump}
            />
            <BinaryChoice
                label={"Under Trench?"}
                options={["yes", "no"]}
                value={underTrench}
                onChange={setUnderTrench}
            />
            <AutoResizeTextarea
                value={startingHeight}
                onChange={(val) => setStartingHeight(val.toString())}
                label="Starting Height (inches)"
            />
            <AutoResizeTextarea
                value={maxHeight}
                onChange={(val) => setMaxHeight(val.toString())}
                label="Max Height (inches)"
            />
            <AutoResizeTextarea
                value={motorTypes}
                onChange={(val) => setMotorTypes(val.toString())}
                label="Motor types"
            />
            <AutoResizeTextarea
                value={notes}
                onChange={(val) => setNotes(val.toString())}
                label="Other Notes"
            />
            <BinaryChoice
                label={"Used Outpost"}
                options={["no", "yes"]}
                value={outpost}
                onChange={setOutpost}
            />
            <button
                className={buttonStyle}
                onClick={submitData}
                disabled={isSubmitting}
            >
                {isSubmitting ? "Saving..." : "Submit"}
            </button>
            {!sent ? (
                <div className="flex flex-col items-center space-y-2 ">
                    <h3 className="font-semibold text-red-800 text-2xl pb-1">
                        If you are seeing this message, you either have poor
                        connectivity, or you have encountered an error. If you
                        encountered an error, a message should have shown up
                        stating you had an error. If no message showed up, then
                        you're connectivity is poor. If your data gets sent,
                        then this page will automatically close. If you need to
                        fill out another form, you may press the back button,
                        but remember to submit later in the "view local storage"
                        page.
                    </h3>
                    <button className={buttonStyle} onClick={goBack}>
                        Back
                    </button>
                </div>
            ) : (
                <></>
            )}
        </div>
    );
};

export default PitScoutingForm;
