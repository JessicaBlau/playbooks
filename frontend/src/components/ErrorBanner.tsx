export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" style={{ background: '#fdecea', color: '#611a15', padding: '0.5rem 1rem', borderRadius: 4, marginBottom: '1rem' }}>
      {message}
    </div>
  );
}
