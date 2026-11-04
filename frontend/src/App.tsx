import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MatchForm from "./pages/MatchForm";
import LocalStorageView from "./pages/LocalStored";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import PitScoutingForm from "./pages/pitScoutingForm";
import Online from "./pages/online";

function App() {
    return (
        <BrowserRouter>
            {/* Make flex column for sticky footer */}
            <div className="flex min-h-screen flex-col w-full">
                {/* Main content grows to fill screen */}
                <div className="flex grow justify-center mb-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/match" element={<MatchForm />} />
                        <Route path="/stored" element={<LocalStorageView />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/signup" element={<SignupPage />} />
                        <Route
                            path="/pitScouting"
                            element={<PitScoutingForm />}
                        />
                        <Route path="/online" element={<Online />} />
                    </Routes>
                </div>
            </div>
        </BrowserRouter>
    );
}

export default App;
