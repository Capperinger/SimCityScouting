import {
    generateCookie,
    readCookie,
    rememberLogin,
} from "./user";
import { log } from "./log";

const LINK = import.meta.env.DEV
    ? "/api"
    : "https://3464scouting.vercel.app/api";

type ScoutingData = Record<string, unknown> & {
    teamNumber?: number | string;
    matchNumber?: number | string;
};

type TeamListResponse = {   
    team?: Array<number | string>;
};

export async function rt(path: string) {
    const response = await fetch(`${LINK}/readRt`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({path,}),
    });
    const data = await response.json()
    console.log(data.value)
    return data.value;
}

export async function de() {
    const uid = readCookie("uid");
    const response = await fetch(`${LINK}/debug`, {
        method: "GET",
    });
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
        if (!response.ok) {
            console.log(`Server error: ${response.status}`);
            return false;
        }
        return true;
    } catch (err) {
        console.error("Error writing document:", err);
        alert(
            "An error occured: your data has been saved locally but not uploaded.",
        );
        return false;
    }
}
export async function writeToDb(
    path: string,
    data: ScoutingData,
    pit: boolean = false,
) {
    log(
        `submit data to team ${data.teamNumber} at match num ${data.matchNumber} from ${readCookie("user")}`,
    );
    if (!pit) {
        const teamData = await readDoc("/datas/data");
        const teams = teamData.team;
        const teamNumber = data.teamNumber;
        if (
            teams &&
            teamNumber !== undefined &&
            !teams.includes(teamNumber)
        ) {
            log(`Add team ${teamNumber}`);
            await writeData("datas/data", {
                team: [...teams, teamNumber],
            });
        }
    }
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
        return data; // This sends the data back to whoever called readDoc()
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
    fetch(`${LINK}/time`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ message })
    });    
}
