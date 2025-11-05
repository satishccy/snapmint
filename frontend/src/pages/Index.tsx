import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Sparkles, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="text-center max-w-md">
        <div className="bg-primary rounded-3xl p-8 mb-6 inline-block">
          <img
            src="public\algorand.png"
            alt="My Logo"
            className="h-20 w-20 scale-150 text-primary-foreground"
          />
        </div>

        <h1 className="text-4xl font-bold mb-3 bg-primary bg-clip-text text-transparent">
          Snap Mint
        </h1>
        <h2 className="text-2xl font-bold mb-2">Algorand India Summit</h2>

        <p className="text-xl text-foreground/80 mb-8">
          Snap a Moment, Mint a Memory
        </p>

        <div className="space-y-4 mb-12">
          <div className="flex items-start gap-3 text-left">
            <Camera className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Capture Photos</p>
              <p className="text-sm text-muted-foreground">Take or upload stunning photos</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Mint as NFTs</p>
              <p className="text-sm text-muted-foreground">Convert moments into blockchain memories</p>
            </div>
          </div>

          <div className="flex items-start gap-3 text-left">
            <Printer className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Print One Photo</p>
              <p className="text-sm text-muted-foreground">Send your favorite NFT for one-off printing</p>
            </div>
          </div>
        </div>

        <Button size="lg" onClick={() => navigate("/capture")} className="w-full rounded-full">
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
