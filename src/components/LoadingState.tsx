export function LoadingState() {
  return (
    <div className="state" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>Recherche en cours…</p>
    </div>
  );
}
