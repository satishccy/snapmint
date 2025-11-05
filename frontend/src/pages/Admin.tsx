import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { printRequestApi, PrintRequest, getAdminToken } from "@/lib/api";
import { Network, AssetFactory } from "arcraft";
import { useNetwork } from "@txnlab/use-wallet-react";
import { Download, Loader2 } from "lucide-react";
import { downloadImageAsPDF } from "@/lib/pdfUtils";

interface PrintRequestWithMetadata extends PrintRequest {
  photos?: {
    image_url: string;
    title: string;
  };
  profiles?: {
    username: string;
    email: string;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const { activeNetwork } = useNetwork();
  const [requests, setRequests] = useState<PrintRequestWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloadingIds, setDownloadingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchPrintRequests();
    }
  }, [isAdmin, statusFilter]);

  const checkAdminAccess = async () => {
    try {
      const token = getAdminToken();
      if (!token) {
        navigate("/admin-auth");
        return;
      }
      setIsAdmin(true);
    } catch (error) {
      navigate("/admin-auth");
    }
  };

  const fetchPrintRequests = async () => {
    try {
      setLoading(true);
      const response = await printRequestApi.getAllAdmin(1, 100, statusFilter);

      // Fetch metadata for each asset client-side
      const requestsWithMetadata = await Promise.all(
        response.data.map(async (request) => {
          try {
            const assetIns = await AssetFactory.fromId(
              Number(request.asset_id),
              activeNetwork as Network
            );

            if ("getImageUrl" in assetIns) {
              return {
                ...request,
                photos: {
                  image_url: assetIns.getImageUrl(),
                  title: assetIns.getName(),
                },
                profiles: {
                  username: request.wallet_address.slice(0, 8) + "...",
                  email: request.wallet_address,
                },
              };
            }
          } catch (error) {
            console.error(
              `Failed to fetch metadata for asset ${request.asset_id}:`,
              error
            );
          }

          return {
            ...request,
            photos: {
              image_url: "",
              title: `Asset #${request.asset_id}`,
            },
            profiles: {
              username: request.wallet_address.slice(0, 8) + "...",
              email: request.wallet_address,
            },
          };
        })
      );

      setRequests(requestsWithMetadata);
    } catch (error: any) {
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("No admin token")
      ) {
        toast.error("Please login as admin");
        navigate("/admin-auth");
      } else {
        toast.error("Failed to load print requests");
      }
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (id: number, newStatus: string) => {
    try {
      await printRequestApi.updateStatus(
        id,
        newStatus as PrintRequest["status"]
      );
      toast.success("Status updated successfully");
      // Refresh the list
      await fetchPrintRequests();
    } catch (error: any) {
      if (
        error.message.includes("Unauthorized") ||
        error.message.includes("No admin token")
      ) {
        toast.error("Please login as admin");
        navigate("/admin-auth");
      } else {
        toast.error(error.message || "Failed to update status");
      }
    }
  };

  const handleDownloadPDF = async (
    request: PrintRequestWithMetadata
  ) => {
    if (!request.photos?.image_url) {
      toast.error("Image not available for download");
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(request.id));
    try {
      await downloadImageAsPDF(
        request.photos.image_url,
        `print-request-${request.id}-${request.photos.title || request.asset_id}`
      );
      toast.success("PDF downloaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to download PDF");
    } finally {
      setDownloadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(request.id);
        return newSet;
      });
    }
  };

  const getStatusActions = (request: PrintRequestWithMetadata) => {
    const statuses: PrintRequest["status"][] = [
      "pending",
      "in_progress",
      "completed",
      "collected",
    ];

    return (
      <Select
        value={request.status}
        onValueChange={(value) =>
          updateRequestStatus(request.id, value as PrintRequest["status"])
        }
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((status) => (
            <SelectItem key={status} value={status}>
              {status.replace("_", " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed":
        return "bg-primary/10 text-primary border-primary/20";
      case "collected":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "";
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <div className="animate-pulse">Loading admin panel...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">
            Manage print requests and fulfillment
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Filter by Status:
          </label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="collected">Collected</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            Showing {requests.length} request{requests.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead className="w-[120px]">Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Wallet Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[250px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No print requests found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow
                    key={request.id}
                    className={
                      request.status === "collected" ? "opacity-60" : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {request.id}
                    </TableCell>
                    <TableCell>
                      {request.photos?.image_url ? (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border">
                          <img
                            src={request.photos.image_url}
                            alt={request.photos.title || `Asset #${request.asset_id}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                          No Image
                        </div>
                      )}
                    </TableCell>
                    <TableCell><h3 className="font-semibold truncate text-sm sm:text-base">
                      {request.photos?.title || `Asset #${request.asset_id}`}
                    </h3></TableCell>

                    <TableCell>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {request.wallet_address}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusBadgeColor(request.status)}
                      >
                        {request.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusActions(request)}
                        {request.photos?.image_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadPDF(request)}
                            disabled={downloadingIds.has(request.id)}
                            title="Download as PDF"
                          >
                            {downloadingIds.has(request.id) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-4 w-4 mr-1" />
                                PDF
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
