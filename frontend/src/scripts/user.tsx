const REMEMBERED_LOGIN_KEY = "sim-scouting-remembered-login";
const LOGIN_SESSION_DAYS = 7;

export interface RememberedLogin {
    name: string;
    uid: string;
    expiresAt: number;
}

export function generateCookie(
    name: string,
    value: string | null,
    days: number,
) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
export function readCookie(name: string) {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
}
export function deleteCookie(name: string) {
    const expirationDate = new Date(0).toUTCString();
    const cookieString = `${name}=; expires=${expirationDate}`;
    document.cookie = `${cookieString}; path=/`;
}

export function rememberLogin(name: string, uid: string) {
    const rememberedLogin: RememberedLogin = {
        name,
        uid,
        expiresAt: Date.now() + LOGIN_SESSION_DAYS * 24 * 60 * 60 * 1000,
    };

    try {
        localStorage.setItem(
            REMEMBERED_LOGIN_KEY,
            JSON.stringify(rememberedLogin),
        );
    } catch (error) {
        console.error("Unable to save the offline sign-in session:", error);
    }
}

export function getRememberedLogin(): RememberedLogin | null {
    let value: string | null;
    try {
        value = localStorage.getItem(REMEMBERED_LOGIN_KEY);
    } catch (error) {
        console.error("Unable to read the offline sign-in session:", error);
        return null;
    }

    if (!value) {
        return null;
    }

    try {
        const session: unknown = JSON.parse(value);
        if (
            typeof session === "object" &&
            session !== null &&
            "name" in session &&
            typeof session.name === "string" &&
            "uid" in session &&
            typeof session.uid === "string" &&
            "expiresAt" in session &&
            typeof session.expiresAt === "number" &&
            session.expiresAt > Date.now()
        ) {
            return session as RememberedLogin;
        }
    } catch {
        // Remove a malformed saved session below.
    }

    clearRememberedLogin();
    return null;
}

export function continueRememberedLogin(): RememberedLogin | null {
    const session = getRememberedLogin();
    if (!session) {
        return null;
    }

    const remainingDays =
        (session.expiresAt - Date.now()) / (24 * 60 * 60 * 1000);
    generateCookie("user", session.name, remainingDays);
    generateCookie("uid", session.uid, remainingDays);
    return session;
}

export function clearRememberedLogin() {
    try {
        localStorage.removeItem(REMEMBERED_LOGIN_KEY);
    } catch (error) {
        console.error("Unable to clear the offline sign-in session:", error);
    }
}
