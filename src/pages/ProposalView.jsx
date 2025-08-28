import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAccount, useWriteContract, useReadContract, useSignTypedData, usePublicClient } from 'wagmi';
import { formatUnits, parseUnits, encodeFunctionData, zeroAddress } from 'viem';
import CountdownTimer from '../components/voting/CountdownTimer';
import {
    VOTING_CONTRACT_ADDRESS, NRT_VOTING_TOKEN_ADDRESS, FORWARDER_ADDRESS,
    VOTING_ABI, ERC20_ABI, FORWARDER_ABI,
    VOTE_TYPE, PROPOSAL_STATUS, EIP712_DOMAIN, FORWARD_REQUEST_TYPES
} from '../constants';

// --- Helper Components ---
const VotingPowerExplanation = ({ t }) => (
  <div className="explanation-box" style={{ background: '#f0f5ff', border: '1px solid #adc6ff', borderRadius: '8px', padding: '12px 16px', margin: '16px 0', fontSize: '0.9rem' }}>
    <h4 style={{ marginTop: 0, marginBottom: '8px', color: '#1677ff' }}>{t.voting_power_title_alt || "You can only vote once"}</h4>
    <p style={{ margin: 0 }}>
      {t.voting_power_desc_alt || "Your voting power equals your NRT balance at the time of voting."}
    </p>
  </div>
);

const VoteSingleChoice = ({ candidates, candidateNames, selectedCandidate, onSelectCandidate }) => (
  <ul className="vote-options-list single-choice">
    {candidates.map((candidate) => (
      <li key={candidate}>
        <label>
          <input
            type="radio"
            name="single-choice-candidate"
            value={candidate}
            checked={selectedCandidate === candidate}
            onChange={() => onSelectCandidate(candidate)}
          />
          <span>{candidateNames[candidate] || <code>{candidate}</code>}</span>
        </label>
      </li>
    ))}
  </ul>
);

const VoteCumulative = ({ candidates, candidateNames, weights, onWeightChange, userNrtBalance, isVoting }) => {
    const totalWeight = useMemo(() => Object.values(weights).reduce((sum, current) => sum + (parseFloat(current) || 0), 0), [weights]);
    return (
        <div>
            <ul className="vote-options-list cumulative">
                {candidates.map((candidate) => (
                <li key={candidate}>
                    <span>{candidateNames[candidate] || <code>{candidate}</code>}</span>
                    <input type="text" inputMode="decimal" className="amount-input" placeholder="0.0" value={weights[candidate] || ''} onChange={(e) => onWeightChange(candidate, e.target.value)} disabled={isVoting}/>
                </li>
                ))}
            </ul>
            <div className="cumulative-total">
                <p>Distributed: <span style={{ fontWeight: 'bold' }}>{totalWeight.toFixed(2)}</span> / {userNrtBalance.toFixed(2)} NRT (current balance)</p>
                {totalWeight > userNrtBalance && <p className="error-message">Total votes exceed your balance!</p>}
            </div>
        </div>
    );
};

