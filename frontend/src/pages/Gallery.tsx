import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/card";
import { Camera, Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useWallet, useNetwork } from "@txnlab/use-wallet-react";
import { AssetFactory, Network } from "arcraft";
import { printRequestApi, PrintRequest } from "@/lib/api";
import { PrintStatusCard } from "@/components/PrintStatusCard";

interface Photo {
  id: number;
  image_url: string;
  name: string;
  loading?: boolean;
}

export default function Gallery() {
  const { activeAddress, algodClient } = useWallet();
  const { activeNetwork } = useNetwork();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalAssets, setTotalAssets] = useState(0);
  const [printRequest, setPrintRequest] = useState<PrintRequest | null>(null);
  const [loadingPrintRequest, setLoadingPrintRequest] = useState(false);
  const [printRequestImage, setPrintRequestImage] = useState<string>("");
  const [printRequestTitle, setPrintRequestTitle] = useState<string>("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    // Reset cancellation flag
    cancelledRef.current = false;

    setLoading(true);
    setPhotos([]);
    setTotalAssets(0);
    fetchPhotos();
    fetchPrintRequest();

    // Cleanup function to cancel ongoing operations
    return () => {
      cancelledRef.current = true;
    };
  }, [activeAddress]);

  const fetchPrintRequest = async () => {
    if (!activeAddress) return;

    setLoadingPrintRequest(true);
    try {
      const request = await printRequestApi.check(activeAddress);
      setPrintRequest(request);

      // Fetch asset image and title
      if (request) {
        try {
          const assetIns = await AssetFactory.fromId(
            Number(request.asset_id),
            activeNetwork as Network
          );

          if ("getImageUrl" in assetIns) {
            setPrintRequestImage(assetIns.getImageUrl());
            setPrintRequestTitle(assetIns.getName());
          }
        } catch (error) {
          console.error(`Failed to fetch asset ${request.asset_id}:`, error);
        }
      }
    } catch (error) {
      // If 404, no request exists - that's fine
      setPrintRequest(null);
      setPrintRequestImage("");
      setPrintRequestTitle("");
    } finally {
      setLoadingPrintRequest(false);
    }
  };

  const fetchPhotos = async () => {
    try {
      if (!activeAddress || !algodClient) {
        if (!cancelledRef.current) {
          toast.error("Please connect your wallet to view your photo book");
          setLoading(false);
        }
        return;
      }

      const assets = await algodClient.accountInformation(activeAddress).do();

      // Check if cancelled before proceeding
      if (cancelledRef.current) return;

      const assetCount = assets.createdAssets.length;

      if (!cancelledRef.current) {
        setTotalAssets(assetCount);
      }

      if (assetCount === 0) {
        if (!cancelledRef.current) {
          setLoading(false);
        }
        return;
      }

      // Initialize with loading placeholders
      const loadingPhotos: Photo[] = Array.from(
        { length: assetCount },
        (_, i) => ({
          id: Number(assets.createdAssets[i].index),
          image_url: "",
          name: "",
          loading: true,
        })
      );

      if (!cancelledRef.current) {
        setPhotos(loadingPhotos);
        setLoading(false);
      }

      // Load each asset incrementally
      let batchUpdate: Photo[] = [...loadingPhotos];
      let startTimestamp = Date.now();
      for (let i = 0; i < assetCount; i++) {
        // Check cancellation flag before each iteration
        if (cancelledRef.current) return;

        try {
          const asset = assets.createdAssets[i];
          const assetId = Number(asset.index);
          const assetIns = await AssetFactory.fromId(
            assetId,
            activeNetwork as Network
          );

          // Check again after async operation
          if (cancelledRef.current) return;

          let image_url = "";
          if ("getImageUrl" in assetIns) {
            image_url = assetIns.getImageUrl();
          } else {
            batchUpdate = batchUpdate.filter((p) => p.id !== assetId);
            continue;
          }

          const loadedPhoto: Photo = {
            id: assetId,
            image_url: image_url,
            name: assetIns.getName(),
            loading: false,
          };

          // Update photos array incrementally
          batchUpdate = batchUpdate.map((p) =>
            p.id === assetId ? loadedPhoto : p
          );
        } catch (error) {
          const assetId = Number(assets.createdAssets[i].index);
          console.error(`Failed to load asset ${assetId}:`, error);
          // Remove failed asset from list
          batchUpdate = batchUpdate.filter((p) => p.id !== assetId);
        }

        if (Date.now() - startTimestamp > 2000 || i === assetCount - 1) {
          // Only update state if not cancelled
          if (!cancelledRef.current) {
            setPhotos(batchUpdate);
            setTotalAssets(batchUpdate.length);
          }
          startTimestamp = Date.now();
        }
      }
    } catch (error: any) {
      // Only show error and update state if not cancelled
      if (!cancelledRef.current) {
        toast.error("Failed to load photos");
        setLoading(false);
      }
    }
  };

  const handlePhotoClick = (photoId: number) => {
    navigate(`/photo/${photoId}`);
  };

  const PhotoSkeleton = () => (
    <Card className="relative overflow-hidden">
      <div className="aspect-square relative overflow-hidden">
        <Skeleton className="w-full h-full rounded-none" />
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    </Card>
  );

  const hasPhotos = photos.length > 0;
  const hasLoadedPhotos = photos.every((p) => p.loading === false);
  const isLoading = loading || (totalAssets > 0 && !hasLoadedPhotos);

  return (
    <Layout>
      <div className="container py-8 px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Photo Book</h1>
          <p className="text-muted-foreground">
            Your collection of captured moments and minted memories
          </p>
        </div>

        {/* Print Request Section */}
        {activeAddress && (printRequest || loadingPrintRequest) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Your Print Request</h2>
            {loadingPrintRequest ? (
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-muted-foreground">
                    Loading print request...
                  </span>
                </div>
              </Card>
            ) : printRequest ? (
              <PrintStatusCard
                printRequest={printRequest}
                imageUrl={printRequestImage}
                title={printRequestTitle}
                showWalletPrefix={true}
              />
            ) : null}
          </div>
        )}

        {totalAssets > 0 && isLoading && (
          <div className="my-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>
              Loading {photos.filter((p) => !p.loading).length} of {totalAssets}{" "}
              assets...
            </span>
          </div>
        )}

        {!hasPhotos && !loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted rounded-full p-8 mb-6">
              <Camera className="h-16 w-16 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Start capturing moments and building your photo book collection
            </p>
            <Button
              onClick={() => navigate("/capture")}
              className="rounded-full"
            >
              <Camera className="h-4 w-4 mr-2" />
              Capture Your First Photo
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo) =>
              photo.loading ? (
                <PhotoSkeleton key={photo.id} />
              ) : (
                <Card
                  key={photo.id}
                  className="group relative overflow-hidden cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-card hover:shadow-glow animate-in fade-in duration-300"
                  onClick={() => handlePhotoClick(photo.id)}
                >
                  <div className="aspect-square relative">
                    <img
                      src={photo.image_url}
                      alt={photo.name}
                      className="w-full h-full object-cover transition-opacity duration-300"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = "1";
                      }}
                      style={{ opacity: 0 }}
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <p className="text-white text-sm font-medium truncate">
                        {photo.name}
                      </p>
                    </div>
                  </div>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
