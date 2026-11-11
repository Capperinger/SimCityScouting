import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { writeToDb } from "../scripts/firebase";
import ReactJsonView from "@microlink/react-json-view";
import seedDataBase from "../scripts/seed";
import IntegerInput from "../components/IntegerInput";
import { debug } from "../scripts/debug";

interface ActionComponentProps {
    onSubmit: () => void;
    onDelete: () => void;
    clear: () => void;
}

interface StoredScoutingData extends Record<string, unknown> {
    teamNumber: number | string;
    matchNumber: number | string;
}

function isStoredScoutingData(value: unknown): value is StoredScoutingData {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const data = value as Record<string, unknown>;
    const hasValidNumber = (number: unknown) =>
        (typeof number === "number" && Number.isFinite(number)) ||
        (typeof number === "string" && number.trim() !== "");

    return hasValidNumber(data.teamNumber) && hasValidNumber(data.matchNumber);
}

function parseJsonOrEmpty(value: string): object {
    if (!value.trim()) {
        return {};
    }

    try {
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === "object" && parsed !== null ? parsed : {};
    } catch {
        return {};
    }
}

const ActionComponent: React.FC<ActionComponentProps> = ({
    onSubmit,
    onDelete,
    clear,
}) => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate("/");
    };

    return (
        <div className="flex flex-col justify-center items-center">
            <div className="flex flex-row justify-center items-center pt-6">
                <button
                    className="text-center bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-10 rounded-2xl"
                    onClick={onSubmit}
                >
                    Submit
                </button>

                <button
                    className="text-center bg-red-600 hover:bg-red-700 text-white font-bold w-2/5 ml-15 mr-15 py-2 px-10 rounded-2xl "
                    onClick={onDelete}
                >
                    Delete
                </button>
                <button
                    className="text-center bg-blue-600 text-white font-bold py-2 px-6 rounded-2xl"
                    onClick={goBack}
                >
                    Back
                </button>
            </div>

            <div className="w-full flex justify-center items-center">
                <div className="w-1/38"></div>
                <button
                    className="bg-red-800 text-white font-bold w-5/5 mt-5 py-2 px-6 rounded-2xl shadow w-37/200"
                    onClick={clear}
                >
                    Clear
                </button>
            </div>
        </div>
    );
};

const LocalStorageView: React.FC = () => {
    const navigate = useNavigate();
    const goBack = () => {
        navigate("/");
    };

    const [seedNumber, setSeedNumber] = useState(1);

    const [keys, setKeys] = React.useState<string[]>([]);
    const [selectedKey, setSelectedKey] = React.useState<string>("");
    const [value, setValue] = React.useState<string>("");
    const [submissionError, setSubmissionError] = React.useState("");
    const [seeding, setSeeding] = React.useState(false);
    const [seedMessage, setSeedMessage] = React.useState("");

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            setKeys(Object.keys(localStorage));
        }
    }, []);

    const loadItem = () => {
        if (!selectedKey) return;
        const v = localStorage.getItem(selectedKey);
        setValue(v ?? "");
    };

    const deleteItem = () => {
        if (!selectedKey) return;
        localStorage.removeItem(selectedKey);
        setValue("");
        setKeys(Object.keys(localStorage));
    };

    const clear = () => {
        if (window.confirm("Are you sure you want to clear local storage?")) {
            localStorage.clear();
            setSelectedKey("");
            setValue("");
            setKeys([]);
        }
    };

    const submitItem = async () => {
        setSubmissionError("");
        if (!selectedKey) {
            setSubmissionError("Select a local data item before submitting.");
            return;
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(value);
        } catch {
            setSubmissionError(
                "The selected item is empty or invalid JSON. Load or correct its data before submitting.",
            );
            return;
        }

        if (!isStoredScoutingData(parsed)) {
            setSubmissionError(
                "The selected item must be a scouting record with a team number and match number.",
            );
            return;
        }

        const saved = await writeToDb(
            `${parsed.teamNumber}/${parsed.matchNumber}`,
            parsed,
        );
        if (!saved) {
            setSubmissionError(
                "Firebase did not save this item. Check your connection and try again.",
            );
            return;
        }

        window.location.href = "/";
    };

    const seed = async () => {
        setSeeding(true);
        setSeedMessage("");
        try {
            const seedJson = seedDataBase(seedNumber);
            const saved = await writeToDb(
                `${seedJson.teamNumber}/${seedJson.matchNumber}`,
                seedJson,
            );
            setSeedMessage(
                saved
                    ? `Seed data saved for team ${seedJson.teamNumber}, match ${seedJson.matchNumber}.`
                    : "Firebase did not save the seed data. Check your connection and try again.",
            );
        } catch (error) {
            console.error("Unable to seed Firebase:", error);
            setSeedMessage(
                error instanceof Error
                    ? `Unable to seed Firebase: ${error.message}`
                    : "Unable to seed Firebase. Check your connection and try again.",
            );
        } finally {
            setSeeding(false);
        }
    };

    const buttonStyle: string =
        "bg-sky-600 text-white font-semibold text-xl px-2 py-2 rounded-full hover:bg-sky-700 transition-colors h-15 w-35";

    return (
        <div className="flex flex-col items-center justify-start space-y-6 pt-12">
            <button className={buttonStyle} onClick={goBack}>
                Back
            </button>

            <h1 className="font-bold text-white text-4xl">Stored Data</h1>
            <p className="font-bold text-white">
                scoutData-(teamNumber)-(matchNumber)
            </p>
            <div className="flex flex-col items-center space-y-4 pb-8">
                <h2 className="text-white text-xl">
                    Select a key to view/edit
                </h2>

                <select
                    className="bg-gray-800 text-white px-4 py-2 rounded-xl"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                >
                    <option value="">-- Select Key --</option>
                    {keys.map((k) => (
                        <option key={k} value={k}>
                            {k}
                        </option>
                    ))}
                </select>

                <button
                    onClick={loadItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                >
                    Load
                </button>

                <ReactJsonView
                    src={parseJsonOrEmpty(value)}
                    theme="monokai"
                />
                <p className="text-white">
                    Make sure the above has a value before submitting or
                    deleting
                </p>
            </div>

            <ActionComponent
                onSubmit={submitItem}
                onDelete={deleteItem}
                clear={clear}
            />
            {submissionError && (
                <p className="text-red-400 text-center" role="alert">
                    {submissionError}
                </p>
            )}

            {debug ? (
                <div>
                    <IntegerInput
                        min={0}
                        max={9999}
                        placeholder="9999"
                        label="Seed number"
                        onChange={setSeedNumber}
                        value={seedNumber}
                    />

                    <button
                        onClick={seed}
                        disabled={seeding}
                        className="bg-violet-600 hover:bg-violet-800 text-white px-4 py-2 rounded-xl"
                    >
                        {seeding ? "Saving seed..." : "Seed, DO NOT SPAM!!"}
                    </button>
                    {seedMessage && (
                        <p className="text-white" role="status">
                            {seedMessage}
                        </p>
                    )}
                </div>
            ) : null}
        </div>
    );
};

export default LocalStorageView;
