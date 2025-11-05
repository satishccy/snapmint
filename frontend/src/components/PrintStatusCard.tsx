import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { PrintRequest } from "@/lib/api";
import { getStatusColor, getStatusIcon } from "@/lib/utils";

interface PrintStatusCardProps {
  printRequest: PrintRequest;
  imageUrl?: string;
  title?: string;
  showWalletPrefix?: boolean; // Show "by" prefix before wallet address
  className?: string;
}

export function PrintStatusCard({
  printRequest,
  imageUrl,
  title,
  showWalletPrefix = false,
  className = "",
}: PrintStatusCardProps) {
  const walletDisplay = printRequest.wallet_address.slice(0, 8) + "...";

  return (
    <Card
      className={`p-2.5 sm:p-4 transition-all ${
        printRequest.status === "collected" ? "opacity-60" : ""
      } ${className}`}
    >
      <div className="flex flex-row gap-2.5 sm:gap-4">
        

        <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
          {/* First line: ID and Status */}
          <div className="flex items-center justify-between gap-2">
            <Badge variant="outline" className="text-xl">
              Queue: {printRequest.id}
            </Badge>
            <Badge
              variant="outline"
              className={`flex items-center gap-1 text-xs w-fit ${getStatusColor(
                printRequest.status
              )}`}
            >
              {getStatusIcon(printRequest.status)}
              <span className="hidden sm:inline">
                {printRequest.status.replace("_", " ")}
              </span>
              <span className="sm:hidden">
                {printRequest.status === "pending"
                  ? "Pending"
                  : printRequest.status === "in_progress"
                  ? "Printing"
                  : printRequest.status === "completed"
                  ? "Printed"
                  : "Collected"}
              </span>
            </Badge>
          </div>

          {/* Second line: Title */}
          {/* <h3 className="font-semibold truncate text-sm sm:text-base">
            {title || `Asset #${printRequest.asset_id}`}
          </h3> */}

          {/* Third line: Wallet */}
          <p className="text-xs sm:text-sm text-muted-foreground break-all sm:break-normal">
            {showWalletPrefix ? "by " : ""}
            {walletDisplay}
          </p>

          {/* Fourth line: Submitted on */}
          <div className="text-xs text-muted-foreground">
            {showWalletPrefix ? "Submitted" : "Requested"} on{" "}
            <span className="hidden sm:inline">
              {new Date(printRequest.created_at).toLocaleString()}
            </span>
            <span className="sm:hidden">
              {new Date(printRequest.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

