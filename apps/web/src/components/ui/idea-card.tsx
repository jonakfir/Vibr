export function IdeaCard({
  idea,
  sector,
  name,
  description,
  metadata,
  selected,
  onSelect,
  ...rest
}: {
  idea?: any;
  sector?: string;
  name?: string;
  description?: string;
  metadata?: any;
  selected?: boolean;
  onSelect?: () => void;
  [key: string]: any;
}) {
  const displayName = name || idea?.name || "Idea";
  const displayDesc = description || idea?.description || "";
  const displaySector = sector || idea?.category || "";

  return (
    <div
      className={`bg-card border p-6 rounded-[4px] cursor-pointer transition-colors duration-300 ${
        selected ? "border-accent" : "border-card-border hover:border-muted"
      }`}
      onClick={onSelect}
      {...rest}
    >
      {displaySector && (
        <span className="font-body text-[10px] uppercase tracking-widest text-muted/60">{displaySector}</span>
      )}
      <h3 className="font-heading font-light text-[24px] text-foreground mt-1">{displayName}</h3>
      {displayDesc && <p className="font-body text-small text-muted mt-2">{displayDesc}</p>}
      {metadata && (
        <div className="mt-3 flex gap-4">
          {Object.entries(metadata).map(([k, v]) => (
            <div key={k}>
              <p className="font-body text-[10px] text-muted/50 uppercase">{k}</p>
              <p className="font-body text-small text-foreground/80">{String(v)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IdeaCard;
