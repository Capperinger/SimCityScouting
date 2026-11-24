import {
    generateCookie,
    readCookie,
    rememberLogin,
} from "./user";
import { log } from "./log";

const LINK = "/api";

type ScoutingData = Record<string, unknown> & {
    teamNumber?: number | string;
    matchNumber?: number | string;
};

export interface ScoutingRecordReference {
    path: string;
    type: "match" | "pit";
    teamNumber: string;
    matchNumber?: string;
}

type TeamListResponse = {   
    team?: Array<number | string>;
};

export const matchScoutingPath = (
    teamNumber: number | string,
    matchNumber: number | string,
) =>
    `match scouting/${teamNumber}/matches/${matchNumber}`;

export const pitScoutingPath = (teamNumber: number | string) =>
    `pit scouting/${teamNumber}`;

function isPositiveInteger(value: unknown): value is number | string {
    if (typeof value === "number") {
        return Number.isSafeInteger(value) && value > 0;
    }

    return (
        typeof value === "string" &&
        /^\d+$/.test(value) &&
        Number.isSafeInteger(Number(value)) &&
        Number(value) > 0
    );
}

function isScoutingData(value: unknown): value is ScoutingData {
    return (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        "teamNumber" in value
    );
}

export interface StoredScoutingSyncResult {
    submitted: number;
    failed: number;
    skipped: number;
    cleanupFailed: number;
    remaining: number;
}

let storedScoutingSyncPromise: Promise<StoredScoutingSyncResult> | null = null;

async function syncStoredScoutingDataOnce(): Promise<StoredScoutingSyncResult> {
    const result: StoredScoutingSyncResult = {
        submitted: 0,
        failed: 0,
        skipped: 0,
        cleanupFailed: 0,
        remaining: 0,
    };
    const storedKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("scoutData-") || key.startsWith("pitData-"),
    );

    for (const key of storedKeys) {
        const storedValue = localStorage.getItem(key);
        if (!storedValue) {
            result.skipped += 1;
            continue;
        }

        let data: unknown;
        try {
            data = JSON.parse(storedValue);
        } catch (error) {
            console.error(`Unable to parse saved scouting data ${key}:`, error);
            result.skipped += 1;
            continue;
        }

        if (!isScoutingData(data)) {
            console.error(`Saved scouting data ${key} is invalid and was kept.`);
            result.skipped += 1;
            continue;
        }

        const teamNumber = data.teamNumber;
        if (!isPositiveInteger(teamNumber)) {
            console.error(`Saved scouting data ${key} is invalid and was kept.`);
            result.skipped += 1;
            continue;
        }

        const isPitScouting = key.startsWith("pitData-");
        let path: string;
        if (isPitScouting) {
            path = pitScoutingPath(teamNumber);
        } else {
            const matchNumber = data.matchNumber;
            if (!isPositiveInteger(matchNumber)) {
                console.error(
                    `Saved scouting data ${key} is invalid and was kept.`,
                );
                result.skipped += 1;
                continue;
            }
            path = matchScoutingPath(teamNumber, matchNumber);
        }

        if (!(await writeData(path, data, false))) {
            result.failed += 1;
            continue;
        }

        result.submitted += 1;
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`Unable to remove saved scouting data ${key}:`, error);
            result.cleanupFailed += 1;
        }
    }

    result.remaining = Object.keys(localStorage).filter(
        (key) => key.startsWith("scoutData-") || key.startsWith("pitData-"),
    ).length;
    return result;
}

export function syncStoredScoutingData(): Promise<StoredScoutingSyncResult> {
    if (!storedScoutingSyncPromise) {
        storedScoutingSyncPromise = syncStoredScoutingDataOnce().finally(() => {
            storedScoutingSyncPromise = null;
        });
    }

    return storedScoutingSyncPromise;
}

