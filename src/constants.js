// src/constants.js

export const CONTRACT_ADDRESS = "0xE61FEb2c3278A6094571ce12177767221cA4b661";

export const TOKENS = {
    usdt: {
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
        symbol: "USDT"
    },
    usdc: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
        symbol: "USDC"
    },
    dai: {
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        decimals: 18,
        symbol: "DAI"
    }
};

// --- ИСПРАВЛЕННЫЙ ФОРМАТ ABI ---
export const ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "address[]", "name": "recipients", "type": "address[]" },
            { "internalType": "uint256[]", "name": "amounts", "type": "uint256[]" }
        ],
        "name": "donate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const ERC20_ABI = [
    {
        "constant": false,
        "inputs": [
            { "name": "spender", "type": "address" },
            { "name": "amount", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [
            { "name": "", "type": "bool" }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            { "name": "owner", "type": "address" },
            { "name": "spender", "type": "address" }
        ],
        "name": "allowance",
        "outputs": [
            { "name": "", "type": "uint256" }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
];
// ------------------------------------

export const ORGS = [
    { key: "thisproject", address: "0xc0F467567570AADa929fFA115E65bB39066e3E42" },
    { key: "ovdinfo", address: "0x421896bb0Dcf271a294bC7019014EE90503656Fd" },
    { key: "mediazona", address: "0xE86D7D922DeF8a8FEB21f1702C9AaEEDBec32DDC" },
    { key: "zhuk", address: "0x1913A02BB3836AF224aEF136461F43189A0cEcd0" },
    { key: "breakfastshow", address: "0xdB4BB555a15bC8bB3b07E57452a8E6E24b358e7F" },
    { key: "kovcheg", address: "0xBf178F99b8790db1BD2194D80c3a268AE4AcE804" },
];

export const initialAmounts = ORGS.reduce((acc, org) => {
    acc[org.address] = "0";
    return acc;
}, {});