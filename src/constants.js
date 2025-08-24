// src/constants.js

// --- CORE DONATION CONTRACTS (remain unchanged) ---
export const CONTRACT_ADDRESS = "0xE61FEb2c3278A6094571ce12177767221cA4b661";
export const PRESET_NAME = "equal";

// --- VOTING SYSTEM ADDRESSES ---
export const VOTING_CONTRACT_ADDRESS = "0x44b826DCB5F585A4A7eca2fEc645efC711BFa83f";
export const NRT_VOTING_TOKEN_ADDRESS = "0xE61FEb2c3278A6094571ce12177767221cA4b661"; // This is the real NRT token
export const FORWARDER_ADDRESS = "0xDd65a28DE55c4328Ebd3aED01d6B4779335694AE";

// --- HELPER CONSTANTS ---
export const VOTE_TYPE = { CUMULATIVE: 0, SINGLE_CHOICE: 1 };
export const PROPOSAL_STATUS = { Active: 0, Cancelled: 1, Executed: 2 };

// --- EIP-712 CONSTANTS FOR METAMASK SIGNATURE ---
export const EIP712_DOMAIN = {
  name: 'MinimalForwarder',
  version: '0.0.1'
};

export const FORWARD_REQUEST_TYPES = {
  ForwardRequest: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'gas', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'data', type: 'bytes' },
  ],
};

// --- TOKEN LIST ---
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

// ABI for the main donation contract
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

