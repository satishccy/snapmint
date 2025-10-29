import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useWallet, type Wallet as WalletType } from "@txnlab/use-wallet-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WalletConnectButton() {
  const { activeWallet, wallets, isReady } = useWallet();
  const [connectingWalletId, setConnectingWalletId] = useState<string | null>(null);

  // If wallet is connected, show connected view
  if (activeWallet) {
    return <ConnectedWallet wallet={activeWallet} />;
  }

  // Otherwise, show wallet selection
  return (
    <WalletList 
      wallets={wallets} 
      isReady={isReady}
      connectingWalletId={connectingWalletId}
      setConnectingWalletId={setConnectingWalletId}
    />
  );
}

interface WalletListProps {
  wallets: WalletType[];
  isReady: boolean;
  connectingWalletId: string | null;
  setConnectingWalletId: (id: string | null) => void;
}

const WalletList = ({ wallets, isReady, connectingWalletId, setConnectingWalletId }: WalletListProps) => {
  const handleConnect = async (wallet: WalletType) => {
    setConnectingWalletId(wallet.id);
    try {
      await wallet.connect();
      toast.success(`${wallet.metadata.name} connected successfully!`);
    } catch (error: any) {
      toast.error(`Failed to connect ${wallet.metadata.name}`);
      console.error("Connection error:", error);
    } finally {
      setConnectingWalletId(null);
    }
  };

  if (!isReady || wallets.length === 0) {
    return (
      <Button
        variant="default"
        size="sm"
        disabled
        className="rounded-full"
      >
        <Wallet className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size="sm"
          className="rounded-full"
        >
          <Wallet className="h-4 w-4 mr-2" />
          Connect Wallet
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Connect Wallet</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {wallets.map((wallet) => (
          <WalletOption
            key={wallet.id}
            wallet={wallet}
            onConnect={handleConnect}
            isConnecting={connectingWalletId === wallet.id}
          />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

interface WalletOptionProps {
  wallet: WalletType;
  onConnect: (wallet: WalletType) => Promise<void>;
  isConnecting: boolean;
}

const WalletOption = ({ wallet, onConnect, isConnecting }: WalletOptionProps) => {
  return (
    <DropdownMenuItem
      onClick={() => onConnect(wallet)}
      disabled={isConnecting}
      className="flex items-center gap-3 py-3 cursor-pointer"
    >
      {wallet.metadata.icon ? (
        <img
          src={wallet.metadata.icon}
          alt={wallet.metadata.name}
          className="w-8 h-8 rounded"
        />
      ) : (
        <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
          <Wallet className="h-4 w-4" />
        </div>
      )}
      <div className="flex flex-col flex-1">
        <span className="font-medium">{wallet.metadata.name}</span>
        {isConnecting && (
          <span className="text-xs text-muted-foreground">Connecting...</span>
        )}
      </div>
    </DropdownMenuItem>
  );
};

interface ConnectedWalletProps {
  wallet: WalletType;
}

const ConnectedWallet = ({ wallet }: ConnectedWalletProps) => {
  const [copiedAddress, setCopiedAddress] = useState(false);
  const activeAccount = wallet.activeAccount;

  const handleCopyAddress = async () => {
    if (activeAccount?.address) {
      try {
        await navigator.clipboard.writeText(activeAccount.address);
        setCopiedAddress(true);
        toast.success("Address copied to clipboard!");
        setTimeout(() => setCopiedAddress(false), 2000);
      } catch (error) {
        toast.error("Failed to copy address");
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await wallet.disconnect();
      toast.info("Wallet disconnected");
    } catch (error) {
      toast.error("Failed to disconnect wallet");
      console.error("Disconnect error:", error);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
        >
          {wallet.metadata.icon && (
            <img
              src={wallet.metadata.icon}
              alt={wallet.metadata.name}
              className="w-4 h-4 mr-2 rounded"
            />
          )}
          {activeAccount?.address ? formatAddress(activeAccount.address) : "Connected"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        {/* Wallet Header */}
        <div className="flex items-center gap-3 px-2 py-3">
          {wallet.metadata.icon && (
            <img
              src={wallet.metadata.icon}
              alt={wallet.metadata.name}
              className="w-10 h-10 rounded"
            />
          )}
          <div className="flex flex-col flex-1">
            <span className="font-semibold text-sm">{wallet.metadata.name}</span>
            <span className="text-xs text-muted-foreground">Connected</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Account Selector */}
        {wallet.accounts.length > 1 && (
          <>
            <DropdownMenuLabel>Select Account</DropdownMenuLabel>
            <div className="px-2 pb-2">
              <Select
                value={activeAccount?.address || ""}
                onValueChange={(address) => {
                  wallet.setActiveAccount(address);
                  window.location.reload();
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {wallet.accounts.map((account) => (
                    <SelectItem key={account.address} value={account.address}>
                      <div className="flex flex-col">
                        <span>{account.name || "Account"}</span>
                        <span className="text-xs text-start text-muted-foreground">{formatAddress(account.address)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Active Account Info */}
        {activeAccount && (
          <>
            <DropdownMenuLabel>Active Account</DropdownMenuLabel>
            <div className="px-2 py-2 space-y-2">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">
                  {activeAccount.name || "Account"}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">
                    {formatAddress(activeAccount.address)}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={handleCopyAddress}
                  >
                    {copiedAddress ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Disconnect Button */}
        <DropdownMenuItem
          onClick={handleDisconnect}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
