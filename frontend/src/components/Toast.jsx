export default function Toast({ notice, error }) {
  return (
    <>
      {notice && <div className="toast success">{notice}</div>}
      {error && <div className="toast error">{error}</div>}
    </>
  );
}
