import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Clock, Printer, Package, CheckCircle2 } from "lucide-react";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4" />;
    case "in_progress":
      return <Printer className="h-4 w-4" />;
    case "completed":
      return <Package className="h-4 w-4" />;
    case "collected":
      return <CheckCircle2 className="h-4 w-4" />;
    default:
      return null;
  }
};

export const getStatusColor = (status: string) => {
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

/**
 * Processes IPFS URLs to extract CID and convert to IPFS gateway URL
 * Supports various IPFS URL formats:
 * - ipfs://Qm...
 * - ipfs://ipfs/Qm...
 * - https://ipfs.io/ipfs/Qm...
 * - https://gateway.pinata.cloud/ipfs/Qm...
 * - Qm... (just CID)
 * 
 * @param url - The IPFS URL or regular URL
 * @returns Processed URL using IPFS gateway from env, or original URL if not IPFS
 */
export const processIpfsUrl = (url: string | undefined | null): string => {
  if (!url) return "";

  const ipfsGateway = import.meta.env.VITE_IPFS_GATEWAY || "https://ipfs.io/ipfs/";
  
  // Remove trailing slash from gateway if present
  const gateway = ipfsGateway.endsWith("/") ? ipfsGateway.slice(0, -1) : ipfsGateway;

  // Extract CID from various IPFS URL formats
  let cid = "";

  // Format: ipfs://Qm... or ipfs://ipfs/Qm...
  if (url.startsWith("ipfs://")) {
    cid = url.replace("ipfs://", "").replace("ipfs/", "");
  }
  // Format: https://ipfs.io/ipfs/Qm... or https://gateway.pinata.cloud/ipfs/Qm...
  else if (url.includes("/ipfs/")) {
    const parts = url.split("/ipfs/");
    if (parts.length > 1) {
      cid = parts[1]
    }
  }
  // Format: Just CID (Qm... or bafy...)
  else if (/^Qm[1-9A-HJ-NP-Za-km-z]{44}$|^baf[a-z0-9]{56,}$/.test(url)) {
    cid = url;
  }
  // Not an IPFS URL, return as-is
  else {
    return url;
  }

  // If we extracted a CID, construct gateway URL
  if (cid) {
    return `${gateway}/${cid}`;
  }

  // Fallback: return original URL
  return url;
};
