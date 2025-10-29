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
