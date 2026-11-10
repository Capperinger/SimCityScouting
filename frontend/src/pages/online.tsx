import React, { useState } from "react";
import { rt } from "../scripts/firebase";

interface NestedEpochData {
    [key: string]: { time: number };
}

interface DiffsJson {
    [key: string]: boolean;
}

const Online: React.FC = () => {
    const [diffs, setDiffs] = useState<DiffsJson>({});
    const [error, setError] = useState("");

    const isNestedEpochData = (value: unknown): value is NestedEpochData =>
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        Object.values(value).every(
            (entry) =>
                typeof entry === "object" &&
                entry !== null &&
                "time" in entry &&
                typeof entry.time === "number",
        );

    const proces = (inputData: NestedEpochData): DiffsJson => {
        const currentEpoch = Math.floor(Date.now() / 1000);

        return Object.entries(inputData).reduce((acc, [key, val]) => {
            acc[key] = (currentEpoch - val.time)<10;
            return (acc);
        }, {} as DiffsJson);
    };

    const buttonStyle: string =
        "bg-sky-600 text-white font-semibold text-xl px-2 py-2 rounded-full hover:bg-sky-700 transition-colors h-15 w-35 mr-2";

    return (
        <div className="p-10">
            <h2 className="font-bold text-white text-l pb-1">click right side or bottom button twice. "true" means user detected in last 10 seconds</h2>
            <button
                onClick={() => {
                    window.location.href = "/";
                }}
                className={buttonStyle}
            >
                Back
            </button>
            {/* BUTTON 1: Fetching Async Data */}
            <button
                className={buttonStyle}
                onClick={async () => {
                    setError("");
                    try {
                        const result = await rt("online");
                        if (!isNestedEpochData(result)) {
                            throw new Error(
                                "Realtime Database returned invalid online data.",
                            );
                        }
                        setDiffs(proces(result));
                    } catch (fetchError) {
                        setError(
                            fetchError instanceof Error
                                ? fetchError.message
                                : "Unable to load online data.",
                        );
                    }
                }}
            >
                Fetch data
            </button>

            <div className="mt-5">
                <h2 className="font-bold text-white text-l pb-1">Results:</h2>
                {error && (
                    <p className="text-red-400" role="alert">
                        {error}
                    </p>
                )}
                <pre className="bg-gray-100 p-4 rounded">
                    {JSON.stringify(diffs, null, 2)}
                </pre>
            </div>
        </div>
    );
};

export default Online;
