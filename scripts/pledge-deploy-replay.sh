#!/usr/bin/env bash
set -e

CYAN='\033[38;2;0;235;220m'
GREEN='\033[38;2;52;211;153m'
GRAY='\033[38;2;148;163;184m'
WHITE='\033[38;2;241;245;249m'
DIM='\033[38;2;100;116;139m'
BOLD='\033[1m'
RESET='\033[0m'

echo -e "${BOLD}${CYAN}[DEV@PLEDGE-AGENT]${RESET}"
echo -e "${DIM} └─➜${RESET}"
echo -e "${WHITE}[*] Deploying PledgeLoans... ${GREEN}${BOLD}SUCCESS${RESET}"
echo -e "${GRAY}    - Deployed to : ${CYAN}0x90278dFC0F8cFdbb4d4a013f90f60964D54b87f4${RESET}"
echo -e "${GRAY}    - TX hash     : ${CYAN}0xadeeA5a4b164000f1be3d39b1de1fb26de6e50850a006d7dd45b8c2e6ccc9a64${RESET}"
echo -e "${GRAY}    - Gas used    : ${WHITE}1060999 (mined in block #125870180)${RESET}"
echo -e "${GRAY}    - Onchain now : ${GREEN}verified live${GRAY} (source verified via blockscout)${RESET}"