export async function rt(path: string): Promise<unknown> {
    const response = await fetch(`${LINK}/readRt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({path,}),
    });
    if (!response.ok) {
        throw new Error(`Realtime Database read failed (${response.status}).`);
    }
    const data = await response.json();
    return data.value;
}

export async function de() {
    const uid = readCookie("uid");
    const response = await fetch(`${LINK}/debug`, {
        method: "GET",
    });
    if (!response.ok) {
        throw new Error(`Unable to load permissions (${response.status}).`);
    }
    const rawWhiteList = await response.json();

    const whiteList = rawWhiteList.value.split(",").map((s: string) => s.trim());
    return whiteList.includes(uid);
}

async function writeData(
    path: string,
    data: unknown,
    notifyUser = true,
) {
    try {
        const body = {
            path: path,
            data: data,
        };
        const response = await fetch(LINK + "/write", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        const responseBody = await response.text();
        if (!response.ok) {
            console.error(
                `Firebase write failed (${response.status}): ${responseBody}`,
            );
            if (notifyUser) {
                alert(
                    `Firebase could not save your data (${response.status})${responseBody ? `: ${responseBody}` : ""}`,
                );
            }
            return false;
        }

        let result: unknown;
        try {
            result = JSON.parse(responseBody);
        } catch {
            throw new Error(
                "The server returned an invalid response instead of confirming the Firebase write.",
            );
        }
        if (
            typeof result !== "object" ||
            result === null ||
            !("success" in result) ||
            result.success !== true ||
            !("path" in result) ||
            result.path !== path
        ) {
            throw new Error(
                "The server did not confirm that Firebase saved this data.",
            );
        }
        return true;
    } catch (err) {
        console.error("Error writing document:", err);
        if (notifyUser) {
            alert(
                `Firebase did not confirm saving your data${err instanceof Error ? `: ${err.message}` : ". Please check your connection and try again."}`,
            );
        }
        return false;
    }
}
export async function writeToDb(
    path: string,
    data: ScoutingData,
) {
    log(
        `submit data to team ${data.teamNumber} at match num ${data.matchNumber} from ${readCookie("user")}`,
    );
    return await writeData(path, data);
}
export async function readDoc(path: string): Promise<TeamListResponse> {
    try {
        const response = await fetch(LINK + "/read", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ path: path }),
        });
        // Check if the server actually responded successfully
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data: TeamListResponse = await response.json();
        return data;
    } catch (error) {
        console.error("Error reading document:", error);
        throw error;
    }
}

function isScoutingRecordReference(
    value: unknown,
): value is ScoutingRecordReference {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
        return false;
    }

    const record = value as Record<string, unknown>;
    if (
        typeof record.path !== "string" ||
        typeof record.teamNumber !== "string"
    ) {
        return false;
    }

    if (record.type === "match") {
        return (
            typeof record.matchNumber === "string" &&
            record.path ===
                matchScoutingPath(record.teamNumber, record.matchNumber)
        );
    }

    return (
        record.type === "pit" &&
        record.path === pitScoutingPath(record.teamNumber)
    );
}

export async function listScoutingRecords(): Promise<
    ScoutingRecordReference[]
> {
    const response = await fetch(`${LINK}/list`);
    if (!response.ok) {
        throw new Error(`Unable to load submitted records (${response.status}).`);
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch {
        throw new Error("The server returned an invalid records response.");
    }
    if (
        typeof payload !== "object" ||
        payload === null ||
        !("records" in payload) ||
        !Array.isArray(payload.records) ||
        !payload.records.every(isScoutingRecordReference)
    ) {
        throw new Error("The server returned an invalid records response.");
    }

    return payload.records;
}

export async function readScoutingRecord(
    path: string,
): Promise<Record<string, unknown>> {
    const response = await fetch(`${LINK}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
    });
    if (!response.ok) {
        throw new Error(`Unable to load this submitted record (${response.status}).`);
    }

    let data: unknown;
    try {
        data = await response.json();
    } catch {
        throw new Error("The server returned an invalid scouting record.");
    }
    if (
        typeof data !== "object" ||
        data === null ||
        Array.isArray(data)
    ) {
        throw new Error("The server returned an invalid scouting record.");
    }

    return data as Record<string, unknown>;
}

async function readAuthResponse(response: Response) {
    const payload: unknown = await response.json().catch(() => null);
    return typeof payload === "object" && payload !== null
        ? (payload as {
              message?: unknown;
              name?: unknown;
              uid?: unknown;
          })
        : null;
}

export async function registerUser(
    email: string,
    password: string,
    name: string,
) {
    let response: Response;
    try {
        response = await fetch(`${LINK}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, name }),
        });
    } catch {
        throw new LoginConnectionError(
            "Can't reach the sign-up service. Check your connection and try again.",
        );
    }

    const data = await readAuthResponse(response);
    if (!response.ok) {
        throw new Error(
            typeof data?.message === "string"
                ? data.message
                : `Account creation failed (server error ${response.status}).`,
        );
    }
    if (typeof data?.name !== "string" || typeof data.uid !== "string") {
        throw new Error("The sign-up service returned an invalid response.");
    }

    rememberLogin(data.name, data.uid);
    generateCookie("user", data.name, 7);
    generateCookie("uid", data.uid, 7);
    window.location.href = "/";
}

export async function loginUser(email: string, password: string) {
    let response: Response;
    try {
        response = await fetch(`${LINK}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
    } catch {
        throw new LoginConnectionError(
            "Can't reach the sign-in service. Check your connection and try again.",
        );
    }

    const data = await readAuthResponse(response);
    if (response.status === 401) {
        throw new Error("Email or password is incorrect.");
    }
    if (!response.ok) {
        throw new Error(
            typeof data?.message === "string"
                ? data.message
                : `Sign-in failed (server error ${response.status}).`,
        );
    }
    if (typeof data?.name !== "string" || typeof data.uid !== "string") {
        throw new Error("The sign-in service returned an invalid response.");
    }

    rememberLogin(data.name, data.uid);
    generateCookie("user", data.name, 7);
    generateCookie("uid", data.uid, 7);
    window.location.href = "/";
}

export class LoginConnectionError extends Error {}

export async function wsSend(message: string) {
    if (!message.trim()) {
        return;
    }

    try {
        const response = await fetch(`${LINK}/time`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ message }),
        });
        if (!response.ok) {
            throw new Error(
                `Realtime Database write failed (${response.status}).`,
            );
        }
    } catch (error) {
        console.error("Unable to update online status:", error);
    }
}
