export default function About({ t }) {
  return (
    <section className="sidebar-card">
      <h2 className="sidebar-card__title">{t.about_title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <h3 style={{ fontWeight: '600' }}>{t.about_section_idea_title}</h3>
          <p dangerouslySetInnerHTML={{ __html: t.about_section_idea_text }}></p>
        </div>
        <div>
          <h3 style={{ fontWeight: '600' }}>{t.about_section_why_polygon_title}</h3>
          <p dangerouslySetInnerHTML={{ __html: t.about_section_why_polygon_text }}></p>
        </div>
        <div>
          <h3 style={{ fontWeight: '600' }}>{t.about_section_what_is_nrt_title}</h3>
          <p dangerouslySetInnerHTML={{ __html: t.about_section_what_is_nrt_text }}></p>
        </div>
      </div>
    </section>
  );
}