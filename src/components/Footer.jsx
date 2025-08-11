export default function Footer({ t }) {
  const contractAddress = "0xE61FEb2c3278A6094571ce12177767221cA4b661";
  return (
    <footer className="footer">
      <p>
        <b>{t.technical_details_title}</b>:
        {' '}{t.technical_details_network},{' '}
        {t.technical_details_contract}: <a href={`https://polygonscan.com/address/${contractAddress}`} target="_blank" rel="noopener noreferrer"><code>{contractAddress}</code></a>,
        {' '}{t.technical_details_source_code}: <a href="https://github.com/NRT314/assets/blob/main/contract.sol" target="_blank" rel="noopener noreferrer">github.com/NRT314/assets</a>
      </p>
    </footer>
  );
}