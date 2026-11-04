import express from "express";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { createServer } from "http";
import { WebSocketServer } from "ws";

dotenv.config();

const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://frc-scouting-example-default-rtdb.firebaseio.com",
});

const db = admin.firestore();
const rt = admin.database();

const wss = new WebSocketServer({ noServer: true });
const app = express();
const server = createServer(app);
const router = express.Router();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
    if (process.env.VERCEL == "Yes") {
        res.setHeader(
            "Access-Control-Allow-Origin",
            "https://3464scouting.vercel.app",
        );
    } else {
        res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
    }
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,DELETE,OPTIONS",
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    );

    // Handle the preflight request
    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }
    next();
});

async function sha256(message) {
    // Encode the message as a Uint8Array (UTF-8 is standard)
    const msgBuffer = new TextEncoder().encode(message);

    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);

    // Convert the ArrayBuffer to a hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray
        .map((b) => ("00" + b.toString(16)).slice(-2))
        .join("");

    return hashHex;
}

const read = async (req, res) => {
    const { path } = req.body;
    try {
        if (!path) {
            return res.status(400).send("Missing required fields");
        }
        const pathSegments = path.split("/");
        const docRef = db.doc(pathSegments.join("/"));
        const snapshot = await docRef.get();

        if (!snapshot.exists) {
            return res.status(404).send("Document not found");
        }
        console.log(snapshot.data());
        res.json(snapshot.data());
    } catch (error) {
        console.error(error);
        res.status(500).send(`Error: ${error.message}`);
    }
};

const write = async (req, res) => {
    console.log(req.body);
    try {
        const { path, data } = req.body;

        if (!path || !data) {
            return res.status(400).send("Missing required fields");
        }

        const pathSegments = path.split("/");
        const docRef = db.doc(pathSegments.join("/"));
        await docRef.set(data, { merge: true });

        res.send("Data written successfully");
    } catch (error) {
        console.error(`Error writing data: ${error.message}`);
        res.status(500).send(`Error: ${error.message}`);
    }
};

router.get("/debug", async (req, res) => {
    res.status(200).json({
        value: "kCZzMoX7NPVmlMjX0YwMp4vuIqu1,zY5Zn05MWhQkC0Sd7sbdo1YznzJ2,991NdYIx3uYQeJwThPJh0EQ6opg2",
    });
});

router.post("/time", async (req, res) => {
    const r = rt.ref("online/" + req.body.message);
    r.set({
        time: Math.floor(new Date().getTime() / 1000),
    });
});
router.post("/write", write);

router.post("/read", read);

router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).send("Email and password are required");
        }

        const userRecord = await admin.auth().getUserByEmail(email);

        const identifier = userRecord.displayName || userRecord.uid;

        const docRef = db.doc(`auth/${identifier}`);
        const snapshot = await docRef.get();

        const storedHash = snapshot.exists
            ? snapshot.data()?.hashed
            : undefined;
        const passwordHash = await sha256(password);

        if (
            typeof storedHash === "string" &&
            passwordHash === storedHash
        ) {
            res.status(200).json({
                message: "Login successful",
                uid: userRecord.uid,
                email: userRecord.email,
                name: userRecord.displayName,
            });
        } else {
            res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (error) {
        console.error("Login Error:", error);
        if (error.code === "auth/user-not-found") {
            return res
                .status(401)
                .json({ message: "Invalid email or password" });
        }
        res.status(500).send(`Error: ${error.message}`);
    }
});

router.post("/register", async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            typeof name !== "string" ||
            !email.trim() ||
            !name.trim() ||
            !password
        ) {
            return res
                .status(400)
                .json({ message: "Name, email, and password are required" });
        }

        const userRecord = await admin.auth().createUser({
            email: email.trim(),
            password,
            displayName: name.trim(),
        });

        try {
            await db.doc(`auth/${userRecord.displayName}`).set({
                hashed: await sha256(password),
            });
        } catch (error) {
            await admin.auth().deleteUser(userRecord.uid);
            throw error;
        }

        res.status(201).json({
            message: "User created successfully",
            uid: userRecord.uid,
            email: userRecord.email,
            name: userRecord.displayName,
        });
    } catch (error) {
        console.error(error);
        if (error.code === "auth/email-already-exists") {
            return res.status(400).json({ message: "Email already in use" });
        }
        if (error.code === "auth/invalid-email") {
            return res.status(400).json({ message: "Invalid email address" });
        }
        if (error.code === "auth/weak-password") {
            return res.status(400).json({ message: "Password is too weak" });
        }
        res.status(500).json({ message: `Error: ${error.message}` });
    }
});
router.post("/readRt", async (req, res) => {
    const ref = rt.ref(req.body.path);
    ref.once("value", (snapshot) => {
        res.json({ value: snapshot.val() });
        console.log(snapshot.val());
        return;
    }).catch((error) => {
        console.error("Error fetching data:", error);
        res.json({ value: "error" });
    });
});

app.use("/api", router); // floyd

server.listen(PORT, () => {
    console.log(`currently running on ${PORT}`);
});
