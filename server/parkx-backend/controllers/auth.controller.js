import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const username = String(req.body.username || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    console.log("[ParkX BE][Auth] registerUser called", { username, email });

    if (!username || !email || !password) {
      return res.status(400).json({ message: "username, email and password are required" });
    }

    const existingUser = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existingUser.rows.length) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (username, email, password) VALUES ($1,$2,$3) RETURNING id, username, email",
      [username, email, hashed]
    );

    const user = result.rows[0];
    const jwtSecret = process.env.JWT_SECRET || "SECRET_KEY";
    const token = jwt.sign({ id: user.id, userId: user.id }, jwtSecret, {
      expiresIn: "1d",
    });

    res.status(201).json({
      message: "User registered",
      data: {
        token,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        }
      }
    });
    console.log("[ParkX BE][Auth] registerUser success", { userId: user.id, email: user.email });
  } catch (err) {
    console.error("[ParkX BE][Auth] registerUser failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    console.log("[ParkX BE][Auth] loginUser called", { email });

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (!result.rows.length)
      return res.status(400).json({ message: "User not found" });

    const user = result.rows[0];

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ message: "Wrong password" });

    const jwtSecret = process.env.JWT_SECRET || "SECRET_KEY";
    const token = jwt.sign({ id: user.id, userId: user.id }, jwtSecret, {
      expiresIn: "1d",
    });

    res.json({
      data: {
        token,
        userId: user.id,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
    });
    console.log("[ParkX BE][Auth] loginUser success", { userId: user.id, email: user.email });
  } catch (err) {
    console.error("[ParkX BE][Auth] loginUser failed", err?.message || err);
    res.status(500).json({ error: err.message });
  }
};
