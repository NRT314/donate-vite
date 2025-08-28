export default function ContractDetails({ t, onBack }) {
  const pageContent = t.contract_details_page;

  return (
    <div className="details-page-container">
      <h1>{pageContent.title}</h1>

      <div>
        <p>{pageContent.intro_p1}</p>
        <p>{pageContent.intro_p2}</p>

        {/* --- БЛОК С ССЫЛКОЙ НА WHITEPAPER --- */}
        <div style={{
          margin: '2rem 0',
          padding: '1rem',
          backgroundColor: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <a
            href="/whitepaper.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#1d4ed8',
              fontWeight: '600',
              textDecoration: 'underline'
            }}
          >
            📄 WhitePaper
          </a>
        </div>
        {/* ------------------------------------ */}

        <h2>{pageContent.core_components_title}</h2>

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

        <h2>{pageContent.security_title}</h2>
        <p>{pageContent.security_p1}</p>
        <ul>
          <li>✅ <b>{pageContent.security_li1_strong}</b> {pageContent.security_li1_text}</li>
          <li>✅ <b>{pageContent.security_li2_strong}</b> {pageContent.security_li2_text}</li>
          <li>✅ <b>{pageContent.security_li3_strong}</b> {pageContent.security_li3_text}</li>
        </ul>
      </div>
      <div style={{marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee', textAlign: 'center'}}>
        <button onClick={onBack} style={{color: '#2563eb', textDecoration: 'underline'}}>
          &larr; {pageContent.back_link}
        </button>
      </div>
    </div>
  );
}