import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Printer } from "lucide-react";
import { PrintRequest } from "@/lib/api";
import { getStatusColor, getStatusIcon } from "@/lib/utils";

interface PersonalPrintStatusCardProps {
  printRequest: PrintRequest;
  title?: string;
  imageUrl?: string;
  className?: string;
}

export function PersonalPrintStatusCard({
  printRequest,
  title,
  imageUrl,
  className = "",
}: PersonalPrintStatusCardProps) {
  return (
    <Card
      className={`p-2.5 sm:p-4 transition-all ${
        printRequest.status === "collected" ? "opacity-60" : ""
      } ${className}`}
    >
      <div className="flex flex-row items-center gap-2.5 sm:gap-4">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title || `Asset #${printRequest.asset_id}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
              <Printer className="h-5 w-5 sm:h-4 sm:w-4 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:gap-1">
          {/* First line: ID and Status */}
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm md:text-md font-semibold">Queue: {printRequest.id}</p>
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
          <h3 className="font-semibold truncate text-sm sm:text-base">
            {title || `Asset #${printRequest.asset_id}`}
          </h3>

          {/* Fourth line: Submitted on */}
          <div className="text-xs text-muted-foreground">
            Requested on{" "}
            <span className="hidden sm:inline">
              {new Date(printRequest.created_at).toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="sm:hidden">
              {new Date(printRequest.created_at).toLocaleString(undefined,{
                year: "2-digit",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Fourth line: Submitted on */}
          <div className="text-xs text-muted-foreground">
            Last updated on{" "}
            <span className="hidden sm:inline">
              {new Date(printRequest.updated_at).toLocaleString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span className="sm:hidden">
              {new Date(printRequest.updated_at).toLocaleString(undefined,{
                year: "2-digit",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