// --- OFFICIAL ABI FOR THE NEW VOTING CONTRACT ---
export const VOTING_ABI = [
  {
    "type": "constructor",
    "inputs": [
      {
        "name": "_nrtAddress",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "_trustedForwarder",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "cancelProposal",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createProposal",
    "inputs": [
      {
        "name": "durationSeconds",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "voteType",
        "type": "uint8",
        "internalType": "enum NRTUniversalVoting.VoteType"
      },
      {
        "name": "metadata",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "_candidates",
        "type": "address[]",
        "internalType": "address[]"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "executeProposal",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getProposalFull",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "user",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct NRTUniversalVoting.ProposalFullView",
        "components": [
          {
            "name": "base",
            "type": "tuple",
            "internalType": "struct NRTUniversalVoting.ProposalView",
            "components": [
              {
                "name": "id",
                "type": "uint256",
                "internalType": "uint256"
              },
              {
                "name": "status",
                "type": "uint8",
                "internalType": "uint8"
              },
              {
                "name": "voteType",
                "type": "uint8",
                "internalType": "uint8"
              },
              {
                "name": "startTime",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "endTime",
                "type": "uint64",
                "internalType": "uint64"
              },
              {
                "name": "metadata",
                "type": "string",
                "internalType": "string"
              },
              {
                "name": "candidates",
                "type": "address[]",
                "internalType": "address[]"
              },
              {
                "name": "isVisible",
                "type": "bool",
                "internalType": "bool"
              }
            ]
          },
          {
            "name": "scores",
            "type": "uint256[]",
            "internalType": "uint256[]"
          },
          {
            "name": "hasUserVoted",
            "type": "bool",
            "internalType": "bool"
          },
          {
            "name": "userPower",
            "type": "uint256",
            "internalType": "uint256"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProposalInfoView",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "v",
        "type": "tuple",
        "internalType": "struct NRTUniversalVoting.ProposalView",
        "components": [
          {
            "name": "id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "status",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "voteType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "startTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "endTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "metadata",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "candidates",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "isVisible",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProposalResults",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getProposalsView",
    "inputs": [
      {
        "name": "startId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "count",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "reverse",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [
      {
        "name": "out",
        "type": "tuple[]",
        "internalType": "struct NRTUniversalVoting.ProposalView[]",
        "components": [
          {
            "name": "id",
            "type": "uint256",
            "internalType": "uint256"
          },
          {
            "name": "status",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "voteType",
            "type": "uint8",
            "internalType": "uint8"
          },
          {
            "name": "startTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "endTime",
            "type": "uint64",
            "internalType": "uint64"
          },
          {
            "name": "metadata",
            "type": "string",
            "internalType": "string"
          },
          {
            "name": "candidates",
            "type": "address[]",
            "internalType": "address[]"
          },
          {
            "name": "isVisible",
            "type": "bool",
            "internalType": "bool"
          }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "hasVoted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "voter",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "isTrustedForwarder",
    "inputs": [
      {
        "name": "forwarder",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [
      {
        "name": "",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "nrt",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "contract INRT_Governance"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "proposalCount",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "setProposalVisibility",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_isVisible",
        "type": "bool",
        "internalType": "bool"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "transferOwnership",
    "inputs": [
      {
        "name": "newOwner",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "trustedForwarder",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "address",
        "internalType": "address"
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "vote",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_candidatesToVoteFor",
        "type": "address[]",
        "internalType": "address[]"
      },
      {
        "name": "_weights",
        "type": "uint256[]",
        "internalType": "uint256[]"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "voteSingleChoice",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "_candidate",
        "type": "address",
        "internalType": "address"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "MultiCandidateVoteCast",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "voter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "totalWeight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "OwnershipTransferred",
    "inputs": [
      {
        "name": "previousOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "newOwner",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCancelled",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalCreated",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "proposer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "voteType",
        "type": "uint8",
        "indexed": false,
        "internalType": "enum NRTUniversalVoting.VoteType"
      },
      {
        "name": "startTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "endTime",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "candidates",
        "type": "address[]",
        "indexed": false,
        "internalType": "address[]"
      },
      {
        "name": "metadata",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalExecuted",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "ProposalVisibilitySet",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "isVisible",
        "type": "bool",
        "indexed": false,
        "internalType": "bool"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SingleVoteCast",
    "inputs": [
      {
        "name": "proposalId",
        "type": "uint256",
        "indexed": true,
        "internalType": "uint256"
      },
      {
        "name": "voter",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "candidate",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "weight",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "error",
    "name": "AlreadyVoted",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DuplicateCandidate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InputLengthMismatch",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientVotingPower",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidCandidate",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidDuration",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidStartId",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotEnoughCandidates",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotOwner",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProposalNotActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ProposalNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VotingFinished",
    "inputs": []
  },
  {
    "type": "error",
    "name": "VotingStillActive",
    "inputs": []
  },
  {
    "type": "error",
    "name": "WrongVoteFunction",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ZeroAddress",
    "inputs": []
  }
];

// --- MINIMAL FORWARDER ABI ---
export const FORWARDER_ABI = [
    {
        "inputs": [ { "internalType": "address", "name": "from", "type": "address" } ],
        "name": "getNonce",
        "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    { "internalType": "address", "name": "from", "type": "address" },
                    { "internalType": "address", "name": "to", "type": "address" },
                    { "internalType": "uint256", "name": "value", "type": "uint256" },
                    { "internalType": "uint256", "name": "gas", "type": "uint256" },
                    { "internalType": "uint256", "name": "nonce", "type": "uint256" },
                    { "internalType": "bytes", "name": "data", "type": "bytes" }
                ],
                "internalType": "struct MinimalForwarder.ForwardRequest",
                "name": "req",
                "type": "tuple"
            },
            { "internalType": "bytes", "name": "signature", "type": "bytes" }
        ],
        "name": "execute",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" },
            { "internalType": "bytes", "name": "", "type": "bytes" }
        ],
        "stateMutability": "payable",
        "type": "function"
    }
];

// --- STANDARD ERC20 ABI (for token interactions) ---
export const ERC20_ABI = [
    { "inputs": [], "name": "InvalidShortString", "type": "error" },
    { "inputs": [ { "internalType": "string", "name": "str", "type": "string" } ], "name": "StringTooLong", "type": "error" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Approval", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "delegator", "type": "address" }, { "indexed": true, "internalType": "address", "name": "fromDelegate", "type": "address" }, { "indexed": true, "internalType": "address", "name": "toDelegate", "type": "address" } ], "name": "DelegateChanged", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "delegate", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "previousBalance", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "newBalance", "type": "uint256" } ], "name": "DelegateVotesChanged", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" },
    { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" } ], "name": "Transfer", "type": "event" },
    { "inputs": [], "name": "CLOCK_MODE", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" } ], "name": "allowance", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "approve", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" } ], "name": "checkpoints", "outputs": [ { "components": [ { "internalType": "uint32", "name": "fromBlock", "type": "uint32" }, { "internalType": "uint224", "name": "votes", "type": "uint224" } ], "internalType": "struct ERC20Votes.Checkpoint", "name": "", "type": "tuple" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "clock", "outputs": [ { "internalType": "uint48", "name": "", "type": "uint48" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "decimals", "outputs": [ { "internalType": "uint8", "name": "", "type": "uint8" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "subtractedValue", "type": "uint256" } ], "name": "decreaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "delegatee", "type": "address" } ], "name": "delegate", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "delegatee", "type": "address" }, { "internalType": "uint256", "name": "nonce", "type": "uint256" }, { "internalType": "uint256", "name": "expiry", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "delegateBySig", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "delegates", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "eip712Domain", "outputs": [ { "internalType": "bytes1", "name": "fields", "type": "bytes1" }, { "internalType": "string", "name": "name", "type": "string" }, { "internalType": "string", "name": "version", "type": "string" }, { "internalType": "uint256", "name": "chainId", "type": "uint256" }, { "internalType": "address", "name": "verifyingContract", "type": "address" }, { "internalType": "bytes32", "name": "salt", "type": "bytes32" }, { "internalType": "uint256[]", "name": "extensions", "type": "uint256[]" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "uint256", "name": "blockNumber", "type": "uint256" } ], "name": "getPastTotalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "account", "type": "address" }, { "internalType": "uint256", "name": "blockNumber", "type": "uint256" } ], "name": "getPastVotes", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "getVotes", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "addedValue", "type": "uint256" } ], "name": "increaseAllowance", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "nonces", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "account", "type": "address" } ], "name": "numCheckpoints", "outputs": [ { "internalType": "uint32", "name": "", "type": "uint32" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "spender", "type": "address" }, { "internalType": "uint256", "name": "value", "type": "uint256" }, { "internalType": "uint256", "name": "deadline", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "permit", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "totalSupply", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transfer", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "amount", "type": "uint256" } ], "name": "transferFrom", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

// --- ORGANIZATIONS LIST ---
export const ORGS = [
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