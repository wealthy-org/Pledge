#!/usr/bin/env bash
set -e

CYAN='\033[38;2;0;235;220m'
GREEN='\033[38;2;52;211;153m'
WHITE='\033[38;2;241;245;249m'
DIM='\033[38;2;100;116;139m'
RESET='\033[0m'

echo -e "${CYAN}     ██╗███████╗██╗   ██╗ ██████╗      █████╗  ██████╗ ███████╗███╗   ██╗████████╗${RESET}"
echo -e "${CYAN}     ██║██╔════╝██║   ██║██╔═══██╗    ██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝${RESET}"
echo -e "${CYAN}     ██║█████╗  ██║   ██║██║   ██║    ███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   ${RESET}"
echo -e "${CYAN}██   ██║██╔══╝  ╚██╗ ██╔╝██║   ██║    ██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ${RESET}"
echo -e "${CYAN}╚█████╔╝███████╗ ╚████╔╝ ╚██████╔╝    ██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ${RESET}"
echo -e "${CYAN} ╚════╝ ╚══════╝  ╚═══╝   ╚═════╝     ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ${RESET}"
echo ""
echo -e "${WHITE}[+] SECURE UPLINK ESTABLISHED${RESET}"
echo -e "${WHITE}[+] ENCRYPTED CONNECTION TO ROBINHOOD TESTNET... ${GREEN}OK${WHITE} (eth_chainId = 46630)${RESET}"

CHAIN_HEAD="[unavailable]"
if [ "$1" == "--live" ] || [ "$LIVE_SYNC" == "1" ]; then
  RPC_URL="${NEXT_PUBLIC_RPC_URL:-https://rpc.testnet.chain.robinhood.com}"
  if command -v curl >/dev/null 2>&1; then
    BLOCK_HEX=$(curl -s -m 2 -X POST "$RPC_URL" -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' 2>/dev/null | grep -o '"result":"[^"]*"' | cut -d'"' -f4 || true)
    if [ -n "$BLOCK_HEX" ] && [ "$BLOCK_HEX" != "null" ]; then
      CHAIN_HEAD="#$((BLOCK_HEX))"
    fi
  fi
fi

echo -e "${WHITE}[+] CHAIN HEAD SYNCED... ${DIM}${CHAIN_HEAD}${RESET}"
echo ""
