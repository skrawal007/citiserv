export default function LoadingOverlay({ message = 'Uploading...' }) {
  return (
    <div className="opacity-overlay">
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" />
        <p className="overlay-text">{message}</p>
      </div>
    </div>
  );
}
