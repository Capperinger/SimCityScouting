import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    matchScoutingPath,
    pitScoutingPath,
    syncStoredScoutingData,
    writeToDb,
} from "../scripts/firebase";
import ReactJsonView from "@microlink/react-json-view";
import seedDataBase from "../scripts/seed";
import IntegerInput from "../components/IntegerInput";
import { debug } from "../scripts/debug";

interface ActionComponentProps {
    onSubmit: () => void;
    onDelete: () => void;
    clear: () => void;
    disabled: boolean;
    itemSelected: boolean;
}

interface StoredScoutingData extends Record<string, unknown> {
    teamNumber: number | string;
    matchNumber?: number | string;
}

const isScoutingStorageKey = (key: string) =>
    key.startsWith("scoutData-") || key.startsWith("pitData-");

const getScoutingStorageKeys = () =>
    Object.keys(localStorage).filter(isScoutingStorageKey);

function isStoredScoutingData(
    value: unknown,
    isPitScouting: boolean,
): value is StoredScoutingData {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const data = value as Record<string, unknown>;
    const hasValidNumber = (number: unknown) =>
        (typeof number === "number" && Number.isFinite(number)) ||
        (typeof number === "string" && number.trim() !== "");

    return (
        hasValidNumber(data.teamNumber) &&
        (isPitScouting || hasValidNumber(data.matchNumber))
    );
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
    disabled,
    itemSelected,
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
                    disabled={disabled || !itemSelected}
                >
                    Submit
                </button>

                <button
                    className="text-center bg-red-600 hover:bg-red-700 text-white font-bold w-2/5 ml-15 mr-15 py-2 px-10 rounded-2xl "
                    onClick={onDelete}
                    disabled={disabled || !itemSelected}
                >
                    Delete
                </button>
                <button
                    className="text-center bg-blue-600 text-white font-bold py-2 px-6 rounded-2xl"
                    onClick={goBack}
                    disabled={disabled}
                >
                    Back
                </button>
            </div>

            <div className="w-full flex justify-center items-center">
                <div className="w-1/38"></div>
                <button
                    className="bg-red-800 text-white font-bold w-5/5 mt-5 py-2 px-6 rounded-2xl shadow w-37/200"
                    onClick={clear}
                    disabled={disabled}
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
    const [submissionMessage, setSubmissionMessage] =
        React.useState("");
    const [submittingAll, setSubmittingAll] = React.useState(false);
    const [seeding, setSeeding] = React.useState(false);
    const [seedMessage, setSeedMessage] = React.useState("");

    React.useEffect(() => {
        if (typeof window !== "undefined") {
            setKeys(getScoutingStorageKeys());
        }
    }, []);

    const loadItem = () => {
        if (!selectedKey) return;
        const v = localStorage.getItem(selectedKey);
        setValue(v ?? "");
    };

    const submitAll = async () => {
        if (submittingAll) {
            return;
        }

        if (keys.length === 0) {
            setSubmissionMessage(
                "There is no locally saved scouting data to submit.",
            );
            return;
        }

        if (
            !window.confirm(
                `Submit all ${keys.length} locally saved scouting item(s)? Each local copy is removed only after Firebase confirms it was saved.`,
            )
        ) {
            return;
        }

        setSubmittingAll(true);
        setSubmissionError("");
        setSubmissionMessage("");
        try {
            const result = await syncStoredScoutingData();
            const remainingKeys = getScoutingStorageKeys();
            setKeys(remainingKeys);
            if (selectedKey && !remainingKeys.includes(selectedKey)) {
                setSelectedKey("");
                setValue("");
            }

            const messages = [
                `Submitted ${result.submitted} item(s).`,
                result.skipped > 0
                    ? `${result.skipped} invalid or unavailable item(s) were skipped.`
                    : "",
                result.cleanupFailed > 0
                    ? `${result.cleanupFailed} saved item(s) could not be removed locally.`
                    : "",
                `${result.remaining} local item(s) remain.`,
            ].filter(Boolean);
            setSubmissionMessage(messages.join(" "));
            if (result.failed > 0) {
                const failureDetails = result.failures
                    .slice(0, 3)
                    .map(
                        ({ key, message }) =>
                            `${key}: ${message}`,
                    )
                    .join(" | ");
                setSubmissionError(
                    `${result.failed} item(s) failed and remain on this device.${failureDetails ? ` ${failureDetails}` : ""}`,
                );
            }
        } catch (error) {
            console.error("Unable to submit all stored scouting data:", error);
            setSubmissionError(
                "Bulk submission stopped before it could finish. Refresh the stored data list before trying again.",
            );
        } finally {
            setSubmittingAll(false);
        }
    };

    const deleteItem = () => {
        if (!selectedKey) return;
        localStorage.removeItem(selectedKey);
        setValue("");
        setKeys(getScoutingStorageKeys());
    };

    const clear = () => {
        setSubmissionError("");
        if (
            window.confirm(
                "Clear all locally saved match and pit scouting data? This removes unsent scouting backups from this device. Your saved sign-in and preferences will remain.",
            )
        ) {
            try {
                for (const key of getScoutingStorageKeys()) {
                    localStorage.removeItem(key);
                }
                setSelectedKey("");
                setValue("");
                setKeys(getScoutingStorageKeys());
            } catch (error) {
                console.error("Unable to clear local scouting data:", error);
                setSubmissionError(
                    "Could not clear all local scouting backups. Some items may remain on this device.",
                );
            }
        }
    };

    const submitItem = async () => {
        setSubmissionError("");
        setSubmissionMessage("");
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

        const isPitScouting = selectedKey.startsWith("pitData-");
        if (!isStoredScoutingData(parsed, isPitScouting)) {
            setSubmissionError(
                isPitScouting
                    ? "The selected item must be pit scouting data with a team number."
                    : "The selected item must be match scouting data with a team number and match number.",
            );
            return;
        }

        const path = isPitScouting
            ? pitScoutingPath(parsed.teamNumber)
            : matchScoutingPath(
                  parsed.teamNumber,
                  String(parsed.matchNumber),
              );
        const saved = await writeToDb(path, parsed);
        if (!saved) {
            setSubmissionError(
                "Firebase did not save this item. Check your connection and try again.",
            );
            return;
        }

        try {
            localStorage.removeItem(selectedKey);
        } catch (error) {
            console.error("Firebase saved the item, but its local copy remains:", error);
            setSubmissionError(
                "Firebase saved this item, but its local copy could not be removed from this device.",
            );
            return;
        }
        const remainingKeys = getScoutingStorageKeys();
        setKeys(remainingKeys);
        setSelectedKey("");
        setValue("");
        setSubmissionMessage(
            isPitScouting
                ? `Submitted pit scouting for team ${parsed.teamNumber}.`
                : `Submitted match ${parsed.matchNumber} for team ${parsed.teamNumber}.`,
        );
    };

    const seed = async () => {
        setSeeding(true);
        setSeedMessage("");
        try {
            const seedJson = seedDataBase(seedNumber);
            const saved = await writeToDb(
                matchScoutingPath(
                    seedJson.teamNumber,
                    seedJson.matchNumber,
                ),
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
                Upload data stored on this device to the database.
            </p>
            <div className="flex flex-col items-center space-y-4 pb-8">
                <h2 className="text-white text-xl">
                    Select a match to view/edit
                </h2>

                <select
                    className="bg-gray-800 text-white px-4 py-2 rounded-xl"
                    value={selectedKey}
                    onChange={(e) => setSelectedKey(e.target.value)}
                    disabled={submittingAll}
                >
                    <option value="">Select a match</option>
                    {keys.map((k) => (
                        <option key={k} value={k}>
                            {k}
                        </option>
                    ))}
                </select>

                <button
                    onClick={loadItem}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl"
                    disabled={submittingAll}
                >
                    Load match data
                </button>

                <button
                    onClick={submitAll}
                    disabled={submittingAll || keys.length === 0}
                    className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white px-4 py-2 rounded-xl"
                >
                    {submittingAll
                        ? `Submitting ${keys.length} saved item(s)...`
                        : `Submit all saved data (${keys.length})`}
                </button>

                {submissionMessage && (
                    <p className="text-white text-center" role="status">
                        {submissionMessage}
                    </p>
                )}

                <ReactJsonView
                    src={parseJsonOrEmpty(value)}
                    theme="monokai"
                />
                <p className="text-white">
                    Review the loaded scouting data here.
                </p>
            </div>

            <ActionComponent
                onSubmit={submitItem}
                onDelete={deleteItem}
                clear={clear}
                disabled={submittingAll}
                itemSelected={Boolean(selectedKey)}
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
