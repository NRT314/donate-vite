// src/constants.js

export const CONTRACT_ADDRESS = "0xE61FEb2c3278A6094571ce12177767221cA4b661";
export const PRESET_NAME = "equal";

export const TOKENS = {
    usdt: {
        address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
        decimals: 6,
        symbol: "USDT"
    },
    usdc: {
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
        symbol: "USDC.e"
    },
    usdc_native: {
        address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
        decimals: 6,
        symbol: "USDC"
    },
    dai: {
        address: "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063",
        decimals: 18,
        symbol: "DAI"
    }
};

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
    },
    {
        "inputs": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "address", "name": "token", "type": "address" },
            { "internalType": "uint256", "name": "amount", "type": "uint256" }
        ],
        "name": "donatePreset",
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
        "outputs": [ { "name": "", "type": "bool" } ],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const ORGS = [
    // Ссылка изменена
    { key: "thisproject", address: "0xc0F467567570AADa929fFA115E65bB39066e3E42", link: "https://newrussia.online/" },
    { key: "ovdinfo", address: "0x421896bb0Dcf271a294bC7019014EE90503656Fd", link: "https://ovd.info" },
    { key: "mediazona", address: "0xE86D7D922DeF8a8FEB21f1702C9AaEEDBec32DDC", link: "https://zona.media" },
    { key: "zhuk", address: "0x1913A02BB3836AF224aEF136461F43189A0cEcd0", link: "https://www.zhuk.world/" },
    { key: "breakfastshow", address: "0xdB4BB555a15bC8bB3b07E57452a8E6E24b358e7F", link: "https://www.youtube.com/@The_Breakfast_Show" },
    { key: "kovcheg", address: "0xBf178F99b8790db1BD2194D80c3a268AE4AcE804", link: "https://kovcheg.live" },
    { key: "findexit", address: "0xADb524cE8c2009e727f6dF4b6a443D455c700244", link: "https://www.youtube.com/@ishemvihod" },
    { key: "gulagunet", address: "0x6051F40d4eF5d5E5BC2B6F4155AcCF57Be6B8F58", link: "https://www.youtube.com/channel/UCbanC4P0NmnzNYXQIrjvoSA" },
    { key: "meduza", address: "0x00B9d7Fe4a2d3aCdd4102Cfb55b98d193B94C0fa", link: "https://meduza.io/" },
    { key: "cit", address: "0xfBcc8904ce75fF90CC741DA80703202faf5b2FcF", link: "https://www.youtube.com/@CITonWar" },
    { key: "importantstories", address: "0x5433CE0E05D117C54f814cc6697244eA0b902DBF", link: "https://istories.media" },
    { key: "fbk", address: "0x314aC71aEB2feC4D60Cc50Eb46e64980a27F2680", link: "https://fbk.info" },
    { key: "iditelesom", address: "0x387C5300586336d145A87C245DD30f9724C6eC01", link: "https://iditelesom.org/ru" },
    { key: "memorial", address: "0x0a4aB5D641f63cd7a2d44d0a643424f5d0df376b", link: "https://memopzk.org/" },
    { key: "insider", address: "0xad8221D4A4feb023156b9E09917Baa4ff81A65F8", link: "https://theins.ru" },
    { key: "rain", address: "0x552dAfED221689e44676477881B6947074a5C342", link: "https://tvrain.tv/" },
    { key: "novayagazeta", address: "0x56F2EbC2660c2f545316fe305FDF06d84Fa9ef61", link: "https://novayagazeta.eu/" },
    { key: "rabkor", address: "0xc759F945313fd2694F46f73756d48150A271EABB", link: "https://www.youtube.com/@Rabkor" },
    { key: "mostmedia", address: "0x3Dd2d15b200C05c33CC308bfa9B856c9704F7472", link: "https://mostmedia.org" },
    { key: "paper", address: "0x5f38083dDdCd48F729B5FA41B9380CdA068973b0", link: "https://paperpaper.io/" }
];

export const initialAmounts = ORGS.reduce((acc, org) => {
    acc[org.address] = "0";
    return acc;
}, {});