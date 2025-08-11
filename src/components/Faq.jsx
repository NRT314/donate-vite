export default function Faq({ t }) {
  if (!t.faq_questions || t.faq_questions.length === 0) {
    return null;
  }
  return (
    <section className="sidebar-card">
      <h2 className="sidebar-card__title">{t.faq_title}</h2>
      <div>
        {t.faq_questions.map((item, index) => (
          <details key={index} className="faq-item">
            <summary>{item.q}</summary>
            <div className="faq-answer" dangerouslySetInnerHTML={{ __html: item.a }}></div>
          </details>
        ))}
      </div>
    </section>
  );
}