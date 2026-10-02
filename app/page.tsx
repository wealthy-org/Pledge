import { ConnectWallet } from '@/components/web3/ConnectWallet';
import { TESTNET_CHAIN_ID, MAINNET_CHAIN_ID } from '@/config/chains';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-bg text-text selection:bg-lime/20 selection:text-lime">
      <header className="w-full border-b border-line bg-panel/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-lime flex items-center justify-center text-bg font-bold text-lg tracking-tighter">
              P
            </div>
            <span className="font-semibold text-lg tracking-tight">PLEDGE</span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-raised text-muted border border-line">
              Robinhood EVM
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ConnectWallet />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime/10 border border-lime/30 text-lime text-xs font-mono mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-lime animate-ping" />
          <span>Non-Custodial Fixed-Rate NFT Lending Protocol</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight max-w-3xl mb-6">
          Instant Liquidity for Your NFTs on <span className="text-lime">Robinhood Chain</span>
        </h1>

        <p className="text-muted text-base sm:text-lg max-w-2xl mb-10 leading-relaxed">
          Borrow against verified NFT collateral at transparent fixed rates, or earn passive yields by depositing liquidity into automated single-borrower pools.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <ConnectWallet className="scale-110" />
        </div>
      </main>

      <footer className="border-t border-line py-6 text-center text-xs text-muted font-mono">
        Pledge Protocol &copy; 2026 &middot; Robinhood Testnet ({TESTNET_CHAIN_ID}) & Mainnet ({MAINNET_CHAIN_ID})
      </footer>
    </div>
  );
}
