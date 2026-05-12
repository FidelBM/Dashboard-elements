type PlaceholderPageProps = {
  title: string;
  eyebrow: string;
  description: string;
  items?: string[];
};

export function PlaceholderPage({
  title,
  eyebrow,
  description,
  items = [],
}: PlaceholderPageProps) {
  return (
    <section className="page-panel">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{description}</p>
      {items.length > 0 ? (
        <div className="placeholder-grid">
          {items.map((item) => (
            <div className="placeholder-card" key={item}>
              {item}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
