export default function ContractDetails({ t, onBack }) {
  const pageContent = t.contract_details_page;

  return (
    <div className="details-page-container">
      <h1>
        <a
          href="/whitepaper.pdf"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: 'inherit',
            textDecoration: 'underline'
          }}
        >
          {pageContent.title} 📄
        </a>
      </h1>

      <div>
        {/* --- СЕКЦИЯ 1: КОНТРАКТ ПОЖЕРТВОВАНИЙ --- */}
        <h2>{pageContent.donations_contract_title}</h2>
        <p>{pageContent.intro_p1}</p>
        <p>{pageContent.intro_p2}</p>

        <h3>{pageContent.nrt_token_title}</h3>
        <ul>
          <li><b>{pageContent.nrt_token_li1_strong}</b> {pageContent.nrt_token_li1_text}</li>
          <li><b>{pageContent.nrt_token_li2_strong}</b> {pageContent.nrt_token_li2_text}</li>
          <li><b>{pageContent.nrt_token_li3_strong}</b> {pageContent.nrt_token_li3_text}</li>
        </ul>

        <h3>{pageContent.donation_process_title}</h3>
        <ul>
          <li>{pageContent.donation_process_li1}</li>
          <li>
            <b>{pageContent.donation_process_li2_strong}</b>
            <ul>
              <li><b>{pageContent.donation_process_li2_sub1_strong}</b> {pageContent.donation_process_li2_sub1_text}</li>
              <li><b>{pageContent.donation_process_li2_sub2_strong}</b> {pageContent.donation_process_li2_sub2_text}</li>
            </ul>
          </li>
          <li><b>{pageContent.donation_process_li3_strong}</b> {pageContent.donation_process_li3_text}</li>
          <li><b>{pageContent.donation_process_li4_strong}</b> {pageContent.donation_process_li4_text}</li>
        </ul>

        <h3>{pageContent.whitelists_title}</h3>
        <ul>
            <li><b>{pageContent.whitelists_li1_strong}</b> {pageContent.whitelists_li1_text}</li>
            <li><b>{pageContent.whitelists_li2_strong}</b> {pageContent.whitelists_li2_text}</li>
        </ul>

        <h3>{pageContent.security_title}</h3>
        <p>{pageContent.security_p1}</p>
        <ul>
          <li>✅ <b>{pageContent.security_li1_strong}</b> {pageContent.security_li1_text}</li>
          <li>✅ <b>{pageContent.security_li2_strong}</b> {pageContent.security_li2_text}</li>
          <li>✅ <b>{pageContent.security_li3_strong}</b> {pageContent.security_li3_text}</li>
        </ul>

        <hr style={{margin: '2rem 0'}} />

        {/* --- СЕКЦИЯ 2: КОНТРАКТ ГОЛОСОВАНИЯ --- */}
        <h2>{pageContent.nrtvoting_section_title}</h2>
        <p>{pageContent.nrtvoting_intro}</p>
        
        <h3>{pageContent.nrtvoting_mechanisms_title}</h3>
        <p>{pageContent.nrtvoting_mechanisms_intro}</p>
        <ul>
            <li><b>{pageContent.nrtvoting_mechanisms_cumulative_strong}</b> {pageContent.nrtvoting_mechanisms_cumulative_text}</li>
            <li><b>{pageContent.nrtvoting_mechanisms_single_strong}</b> {pageContent.nrtvoting_mechanisms_single_text}</li>
        </ul>

        <h3>{pageContent.nrtvoting_lifecycle_title}</h3>
        <p>{pageContent.nrtvoting_lifecycle_intro}</p>
        <ul>
            <li><b>{pageContent.nrtvoting_lifecycle_creation_strong}</b> {pageContent.nrtvoting_lifecycle_creation_text}</li>
            <li><b>{pageContent.nrtvoting_lifecycle_execution_strong}</b> {pageContent.nrtvoting_lifecycle_execution_text}</li>
        </ul>

        <h3>{pageContent.nrtvoting_tech_title}</h3>
        <p>{pageContent.nrtvoting_tech_text}</p>

      </div>
      <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center'}}>
        <button onClick={onBack} style={{color: '#2563eb', textDecoration: 'underline'}}>
          &larr; {pageContent.back_link}
        </button>
      </div>
    </div>
  );
}