import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    readCookie,
    deleteCookie,
    generateCookie,
    clearRememberedLogin,
    isDataProtectionEnabled,
} from "../scripts/user";
import { debug } from "../scripts/debug";
import BinaryChoice from "../components/BinaryChoice";

const Home: React.FC = () => {
    const [advanced, setAdvanced] = useState<boolean>(
        isDataProtectionEnabled(),
    );
    const navigate = useNavigate();
    const userName = readCookie("user");
    const signedIn = userName !== undefined;
    const nameCSS =
        userName === "Dev" ||
        userName === "sam meng" ||
        userName === "testUser"
            ? "gradient-sam text-transparent animate-gradient"
            : userName === "Estiaan K"
              ? "gradient-gold text-transparent animate-gradient"
              : userName === "Daniel Senchukov"
                ? "gradient-red text-transparent animate-quick"
                : "text-white underline";

    const goToMatchForm = () => navigate("/match");
    const goToLocalStorage = () => {
        navigate("/stored");
    };
    const goToPitScoutingForm = () => {
        navigate("/pitscouting");
    };
    const signOut = () => {
        clearRememberedLogin();
        deleteCookie("user");
        deleteCookie("uid");
        navigate("/login");
    };
    useEffect(() => {
        if (userName == undefined) {
            navigate("/login");
        }
    }, [navigate, userName]);
    
    return (
        <div className="flex flex-col items-center justify-center space-y-6 w-full">
            <h1 className="font-bold text-white text-4xl underline text-center flex flex-row">
                {userName === undefined
                    ? "Welcome to Sim-Scouting!"
                    : "Welcome to Sim-Scouting, " + '\u00A0'    
                }            
                <div className={nameCSS}>
                    {" " + userName}
                </div>

            </h1>

            <div>
                {debug && (
                    <p className="font-small text-red-500 text-2xl px-4 py-3 rounded-2xl text-center">
                        Advanced user detected
                        <br></br>
                        Online Users tab can be found
                        <br></br>
                        Seeder (adds random data) in localstorage
                    </p>
                )}
            </div>

            <button
                className="bg-sky-600 font-medium text-white text-3xl px-4 py-3 rounded-2xl hover:bg-sky-700 transition-colors"
                onClick={goToMatchForm}
            >
                Scout!
            </button>
            <button
                className="bg-green-600 font-medium text-white text-3xl px-4 py-3 rounded-2xl hover:bg-green-700 transition-colors"
                onClick={goToLocalStorage}
            >
                View Local Data
            </button>
            <button
                className="bg-rose-600 font-medium text-white text-3xl px-4 py-3 rounded-2xl hover:bg-rose-700 transition-colors"
                onClick={goToPitScoutingForm}
            >
                Pit scouting
            </button>
            {debug && (
                <button 
                    className="bg-red-600 font-medium text-white text-3xl px-4 py-3 rounded-2xl hover:bg-red-700 transition-colors"
                    onClick={() => {window.location.href="/online"}}
                >Online Users</button>
            )}
            {signedIn && (
                <button
                    className="bg-slate-600 font-medium text-white text-3xl px-4 py-3 rounded-2xl hover:bg-slate-700 transition-colors"
                    onClick={signOut}
                >
                    Sign out
                </button>
            )}
            <div>
                <BinaryChoice
                    label={"Data protect"}
                    options={["yes", "no"]}
                    value={advanced}
                    onChange={(e) => {
                        setAdvanced(e);
                        generateCookie("fih", `${e}`, 7);
                    }}
                />
            </div>
        </div>
    );
};

export default Home;
