import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import useProposals from '../hooks/useProposals';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI, PROPOSAL_STATUS } from '../constants';
import CreateProposalForm from '../components/voting/CreateProposalForm';

// --- ✅ FIX: Made this function more robust to prevent crashes ---
const getStatusInfo = (proposal, t) => {
  // Defensive check for malformed proposal objects
  if (!proposal || typeof proposal.status === 'undefined' || typeof proposal.endTime === 'undefined') {
    console.error("Received malformed proposal object:", proposal);
    return { text: "Unknown", className: "unknown" }; 
  }

  if (proposal.status === PROPOSAL_STATUS.Cancelled) {
    return { text: t.status_cancelled || "Cancelled", className: 'cancelled' };
  }
  if (proposal.status === PROPOSAL_STATUS.Executed) {
    return { text: t.status_executed || "Executed", className: 'executed' };
  }

  const now = Math.floor(Date.now() / 1000);
  if (now > proposal.endTime) {
    // This handles active proposals that have expired but not been executed yet
    return { text: t.status_executed || "Finished", className: 'executed' };
  }
  
  // If none of the above, the proposal is active
  return { text: t.status_active || "Active", className: 'active' };
};

export default function VotingPage({ t, onBack }) {
  const [page, setPage] = useState(1);
  const { address, isConnected } = useAccount();
  const queryClient = useQueryClient();

  const [txHash, setTxHash] = useState(null);
  const { writeContractAsync } = useWriteContract();

  const { isLoading: isTxConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess() {
      console.log('Transaction confirmed!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setTxHash(null);
    }
  });

  const handleCancelProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to cancel this proposal? This action is irreversible.')) return;
    try {
      const hash = await writeContractAsync({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_ABI,
        functionName: 'cancelProposal',
        args: [proposalId],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Error cancelling proposal:", error);
      alert(`Error: ${error.shortMessage || error.message}`);
    }
  };

  const handleToggleVisibility = async (proposalId, newVisibility) => {
    try {
      const hash = await writeContractAsync({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_ABI,
        functionName: 'setProposalVisibility',
        args: [proposalId, newVisibility],
      });
      setTxHash(hash);
    } catch (error) {
      console.error("Error setting visibility:", error);
      alert(`Error: ${error.shortMessage || error.message}`);
    }
  };

  const { data: ownerAddress } = useReadContract({
    address: VOTING_CONTRACT_ADDRESS,
    abi: VOTING_ABI,
    functionName: 'owner',
  });

  const { proposals, isLoading, totalProposals, proposalsPerPage, refetchProposals } = useProposals(page);
  
  const isAdmin = isConnected && ownerAddress && address === ownerAddress;
  const totalPages = Math.ceil(totalProposals / proposalsPerPage);
  
  const proposalsToShow = isAdmin ? (proposals || []) : (proposals?.filter(p => p.isVisible) || []);

  return (
    <div className="main-column">
      <div className="card">
        <button onClick={onBack} className="button" style={{ marginBottom: '1.5rem' }}>
          &larr; {t.back_to_main || "Back to main"}
        </button>
        <h2 className="card__title" style={{ textAlign: 'center' }}>{t.voting_page_title || "Proposals"}</h2>
        
        {isAdmin && (
          <div className="sidebar-card" style={{ margin: '1.5rem 0', border: '1px solid #2563eb', padding: '1rem', borderRadius: '0.5rem' }}>
            <h3 className="sidebar-card__title">{t.voting_admin_title || "Admin Panel"}</h3>
            <CreateProposalForm t={t} onProposalCreated={refetchProposals} />
          </div>
        )}

        <div className="proposals-section">
          <h3 className="card__title" style={{ fontSize: '1.25rem' }}>{t.voting_list_title || "Proposal List"}</h3>
          {isLoading ? ( <p>{t.voting_page_loading || "Loading..."}</p> ) : (
            <>
              {proposalsToShow.length > 0 ? (
                <ul className="proposal-list">
                  {proposalsToShow.map((proposal) => {
                    let title = proposal.metadata; 
                    try { 
                      const p = JSON.parse(proposal.metadata); 
                      if (p && p.title) title = p.title; 
                    } catch (e) {
                      // Keep metadata as is if it's not valid JSON
                    }
                    const statusInfo = getStatusInfo(proposal, t);

                    return (
                      <li key={proposal.id.toString()} className="proposal-list-item-wrapper">
                        <Link to={`/voting/${proposal.id.toString()}`} className="proposal-list-item" style={{ opacity: proposal.isVisible ? 1 : 0.5 }}>
                          <span className="proposal-title">{title}</span>
                          <span className={`proposal-status ${statusInfo.className}`}>
                            {statusInfo.text}
                          </span>
                        </Link>
                        
                        {isAdmin && (
                          <div className="admin-actions">
                            <button
                              className="button button--secondary"
                              onClick={(e) => { e.preventDefault(); handleToggleVisibility(proposal.id, !proposal.isVisible); }}
                              disabled={isTxConfirming}
                            >
                              {proposal.isVisible ? 'Hide' : 'Show'}
                            </button>
                            {proposal.status === PROPOSAL_STATUS.Active && (
                              <button
                                className="button button--danger"
                                onClick={(e) => { e.preventDefault(); handleCancelProposal(proposal.id); }}
                                disabled={isTxConfirming}
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : ( <p>{t.voting_no_proposals || "No proposals yet."}</p> )}
              
              {totalPages > 1 && (
                <div className="pagination">
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                    &larr; {t.prev_page || "Prev"}
                  </button>
                  <span>{t.page || "Page"} {page} / {totalPages}</span>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                    {t.next_page || "Next"} &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}