import { Router, Request, Response } from "express";
import { PrismaClient, PrintRequestStatus } from "@prisma/client";
import { authenticateAdmin, AuthRequest } from "../middleware/auth";

const router: Router = Router();
const prisma = new PrismaClient();

// POST /print-request - Create a new print request
router.post("/print-request", async (req: Request, res: Response) => {
  try {
    const { wallet_address, asset_id } = req.body;

    if (!wallet_address || !asset_id) {
      return res.status(400).json({
        error: "wallet_address and asset_id are required",
      });
    }

    // Check if wallet already has a print request
    const existingRequest = await prisma.printRequest.findFirst({
      where: {
        wallet_address: wallet_address,
      },
    });

    if (existingRequest) {
      return res.status(409).json({
        error: "Wallet address already has a print request",
        printRequest: existingRequest,
      });
    }

    // Create new print request
    const printRequest = await prisma.printRequest.create({
      data: {
        wallet_address,
        asset_id: String(asset_id),
        status: PrintRequestStatus.pending,
      },
    });

    return res.status(201).json(printRequest);
  } catch (error) {
    console.error("Create print request error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /check-print-request/:wallet-address - Check if wallet has a print request
router.get(
  "/check-print-request/:wallet_address",
  async (req: Request, res: Response) => {
    try {
      const { wallet_address } = req.params;

      const printRequest = await prisma.printRequest.findFirst({
        where: {
          wallet_address: wallet_address,
        },
      });

      if (!printRequest) {
        return res.status(404).json({ error: "No print request found" });
      }

      return res.json(printRequest);
    } catch (error) {
      console.error("Check print request error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// GET /print-request - Get all print requests (public, no auth required for PhotoBooth)
router.get("/print-request", async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;

    if (page < 1) {
      return res.status(400).json({ error: "Page must be greater than 0" });
    }

    if (limit < 1 || limit > 50) {
      return res.status(400).json({ error: "Limit must be between 1 and 100" });
    }

    const [printRequests, total] = await Promise.all([
      prisma.printRequest.findMany({
        skip,
        take: limit,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.printRequest.count(),
    ]);

    return res.json({
      data: printRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get print requests error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /admin/print-request - Get all print requests (admin only, with pagination and status filter)
router.get(
  "/admin/print-request",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;
      const status = req.query.status as string | undefined;

      // Build where clause
      const where: any = {};
      if (status && status !== "all") {
        const validStatuses: PrintRequestStatus[] = [
          PrintRequestStatus.pending,
          PrintRequestStatus.in_progress,
          PrintRequestStatus.completed,
          PrintRequestStatus.collected,
        ];
        if (validStatuses.includes(status as PrintRequestStatus)) {
          where.status = status as PrintRequestStatus;
        }
      }

      const [printRequests, total] = await Promise.all([
        prisma.printRequest.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            created_at: "asc",
          },
        }),
        prisma.printRequest.count({ where }),
      ]);

      return res.json({
        data: printRequests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Get print requests error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

// PATCH /print-request/:id - Update print request status (admin only)
router.patch(
  "/print-request/:id",
  authenticateAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ error: "status is required" });
      }

      // Convert id to number
      const idNum = parseInt(id, 10);
      if (isNaN(idNum)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }

      // Validate status
      const validStatuses: PrintRequestStatus[] = [
        PrintRequestStatus.pending,
        PrintRequestStatus.in_progress,
        PrintRequestStatus.completed,
        PrintRequestStatus.collected,
      ];

      if (!validStatuses.includes(status as PrintRequestStatus)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      const printRequest = await prisma.printRequest.update({
        where: { id: idNum },
        data: { status: status as PrintRequestStatus },
      });

      return res.json(printRequest);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Record to update does not exist")) {
        return res.status(404).json({ error: "Print request not found" });
      }
      console.error("Update print request error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
);

export default router;

