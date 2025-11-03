import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  FlipHorizontal,
  Zap,
  ZapOff,
  X,
  Check,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Arc3, IPFS, Network } from "arcraft";
import { useNetwork, useWallet } from "@txnlab/use-wallet-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Capture() {
  const navigate = useNavigate();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { activeAddress, transactionSigner } = useWallet();
  const { activeNetwork } = useNetwork();
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [flashOn, setFlashOn] = useState(false);
  const [photoFromCamera, setPhotoFromCamera] = useState(false);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [mintName, setMintName] = useState("");
  const [mintDescription, setMintDescription] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cameraActive) {
      const initCamera = async () => {
        try {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
          }

          const constraints: MediaStreamConstraints = {
            video: { facingMode: facingMode, ...(flashOn && { torch: true }) },
            audio: false,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          } else {
            stream.getTracks().forEach((track) => track.stop());
          }
        } catch (error) {
          toast.error("Could not access camera. Please check permissions.");
          console.error(error);
          setCameraActive(false);
        }
      };
      initCamera();
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [cameraActive, facingMode, flashOn]);

  const startCamera = () => setCameraActive(true);
  const stopCamera = () => {
    setCameraActive(false);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = () =>
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));

  const toggleFlash = () => setFlashOn((prev) => !prev);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL("image/jpeg");
        setCapturedImage(imageData);
        setPhotoFromCamera(true);
        setCameraActive(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImage(event.target?.result as string);
        setPhotoFromCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMint = async () => {
    if (!capturedImage) return;
    if (!activeAddress) return toast.error("Please connect your wallet to mint");
    if (!mintName.trim()) return toast.error("Please enter a name for your photo");

    setMintDialogOpen(false);
    setUploading(true);
    try {
      const ipfs = new IPFS("pinata", {
        jwt: import.meta.env.VITE_PINATA_JWT,
        provider: "pinata",
      });

      const extension = capturedImage.split(";")[0].split("/")[1];
      const imageFile = new File(
        [await fetch(capturedImage).then((r) => r.blob())],
        `${Date.now()}.${extension}`,
        { type: `image/${extension}` }
      );

      const mint = await Arc3.create({
        name: mintName.trim(),
        unitName: "UNT",
        total: 1,
        decimals: 0,
        creator: { address: activeAddress, signer: transactionSigner },
        image: { file: imageFile, name: imageFile.name },
        network: activeNetwork as Network,
        properties: { mintedAt: Date.now(), description: mintDescription.trim() },
        ipfs,
      });

      toast.success("Photo minted successfully");
      navigate(`/photo/${mint.assetId}`);
      setMintName("");
      setMintDescription("");
    } catch (error: any) {
      toast.error(error.message || "Failed to mint photo");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenMintDialog = () => {
    if (!activeAddress) return toast.error("Please connect your wallet to mint");
    setMintDialogOpen(true);
  };

  const retake = () => {
    setCapturedImage(null);
    if (photoFromCamera) {
      setPhotoFromCamera(false);
      startCamera();
    }
  };

  return (
    <Layout>
      <div className="h-[calc(100vh-3.6rem)] flex flex-col bg-background text-foreground overflow-hidden transition-colors duration-300">
        {/* Camera/Preview Area */}
        <div className="flex-1 relative bg-background overflow-hidden flex items-center justify-center">
          {!capturedImage && !cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8 overflow-auto">
              <div className="bg-primary rounded-full p-8">
                <Camera className="h-16 w-16 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Capture a Moment</h2>
              <p className="text-muted-foreground text-center max-w-sm">
                Take a photo or upload from your gallery to start minting memories
              </p>
              <div className="flex gap-4">
                <Button size="lg" onClick={startCamera} className="rounded-full">
                  <Camera className="h-5 w-5 mr-2" />
                  Open Camera
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  Upload
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {cameraActive && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="max-w-full max-h-full w-auto h-auto object-contain"
              />
              <div className="absolute top-4 left-4 z-20">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={stopCamera}
                  className="rounded-full bg-background/70 text-foreground border-border backdrop-blur"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}

          {capturedImage && (
            <img
              src={capturedImage}
              alt="Captured"
              className="max-w-full max-h-full w-auto h-auto object-contain"
            />
          )}
        </div>

        {/* Bottom Controls */}
        {cameraActive && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-8 p-4 z-20">
            <Button
              size="icon"
              variant="outline"
              onClick={toggleCamera}
              className="rounded-full bg-background/50 border-border text-foreground backdrop-blur"
            >
              <FlipHorizontal className="h-5 w-5" />
            </Button>

            <Button
              size="lg"
              onClick={capturePhoto}
              className="rounded-full h-20 w-20 bg-primary hover:bg-primary-hover shadow-2xl ring-4 ring-primary/30 hover:ring-primary/50 transition-all"
            >
              <Camera className="h-10 w-10 text-primary-foreground" />
            </Button>

            <Button
              size="icon"
              variant="outline"
              onClick={toggleFlash}
              className={`rounded-full backdrop-blur ${
                flashOn
                  ? "bg-yellow-400/30 border-yellow-400/50 text-yellow-300 hover:bg-yellow-400/40"
                  : "bg-background/50 border-border text-foreground hover:bg-background/70"
              }`}
            >
              {flashOn ? <Zap className="h-5 w-5" /> : <ZapOff className="h-5 w-5" />}
            </Button>
          </div>
        )}

        {capturedImage && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 p-4">
            <Button
              size="lg"
              variant="outline"
              onClick={retake}
              className="rounded-full bg-background/70 border-border text-foreground hover:bg-background/80 backdrop-blur"
            >
              <X className="h-5 w-5 mr-2" />
              Retake
            </Button>
            <Button
              size="lg"
              onClick={handleOpenMintDialog}
              disabled={uploading}
              className="rounded-full"
            >
              <Check className="h-5 w-5 mr-2" />
              {uploading ? "Minting..." : "Mint Photo"}
            </Button>
          </div>
        )}

        {/* Mint Dialog */}
        <Dialog open={mintDialogOpen} onOpenChange={setMintDialogOpen}>
          <DialogContent className="sm:max-w-[425px] bg-background text-foreground">
            <DialogHeader>
              <DialogTitle>Mint Your Photo</DialogTitle>
              <DialogDescription>
                Add optional details about your photo before minting it as an NFT.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter a name for your photo"
                  value={mintName}
                  required
                  maxLength={32}
                  onChange={(e) => setMintName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  maxLength={512}
                  placeholder="Add a description about this photo..."
                  value={mintDescription}
                  onChange={(e) => setMintDescription(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMintDialogOpen(false)} disabled={uploading}>
                Cancel
              </Button>
              <Button onClick={handleMint} disabled={uploading} className="shadow-glow">
                {uploading ? "Minting..." : "Mint Photo"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
