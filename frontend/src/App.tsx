import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "mint", type: "function", stateMutability: "nonpayable", inputs: [{ name: "name", type: "string" }, { name: "message", type: "string" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "getRecentTokens", type: "function", stateMutability: "view", inputs: [{ name: "count", type: "uint256" }],
    outputs: [{ name: "", type: "tuple[]", components: [{ name: "tokenId", type: "uint256" }, { name: "owner", type: "address" }, { name: "name", type: "string" }, { name: "message", type: "string" }, { name: "mintedAt", type: "uint256" }] }] },
  { name: "totalSupply", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
  { name: "mintCount", type: "function", stateMutability: "view", inputs: [{ name: "", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
  { name: "MAX_PER_WALLET", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

const NFT_COLORS = ["#ec4899","#a855f7","#3b82f6","#06b6d4","#22c55e","#eab308","#f97316","#ef4444"];
function nftColor(id: bigint) { return NFT_COLORS[Number(id) % NFT_COLORS.length]; }
function timeAgo(ts: bigint) { const s=Math.floor(Date.now()/1000-Number(ts)); if(s<60)return"just now"; if(s<3600)return`${Math.floor(s/60)}m ago`; return`${Math.floor(s/3600)}h ago`; }

export default function App() {
  const { isConnected, address } = useAccount();
  const [name, setName] = useState(""); const [message, setMessage] = useState(""); const [minted, setMinted] = useState(false);
  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const { data: tokens, refetch } = useReadContract({ address: ADDR, abi: ABI, functionName: "getRecentTokens", args: [BigInt(20)], query: { refetchInterval: 15000 } });
  const { data: supply } = useReadContract({ address: ADDR, abi: ABI, functionName: "totalSupply" });
  const { data: myCount, refetch: refetchCount } = useReadContract({ address: ADDR, abi: ABI, functionName: "mintCount", args: [address!], query: { enabled: !!address } });

  if (isSuccess && !minted) { setMinted(true); refetch(); refetchCount(); setTimeout(() => setMinted(false), 3000); }
  const list = (tokens as any[] | undefined)?.slice().reverse() ?? [];
  const isLoading = isPending || isConfirming;
  const remaining = myCount !== undefined ? 5 - Number(myCount) : null;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#ec4899]/6 blur-[130px]" />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎨</span>
          <span className="font-bold text-white text-lg">onchain<span className="text-[#ec4899]">NFT</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎨</div>
          <h1 className="text-4xl font-black text-white mb-3">Mint Your <span className="text-[#ec4899]">NFT</span></h1>
          <p className="text-slate-400 text-sm">On-chain NFTs on Arc. Stored forever. Max 5 per wallet.</p>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Total Minted", value: supply?.toString() ?? "—", icon: "🎨" },
            { label: "Your NFTs", value: myCount?.toString() ?? "—", icon: "✨" },
            { label: "Remaining", value: remaining !== null ? remaining.toString() : "—", icon: "🎁" },
          ].map(s => (
            <div key={s.label} className="bg-slate-900/60 border border-white/8 rounded-xl px-3 py-3 text-center">
              <div className="text-lg mb-0.5">{s.icon}</div><div className="text-white font-bold text-lg">{s.value}</div><div className="text-slate-500 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="bg-gradient-to-br from-slate-900 to-slate-800/50 border border-white/10 rounded-2xl p-6 mb-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-4">Mint an NFT 🎨</h2>
          <div className="space-y-3 mb-4">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="NFT Name" maxLength={50}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#ec4899]/60 transition-all" />
            <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Message / description for your NFT" rows={3} maxLength={200}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none focus:border-[#ec4899]/60 transition-all resize-none" />
          </div>
          {!isConnected ? <p className="text-slate-500 text-sm text-center py-2">Connect wallet to mint</p>
          : minted ? <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ec4899]/15 border border-[#ec4899]/40 text-[#ec4899] font-semibold">🎨 NFT minted successfully!</div>
          : <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "mint", args: [name, message] })}
              disabled={isLoading || !name || (remaining !== null && remaining <= 0)}
              className="w-full py-3 rounded-xl font-bold text-sm bg-[#ec4899] text-white hover:bg-[#f472b6] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
              {isLoading ? <><svg className="spinner w-4 h-4 border-2 border-current border-t-transparent rounded-full" viewBox="0 0 24 24" />{isPending ? "Confirm…" : "Minting…"}</> : "🎨 Mint NFT"}
            </button>}
          {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
        </div>
        <h2 className="text-lg font-bold text-white mb-4">Recently Minted</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {list.length === 0 && <div className="col-span-3 text-center py-12 text-slate-500"><p className="text-4xl mb-2">🎨</p><p>No NFTs minted yet</p></div>}
          {list.map((t: any) => (
            <div key={t.tokenId.toString()} className="bg-slate-900/70 border border-white/8 rounded-2xl p-4 flex flex-col gap-2">
              <div className="w-full aspect-square rounded-xl flex items-center justify-center text-4xl font-black" style={{ background: `${nftColor(t.tokenId)}20`, border: `1px solid ${nftColor(t.tokenId)}40`, color: nftColor(t.tokenId) }}>
                #{t.tokenId.toString()}
              </div>
              <p className="text-white font-bold text-sm truncate">{t.name}</p>
              <p className="text-slate-400 text-xs line-clamp-2">{t.message || "No message"}</p>
              <p className="text-slate-600 text-xs font-mono">{t.owner.slice(0,6)}…{t.owner.slice(-4)} · {timeAgo(t.mintedAt)}</p>
            </div>
          ))}
        </div>
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>Built on <a href="https://arc.network" className="hover:text-slate-400">Arc Network</a> · Chain ID {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}