// Custom replacer function for JSON.stringify to handle BigInts
function replacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export default function ProposalView({ t }) {
  const { proposalId: proposalIdStr } = useParams();
  const navigate = useNavigate();
  const { address, isConnected, chain } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { signTypedDataAsync } = useSignTypedData();
  const [status, setStatus] = useState({ message: '', type: 'idle' });
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [weights, setWeights] = useState({});

  const proposalId = useMemo(() => proposalIdStr ? BigInt(proposalIdStr) : null, [proposalIdStr]);
  const userAddressForQuery = address || zeroAddress;

  const { data: fullProposalData, isLoading, isError } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getProposalFull',
    args: [proposalId, userAddressForQuery],
    enabled: !!proposalId,
  });

  // --- НОВЫЙ КОД: Получение количества проголосовавших ---
  const { data: voterCount, isLoading: isLoadingVoterCount } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'getVoterCount',
    args: [proposalId],
    enabled: !!proposalId,
    watch: true, // Автоматическое обновление данных в реальном времени
  });
  // --- КОНЕЦ НОВОГО КОДА ---

  const {
    base: proposal,
    scores,
    hasUserVoted,
    userPower: nrtBalanceRaw
  } = fullProposalData || {};

  const totalWeight = useMemo(() => Object.values(weights).reduce((sum, current) => sum + (parseFloat(current) || 0), 0), [weights]);

  const parsedMetadata = useMemo(() => {
    if (!proposal?.metadata) {
      return { title: 'Loading title...', description: '', candidateNames: {} };
    }
    try {
      const parsed = JSON.parse(proposal.metadata);
      return {
        title: parsed.title || proposal.metadata,
        description: parsed.description || '',
        candidateNames: parsed.candidateNames || {}
      };
    } catch (e) {
      return { title: proposal.metadata, description: '', candidateNames: {} };
    }
  }, [proposal]);

  const handleVote = async (args) => {
    if (!isConnected) return;
    setStatus({ message: t.status_sending_vote || 'Waiting for confirmation in wallet...', type: 'pending' });
    try {
      const functionName = proposal.voteType === VOTE_TYPE.SINGLE_CHOICE ? 'voteSingleChoice' : 'vote';
      await writeContractAsync({ address: VOTING_CONTRACT_ADDRESS, abi: VOTING_ABI, functionName, args: [proposalId, ...args] });
      setStatus({ message: t.status_vote_success || '✅ Vote cast successfully!', type: 'success' });
    } catch (error) {
      console.error("Voting error:", error);
      setStatus({ message: `${t.status_error || '❌ Error:'} ${error.shortMessage || error.message}`, type: 'error' });
    }
  };

  const handleMetaTxVote = async (args) => {
    if (!isConnected) return;
    if (chain?.id !== 137) { // Polygon Mainnet check
      setStatus({ message: 'Ошибка: Пожалуйста, переключитесь на сеть Polygon Mainnet.', type: 'error' });
      return;
    }

    setStatus({ message: t.status_signing || 'Подпишите сообщение в кошельке (это бесплатно)...', type: 'pending' });

    try {
        const functionName = proposal.voteType === VOTE_TYPE.SINGLE_CHOICE ? 'voteSingleChoice' : 'vote';
        const encodedData = encodeFunctionData({ abi: VOTING_ABI, functionName, args: [proposalId, ...args] });
        const nonce = await publicClient.readContract({ address: FORWARDER_ADDRESS, abi: FORWARDER_ABI, functionName: 'getNonce', args: [address] });

        const request = {
            from: address,
            to: VOTING_CONTRACT_ADDRESS,
            value: 0n,
            gas: 1000000n,
            nonce: nonce,
            data: encodedData,
        };

        const dataToSign = {
            domain: { ...EIP712_DOMAIN, chainId: chain.id, verifyingContract: FORWARDER_ADDRESS },
            types: FORWARD_REQUEST_TYPES,
            primaryType: 'ForwardRequest',
            message: request
        };
        console.log("Final data packet for signing:", dataToSign);

        const signature = await signTypedDataAsync(dataToSign);

        setStatus({ message: t.status_relaying || 'Отправка голоса через релеер...', type: 'pending' });
        
        const response = await fetch('https://nrt-relayer.onrender.com/api/relay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request, signature }, replacer),
        });

        if (!response.ok) {
          const errorBody = await response.json();
          throw new Error(errorBody.error || `Server responded with ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            let successMessage = t.status_vote_relayed || '✅ Vote sent successfully!';
            if (result.txHash) {
                successMessage = `${t.status_vote_relayed || '✅ Vote sent! Hash:'} ${result.txHash.slice(0, 10)}...`;
            }
            setStatus({ message: successMessage, type: 'success' });
        } else {
            throw new Error(result.error || 'Relayer error');
        }

    } catch (error) {
        console.error("Meta-tx error:", error);
        setStatus({ message: `${t.status_error || '❌ Ошибка:'} ${error.message}`, type: 'error' });
    }
  };
 
  const submitVote = (isMetaTx) => {
    if (proposal.voteType === VOTE_TYPE.SINGLE_CHOICE) {
      if (!selectedCandidate) return;
      isMetaTx ? handleMetaTxVote([selectedCandidate]) : handleVote([selectedCandidate]);
    } else if (proposal.voteType === VOTE_TYPE.CUMULATIVE) {
      const candidatesToVoteFor = [];
      const weightsToVoteFor = [];
      for (const candidate in weights) {
        if (parseFloat(weights[candidate]) > 0) {
          candidatesToVoteFor.push(candidate);
          weightsToVoteFor.push(parseUnits(weights[candidate], 18));
        }
      }
      if (candidatesToVoteFor.length === 0) return;
      isMetaTx ? handleMetaTxVote([candidatesToVoteFor, weightsToVoteFor]) : handleVote([candidatesToVoteFor, weightsToVoteFor]);
    }
  };

  if (isLoading) return <div className="main-column card">Loading proposal data...</div>;
  if (isError || !proposal) return <div className="main-column card">Error: Could not load data.</div>;

  const tokenDecimals = 18;
  const userNrtBalance = nrtBalanceRaw ? Number(formatUnits(nrtBalanceRaw, tokenDecimals)) : 0;
 
  const candidates = proposal.candidates || [];
  const votes = scores || [];
 
  const isProposalTimeActive = Math.floor(Date.now() / 1000) < proposal.endTime;
  const isVotingActive = proposal.status === PROPOSAL_STATUS.Active && isProposalTimeActive;
 
  const isVoting = status.type === 'pending';
  const canVote = isConnected && isVotingActive && !hasUserVoted;

  const isSubmissionDisabled = 
    isVoting || !canVote ||
    (proposal.voteType === VOTE_TYPE.SINGLE_CHOICE && !selectedCandidate) ||
    (proposal.voteType === VOTE_TYPE.CUMULATIVE && (totalWeight === 0 || totalWeight > userNrtBalance));

  return (
    <div className="main-column">
      <div className="card">
        <button onClick={() => navigate('/voting')} className="button" style={{ marginBottom: '1.5rem' }}>
          &larr; {t.back_to_list || "Back to list"}
        </button>
        <h2 className="card__title">{parsedMetadata.title}</h2>

        {parsedMetadata.description && (
          <p className="proposal-description" style={{ marginTop: '0.5rem', marginBottom: '1.5rem', color: '#4b5563', whiteSpace: 'pre-wrap' }}>
            {parsedMetadata.description}
          </p>
        )}

        <CountdownTimer endTime={Number(proposal.endTime)} t={t} />

        {/* --- НОВЫЙ КОД: Отображение количества проголосовавших --- */}
        <div className="voter-count-section" style={{ margin: '1rem 0' }}>
            {isLoadingVoterCount ? (
                <span>{t.loading_voters || "Loading voter count..."}</span>
            ) : (
                <span style={{ fontWeight: 'bold' }}>
                    {t.total_voters || "Total Voters:"} {voterCount?.toString() || 0}
                </span>
            )}
        </div>
        {/* --- КОНЕЦ НОВОГО КОДА --- */}
        
        <div className="results-section" style={{ marginBottom: '2rem' }}>
          <h3>{t.current_results || "Current Results:"}</h3>
          {candidates.length > 0 ? (
            candidates.map((candidate, index) => (
              <div key={candidate}>
                <span>{parsedMetadata.candidateNames[candidate] || <code>{candidate}</code>}</span>: 
                <strong> {formatUnits(votes[index] || 0n, tokenDecimals)} {t.votes_suffix || "votes"}</strong>
              </div>
            ))
          ) : <p>{t.no_candidates || "Candidates not found."}</p>}
        </div>

        {isVotingActive ? (
            isConnected ? (
                hasUserVoted ? (
                    <p>{t.you_have_voted || "You have already voted in this proposal."}</p>
                ) : (
                    <div className="voting-interface">
                        <h3>{t.cast_your_vote || "Cast Your Vote:"}</h3>
                        <VotingPowerExplanation t={t} />
                        {proposal.voteType === VOTE_TYPE.SINGLE_CHOICE && (
                          <VoteSingleChoice candidates={candidates} candidateNames={parsedMetadata.candidateNames} selectedCandidate={selectedCandidate} onSelectCandidate={setSelectedCandidate} />
                        )}
                        {proposal.voteType === VOTE_TYPE.CUMULATIVE && (
                          <VoteCumulative candidates={candidates} candidateNames={parsedMetadata.candidateNames} weights={weights} onWeightChange={(candidate, value) => {
                                const newWeights = {...weights};
                                let sanitizedValue = value.replace(',', '.').replace(/[^0-9.]/g, '');
                                const parts = sanitizedValue.split('.');
                                if (parts.length > 2) {
                                    sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
                                }
                                newWeights[candidate] = sanitizedValue;
                                setWeights(newWeights);
                            }} userNrtBalance={userNrtBalance} isVoting={isVoting} />
                        )}
                        
                        <div className="submission-buttons" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button className="button button--secondary" onClick={() => submitVote(true)} disabled={isSubmissionDisabled}>
                                {t.submit_vote_free || "Submit (Free)"}
                            </button>
                            <button className="button button--primary" onClick={() => submitVote(false)} disabled={isSubmissionDisabled}>
                                {t.submit_vote_paid || "Submit (Pay Gas)"}
                            </button>
                        </div>

                        {status.message && <p style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '1rem' }}>{status.message}</p>}
                    </div>
                )
            ) : (
                <p>Please connect your wallet to vote.</p>
            )
        ) : (
          <p>{t.voting_not_active || "Voting is not active."}</p>
        )}
      </div>
    </div>
  );
}