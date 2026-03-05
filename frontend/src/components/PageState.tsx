'use client';

export function LoadingState() {
  return (
    <div className="card">
      <div className="skeleton" style={{ width: 180, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: '100%', marginBottom: 8 }} />
      <div className="skeleton" style={{ width: '75%' }} />
    </div>
  );
}

export function UnavailableState({ message }: { message: string }) {
  return (
    <div className="card">
      <strong>Unavailable</strong>
      <p>{message}</p>
    </div>
  );
}
