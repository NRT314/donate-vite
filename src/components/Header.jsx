// src/components/Header.jsx
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Header({ t, lang, setLang }) {
  return (
    <header className="header">
      <div className="header-top-row">
        {/* Центральная группа для ПК, которая будет идеально по центру */}
        <div className="header-center-group">
          <img src="/logo.png" alt="NRT Logo" className="header-logo"/>
          <h1 className="header-title">{t.title}</h1>
        </div>
        
        {/* Правая группа, которая на ПК будет позиционироваться абсолютно */}
        <div className="header-right-group">
          <div className="header-lang-switcher">
            <button onClick={() => setLang('en')} className={`lang-btn ${lang === 'en' ? 'active' : ''}`}>EN</button>
            <button onClick={() => setLang('ru')} className={`lang-btn ${lang === 'ru' ? 'active' : ''}`}>RU</button>
          </div>
          <ConnectButton />
        </div>
      </div>
      
      {/* Текст под шапкой */}
      <div className="header-description">
        <p dangerouslySetInnerHTML={{ __html: t.description }}></p>
        <p dangerouslySetInnerHTML={{ __html: t.exchange_rate_text }}></p>
      </div>
    </header>
  );
}