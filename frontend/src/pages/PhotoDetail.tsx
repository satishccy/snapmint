import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Network, AssetFactory } from "arcraft";
import { useNetwork } from "@txnlab/use-wallet-react";
import { useWallet } from "@txnlab/use-wallet-react";
import { WalletConnectButton } from "@/components/WalletConnectButton";
import { printRequestApi, PrintRequest } from "@/lib/api";
import { PrintStatusCard } from "@/components/PrintStatusCard";

interface Photo {
  id: string;
  image_url: string;
  title: string;
  description: string;
}

function getStatusText(
  status: "pending" | "in_progress" | "completed" | "collected"
): string {
  if (status === "pending")
    return "Your T‑shirt print request is queued. You’ll be notified when printing starts.";
  if (status === "in_progress")
    return "Your T‑shirt is currently being printed. Hang tight.";
  if (status === "completed")
    return "Your T‑shirt print is complete and ready for pickup.";
  if (status === "collected") return "T‑shirt collected. Thanks!";
}

export default function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const { activeNetwork } = useNetwork();
  const { activeAddress } = useWallet();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [existingPrintRequest, setExistingPrintRequest] =
    useState<PrintRequest | null>(null);
  const [checkingPrintRequest, setCheckingPrintRequest] = useState(false);
  const [printRequestImage, setPrintRequestImage] = useState<string>("");
  const [printRequestTitle, setPrintRequestTitle] = useState<string>("");

  useEffect(() => {
    fetchPhoto();
  }, [id]);

  useEffect(() => {
    if (activeAddress) {
      checkPrintRequest();
    }
  }, [activeAddress]);

  const fetchPhoto = async () => {
    try {
      if (!activeAddress) {
        toast.error("Please connect your wallet to view this photo");
        return;
      }
      const assetIns = await AssetFactory.fromId(
        Number(id),
        activeNetwork as Network
      );

      if ("getImageUrl" in assetIns) {
        setPhoto({
          id: id,
          image_url: assetIns.getImageUrl(),
          title: assetIns.getName(),
          description:
            assetIns.metadata?.description ||
            assetIns.metadata?.properties?.description ||
            "",
        });
      } else {
        toast.error("Failed to load photo");
      }
    } catch (error) {
      toast.error("Failed to load photo");
      navigate("/gallery");
    } finally {
      setLoading(false);
    }
  };

  const checkPrintRequest = async () => {
    if (!activeAddress) return;

    setCheckingPrintRequest(true);
    try {
      const request = await printRequestApi.check(activeAddress);
      setExistingPrintRequest(request);

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
      setExistingPrintRequest(null);
      setPrintRequestImage("");
      setPrintRequestTitle("");
    } finally {
      setCheckingPrintRequest(false);
    }
  };

  const handleSendToBooth = async () => {
    if (!photo || !activeAddress || !id) return;

    setSending(true);
    try {
      await printRequestApi.create(activeAddress, Number(id));
      toast.success("Photo sent to Photo Booth successfully!");
      setShowPrintConfirm(false);
      // Refresh the print request status
      await checkPrintRequest();
    } catch (error: any) {
      if (error.message.includes("already has a print request")) {
        toast.error(
          "You already have a print request. Each wallet can only submit one."
        );
        await checkPrintRequest();
      } else {
        toast.error(error.message || "Failed to send to Photo Booth");
      }
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!activeAddress) {
    return (
      <Layout>
        <div className="container max-w-4xl py-4 px-4">
          <div className="flex flex-col items-center justify-center h-96">
            <p className="text-muted-foreground mb-4">
              Please connect your wallet to view this photo
            </p>
            <WalletConnectButton />
          </div>
        </div>
      </Layout>
    );
  }

  if (!photo) {
    return (
      <Layout>
        <div className="container max-w-4xl py-4 px-4">
          <div className="flex flex-col items-center justify-center h-96">
            <p className="text-muted-foreground mb-4">Photo not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container max-w-4xl py-4 px-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="relative">
            <img
              src={photo.image_url}
              alt={photo.title}
              className="w-full max-h-[60vh] object-contain bg-black"
            />
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h1 className="text-2xl font-bold mb-2">{photo.title}</h1>
              {photo.description && (
                <p className="text-muted-foreground">{photo.description}</p>
              )}
            </div>

            {existingPrintRequest ? (
              <div className="space-y-3">
                <div className="p-2.5 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm font-medium text-center">
                    {getStatusText(existingPrintRequest.status)}
                  </p>
                </div>
                <PrintStatusCard
                  printRequest={existingPrintRequest}
                  imageUrl={printRequestImage}
                  title={printRequestTitle}
                  showWalletPrefix={true}
                />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => setShowPrintConfirm(true)}
                className="w-full rounded-full"
                disabled={checkingPrintRequest}
              >
                <Printer className="h-5 w-5 mr-2" />
                {checkingPrintRequest ? "Checking..." : "Send to Photo Booth"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Print Confirmation Modal */}
      <ConfirmationModal
        open={showPrintConfirm}
        onOpenChange={setShowPrintConfirm}
        title="Send to Photo Booth?"
        description={
          <div className="space-y-2">
            <p>
              This will reserve the <strong>one print slot</strong> for your
              account.
            </p>
            <p className="text-destructive font-medium">
              Each user may only send one NFT for printing. This action is
              final.
            </p>
            <p>Continue?</p>
          </div>
        }
        onConfirm={handleSendToBooth}
        confirmText={sending ? "Sending..." : "Yes — Send"}
        cancelText="No — Cancel"
      />
    </Layout>
  );
}
