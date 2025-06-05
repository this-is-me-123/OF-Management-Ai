import express from "express";
import jwt from "jsonwebtoken";

const router = express.Router();
const USER = { username: "admin", password: "password" };

router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === USER.username && password === USER.password) {
    const token = jwt.sign({ username }, "supersecret", { expiresIn: "1h" });
    return res.json({ token });
  }
  res.status(401).json({ error: "Invalid credentials" });
});

export default router;