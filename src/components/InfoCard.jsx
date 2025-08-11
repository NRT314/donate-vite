export default function InfoCard({ title, content }) {
  if (!content) return null;
  return (
    <section className="sidebar-card">
      <h2 className="sidebar-card__title">{title}</h2>
      <div dangerouslySetInnerHTML={{ __html: content }}></div>
    </section>
  );
}