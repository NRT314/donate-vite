export default function Plans({ t }) {
  return (
    <section className="sidebar-card">
      <h2 className="sidebar-card__title">{t.plans_title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: '600' }}>{t.plans_section_short_term_title}</h3>
          <p dangerouslySetInnerHTML={{ __html: t.plans_section_short_term_text }}></p>
        </div>
        <div>
          <h3 style={{ fontWeight: '600' }}>{t.plans_section_global_title}</h3>
          <p dangerouslySetInnerHTML={{ __html: t.plans_section_global_text }}></p>
        </div>
      </div>
    </section>
  );
}