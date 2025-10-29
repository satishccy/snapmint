import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";

const router: Router = Router();

router.post("/admin-login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      return res.status(500).json({ error: "Admin credentials not configured" });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "JWT_SECRET not configured" });
    }

    const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Set cookie
    res.cookie("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Also return token for Bearer header usage
    return res.json({ token });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

