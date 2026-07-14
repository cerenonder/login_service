require("dotenv").config();
const express=require("express");
const db = require("./db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();

app.use(express.json());

const PORT = 3002;

app.get("/", (req, res) => {
    res.send("Hello World!");
});
app.post("/register", async(req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
    "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
    [username, email, hashedPassword],
    (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }

        res.send("User registered successfully");
    }
);
});
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        async (err, result) => {
            if (err) {
                return res.status(500).send("Server error");
            }

            if (result.length === 0) {
                return res.status(401).send("Invalid email or password");
            }

            const user = result[0];

            const passwordMatch = await bcrypt.compare(
                password,
                user.password
            );

            if (!passwordMatch) {
                return res.status(401).send("Invalid email or password");
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            res.json({ token });
        }
    );
});
app.get("/profile", (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).send("Access denied. No token provided.");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).send("Access denied. Invalid header.");
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send("Invalid token");
        }

        res.json(decoded);
    });
});
app.listen(PORT, () => {
    console.log("Server is running...");
});