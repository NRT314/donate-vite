import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { VOTING_CONTRACT_ADDRESS, VOTING_ABI, VOTE_TYPE } from '../../constants';

export default function CreateProposalForm({ t, onProposalCreated }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState(''); // <-- ADDED: State for description
  const [durationDays, setDurationDays] = useState(7);
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [voteType, setVoteType] = useState(VOTE_TYPE.SINGLE_CHOICE);
  const [candidates, setCandidates] = useState([
    { name: '', address: '0x0000000000000000000000000000000000000001' },
    { name: '', address: '0x0000000000000000000000000000000000000002' },
  ]);
  
  const [statusMessage, setStatusMessage] = useState('');
  const [hash, setHash] = useState(null);
  
  const queryClient = useQueryClient();

  const { writeContractAsync, isPending: isSubmitting } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
    onSuccess(data) {
      console.log("SUCCESS callback fired!", data);
      setStatusMessage('✅ Proposal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      if (onProposalCreated) {
        onProposalCreated();
      }
      // Reset form
      setTitle('');
      setDescription(''); // <-- ADDED: Reset description
      setDurationDays(7);
      setDurationHours(0);
      setDurationMinutes(0);
      setCandidates([
        { name: '', address: '0x0000000000000000000000000000000000000001' },
        { name: '', address: '0x0000000000000000000000000000000000000002' },
      ]);
      setHash(null);
    },
    onError(error) {
      console.error("Confirmation error:", error);
      setStatusMessage(`❌ Confirmation Error: ${error.shortMessage || error.message}`);
      setHash(null);
    }
  });

  useEffect(() => {
    if (isSuccess) {
      const timer = setTimeout(() => setStatusMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);


  const handleAddCandidate = () => {
    const nextCandidateIndex = candidates.length + 1;
    const defaultAddress = `0x${String(nextCandidateIndex).padStart(40, '0')}`;
    setCandidates([...candidates, { name: '', address: defaultAddress }]);
  };

  const handleRemoveCandidate = (index) => {
    const newCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(newCandidates);
  };

  const handleCandidateChange = (index, field, value) => {
    const newCandidates = [...candidates];
    newCandidates[index][field] = value;
    setCandidates(newCandidates);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || candidates.some(c => !c.name || !c.address)) {
      setStatusMessage('Please fill out the title and all candidate fields.');
      return;
    }
    
    setStatusMessage('Please confirm in your wallet...');

    try {
      const durationInSeconds = (durationDays * 86400) + (durationHours * 3600) + (durationMinutes * 60);
      const candidateAddresses = candidates.map(c => c.address);
      const candidateNames = candidates.reduce((acc, c) => { acc[c.address] = c.name; return acc; }, {});
      
      // ADDED: description is now included in the metadata
      const metadata = JSON.stringify({ title, description, candidateNames });

      const txHash = await writeContractAsync({
        address: VOTING_CONTRACT_ADDRESS,
        abi: VOTING_ABI,
        functionName: 'createProposal',
        args: [ BigInt(durationInSeconds), voteType, metadata, candidateAddresses ],
      });
      
      setStatusMessage('Transaction submitted, awaiting confirmation...');
      setHash(txHash);

    } catch (error) {
      console.error("Submission error:", error);
      setStatusMessage(`❌ Error: ${error.shortMessage || error.message}`);
    }
  };

  const isLoading = isSubmitting || isConfirming;
  
  let buttonText = 'Create Proposal';
  if (isSubmitting) {
    buttonText = 'Signing...';
  } else if (isConfirming) {
    buttonText = 'Confirming...';
  }

  return (
    <form onSubmit={handleSubmit} className="create-proposal-form">
      <div className="form-group">
        <label>{t.form_label_title || "Proposal Title"}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* --- ADDED: Description Field --- */}
      <div className="form-group">
        <label>{t.form_label_description || "Description (Optional)"}</label>
        <textarea
          rows="3"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          placeholder="Provide a brief summary of the proposal..."
        ></textarea>
      </div>

      <div className="form-group">
        <label>{t.form_label_duration || "Duration"}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input type="number" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} disabled={isLoading} placeholder="Days" />
          <input type="number" value={durationHours} onChange={e => setDurationHours(Number(e.target.value))} disabled={isLoading} placeholder="Hours" />
          <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} disabled={isLoading} placeholder="Minutes" />
        </div>
      </div>
      
      <div className="form-group">
        <label>{t.form_label_vote_type || "Vote Type"}</label>
        <select value={voteType} onChange={(e) => setVoteType(Number(e.target.value))} disabled={isLoading}>
          <option value={VOTE_TYPE.SINGLE_CHOICE}>Single Choice</option>
          <option value={VOTE_TYPE.CUMULATIVE}>Cumulative</option>
        </select>
      </div>

      <div className="form-group">
        <label>{t.form_label_candidates || "Candidates"}</label>
        {candidates.map((candidate, index) => (
          <div key={index} className="candidate-input-group">
            <input type="text" placeholder={`Candidate Name ${index + 1}`} value={candidate.name} onChange={(e) => handleCandidateChange(index, 'name', e.target.value)} disabled={isLoading} />
            <input type="text" placeholder={`Candidate Address ${index + 1}`} value={candidate.address} onChange={(e) => handleCandidateChange(index, 'address', e.target.value)} disabled={isLoading} />
            <button type="button" onClick={() => handleRemoveCandidate(index)} disabled={isLoading}>&times;</button>
          </div>
        ))}
        <button type="button" onClick={handleAddCandidate} disabled={isLoading}>
          {t.form_add_candidate_button || "Add Candidate"}
        </button>
      </div>
      
      <button type="submit" className="button button--primary" disabled={isLoading}>
        {buttonText}
      </button>

      {statusMessage && <p style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{statusMessage}</p>}
    </form>
  );
}