import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { authenticateAdmin, AuthRequest } from "../middleware/auth";

const router: Router = Router();
const prisma = new PrismaClient();

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

// GET /admin/settings - Get current settings
router.get(
  "/admin/settings",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      // Get or create default settings
      let settings = await prisma.settings.findFirst();

      if (!settings) {
        // Initialize default settings if none exist
        settings = await prisma.settings.create({
          data: {
            is_paused: false,
            max_print_requests: 100,
          },
        });
      }

      // Get current print request count
      const currentCount = await prisma.printRequest.count();

      return res.json({
        ...settings,
        current_count: currentCount,
      });
    } catch (error) {
      console.error("Get settings error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /admin/settings - Update settings
router.patch(
  "/admin/settings",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { is_paused, max_print_requests } = req.body;

      // Validate max_print_requests if provided
      if (max_print_requests !== undefined) {
        if (
          typeof max_print_requests !== "number" ||
          max_print_requests < 1
        ) {
          return res.status(400).json({
            error: "max_print_requests must be a positive number",
          });
        }
      }

      // Get or create default settings
      let settings = await prisma.settings.findFirst();

      if (!settings) {
        // Initialize default settings if none exist
        settings = await prisma.settings.create({
          data: {
            is_paused: false,
            max_print_requests: 100,
          },
        });
      }

      // Update settings
      const updateData: any = {};
      if (is_paused !== undefined) {
        updateData.is_paused = Boolean(is_paused);
      }
      if (max_print_requests !== undefined) {
        updateData.max_print_requests = max_print_requests;
      }

      const updatedSettings = await prisma.settings.update({
        where: { id: settings.id },
        data: updateData,
      });

      // Get current print request count
      const currentCount = await prisma.printRequest.count();

      return res.json({
        ...updatedSettings,
        current_count: currentCount,
      });
    } catch (error) {
      console.error("Update settings error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

