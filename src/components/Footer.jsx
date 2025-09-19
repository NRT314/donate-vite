export default function Footer({ t }) {
  const contractAddress = "0xE61FEb2c3278A6094571ce12177767221cA4b661";
  return (
    <footer className="footer">
      <p>
        <i>{t.technical_details_title}</i>:
        {' '}{t.technical_details_contract}: <a href={`https://polygonscan.com/address/${contractAddress}`} target="_blank" rel="noopener noreferrer"><code>{contractAddress}</code></a>,
        {' '}{t.technical_details_source_code}: <a href="https://github.com/NRT314/donate-vite" target="_blank" rel="noopener noreferrer">github.com/NRT314/donate-vite</a>
        <br />
        <i>{t.social_networks_title}:</i> <a href="https://www.reddit.com/user/NewRussiaToken" target="_blank" rel="noopener noreferrer">Reddit</a>, <a href="https://x.com/newrussiatoken" target="_blank" rel="noopener noreferrer">X (Twitter)</a>
      </p>
    </footer>
  );
}