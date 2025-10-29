import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { printRequestApi, PrintRequest, PaginatedResponse } from "@/lib/api";
import { Network, AssetFactory } from "arcraft";
import { PrintStatusCard } from "@/components/PrintStatusCard";
import { useNetwork } from "@txnlab/use-wallet-react";

interface PrintRequestWithMetadata extends PrintRequest {
  photos?: {
    image_url: string;
    title: string;
  };
  profiles?: {
    username: string;
  };
}

export default function PhotoBooth() {
  const { activeNetwork } = useNetwork();
  const [requests, setRequests] = useState<PrintRequestWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchPrintRequests();
  }, [page]);

  const fetchPrintRequests = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<PrintRequest> =
        await printRequestApi.getAll(page, limit);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);

      // Fetch metadata for each asset (optional - can be done lazily)
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
            },
          };
        })
      );

      setRequests(requestsWithMetadata);
    } catch (error) {
      toast.error("Failed to load print requests");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 flex justify-center">
          <div className="animate-pulse">Loading Photo Booth...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Photo Booth</h1>
          <p className="text-muted-foreground">
            Track your print requests and see what others are printing
          </p>
          {total > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              Showing {requests.length} of {total} requests
            </p>
          )}
        </div>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted rounded-full p-8 mb-6">
              <Printer className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Print Requests Yet</h2>
            <p className="text-muted-foreground max-w-sm">
              Print requests will appear here once users send their NFTs to the
              Photo Booth
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {requests.map((request) => (
              <PrintStatusCard
                key={request.id}
                printRequest={request}
                imageUrl={request.photos?.image_url}
                title={request.photos?.title}
                showWalletPrefix={true}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    disabled={loading}
                    className="min-w-[2.5rem]"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
