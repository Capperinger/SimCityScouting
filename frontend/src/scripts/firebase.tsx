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

async function writeData(path: string, data: unknown) {
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
            alert(
                `Firebase could not save your data (${response.status})${responseBody ? `: ${responseBody}` : ""}`,
            );
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
        alert(
            `Firebase did not confirm saving your data${err instanceof Error ? `: ${err.message}` : ". Please check your connection and try again."}`,
        );
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
