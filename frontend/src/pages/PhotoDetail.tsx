import { useEffect, useMemo, useState } from "react";
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
import { printRequestApi, PrintRequest, BoothStatus } from "@/lib/api";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { processIpfsUrl } from "@/lib/utils";
import { PersonalPrintStatusCard } from "@/components/PersonalPrintStatusCard";

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
    return "Your T‑shirt print request is queued.";
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
  const [boothStatus, setBoothStatus] = useState<BoothStatus | null>(null);
  const [tshirtSize, setTshirtSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [loadingBoothStatus, setLoadingBoothStatus] = useState(false);

  useEffect(() => {
    fetchPhoto();
    fetchBoothStatus();
  }, [id]);

  useEffect(() => {
    if (activeAddress) {
      checkPrintRequest();
    }
  }, [activeAddress]);

  const printSpotsLeft = useMemo(
    () =>
      boothStatus ? Math.max(0, boothStatus.max_print_requests - boothStatus.current_count) : 0,
    [boothStatus]
  );

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
          image_url: processIpfsUrl(assetIns.getImageUrl()),
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

  const fetchBoothStatus = async () => {
    try {
      setLoadingBoothStatus(true);
      const status = await printRequestApi.getBoothStatus();
      setBoothStatus(status);
    } catch (error) {
      console.error("Failed to fetch booth status:", error);
    } finally {
      setLoadingBoothStatus(false);
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
            setPrintRequestImage(processIpfsUrl(assetIns.getImageUrl()));
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

    // Check booth status before submitting
    if (boothStatus) {
      if (boothStatus.is_paused) {
        toast.error(
          "Print booth is currently paused and not accepting new requests"
        );
        setShowPrintConfirm(false);
        return;
      }
      if (!boothStatus.available) {
        toast.error(
          `Print request limit reached (${boothStatus.max_print_requests} requests). Please try again later.`
        );
        setShowPrintConfirm(false);
        return;
      }
    }

    setSending(true);
    try {
      await printRequestApi.create(activeAddress, Number(id), tshirtSize);
      toast.success("Photo sent to Photo Booth successfully!");
      setShowPrintConfirm(false);
      // Refresh the print request status and booth status
      await checkPrintRequest();
      await fetchBoothStatus();
    } catch (error: any) {
      if (error.message.includes("already has a print request")) {
        toast.error(
          "You already have a print request. Each wallet can only submit one."
        );
        await checkPrintRequest();
      } else if (error.message.includes("paused")) {
        toast.error(
          "Print booth is currently paused and not accepting new requests"
        );
        await fetchBoothStatus();
      } else if (error.message.includes("limit reached")) {
        toast.error(error.message);
        await fetchBoothStatus();
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

        {/* Booth Status Banner */}
        {boothStatus && (
          <Alert
            className={`mb-4 ${
              boothStatus.is_paused || !boothStatus.available
                ? "border-red-500/50 bg-red-500/10"
                : "border-green-500/50 bg-green-500/10"
            }`}
          >
            <AlertDescription className="flex md:flex-row flex-col items-start md:items-center gap-2 justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  Print Booth:{" "}
                  {boothStatus.is_paused ? (
                    <span className="text-red-500">Paused</span>
                  ) : boothStatus.available ? (
                    <span className="text-green-500">Available ✓</span>
                  ) : (
                    <span className="text-red-500">Full</span>
                  )}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {printSpotsLeft > 0 ? (
                  <span className="text-green-500">
                    {printSpotsLeft} print spots left - submit yours before they run out!{" "}
                  </span>
                ) : (
                  <span className="text-red-500">
                    No print spots left.{" "}
                  </span>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="bg-card rounded-lg shadow-card overflow-hidden">
          <div className="relative">
            <img
              src={processIpfsUrl(photo.image_url)}
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
                <PersonalPrintStatusCard
                  printRequest={existingPrintRequest}
                  title={printRequestTitle}
                  imageUrl={printRequestImage}
                />
              </div>
            ) : (
              <Button
                size="lg"
                onClick={() => setShowPrintConfirm(true)}
                className="w-full rounded-full"
                disabled={
                  checkingPrintRequest ||
                  loadingBoothStatus ||
                  (boothStatus !== null &&
                    (boothStatus.is_paused || !boothStatus.available))
                }
              >
                <Printer className="h-5 w-5 mr-2" />
                {checkingPrintRequest
                  ? "Checking..."
                  : boothStatus?.is_paused
                  ? "Booth Paused"
                  : !boothStatus?.available
                  ? "Booth Full"
                  : "Send to Photo Booth"}
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
          <div className="space-y-4">
            <div className="space-y-2">
              <p>
                This will reserve the <strong>one print slot</strong> for your
                account.
              </p>
              <p className="text-destructive font-medium">
                Each user may only send one NFT for printing. This action is
                final.
              </p>
            </div>

            {/* T-Shirt Size Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">
                Select T-Shirt Size:
              </Label>
              <RadioGroup
                value={tshirtSize}
                onValueChange={(value) =>
                  setTshirtSize(value as "S" | "M" | "L" | "XL")
                }
                className="flex gap-4"
              >
                {(["S", "M", "L", "XL"] as const).map((size) => (
                  <div key={size} className="flex items-center space-x-2">
                    <RadioGroupItem value={size} id={`size-${size}`} />
                    <Label
                      htmlFor={`size-${size}`}
                      className="cursor-pointer font-medium"
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <p className="pt-2">Continue?</p>
          </div>
        }
        onConfirm={handleSendToBooth}
        confirmText={sending ? "Sending..." : "Yes — Send"}
        cancelText="No — Cancel"
      />
    </Layout>
  );
}
