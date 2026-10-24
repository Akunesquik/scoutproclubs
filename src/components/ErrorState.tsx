interface Props {
  message: string;
  candidates?: { id: string; name: string }[];
}

export function ErrorState({ message, candidates }: Props) {
  return (
    <div className="state state--error" role="alert">
      <p>{message}</p>
      {candidates && candidates.length > 0 && (
        <ul className="candidates">
          {candidates.map((c) => (
            <li key={c.id}>{c.name} — identifiant <code>{c.id}</code></li>
          ))}
        </ul>
      )}
    </div>
  );
}
