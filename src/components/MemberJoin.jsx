import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';

export default function MemberJoin() {
  const navigate = useNavigate();
  const { buckets, session, setSession, identityFor } = useHuddle();
  const [name, setName] = useState(session.memberName || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  function handleJoin(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedName || !trimmedCode) {
      setError('Add your name and the bucket code.');
      return;
    }
    const bucket = buckets.find((item) => item.code === trimmedCode);
    if (!bucket) {
      setError("That code doesn't match a bucket. Check with your host and try again.");
      return;
    }
    setError('');
    setSession({
      role: 'member',
      memberName: trimmedName,
      bucketId: bucket.id,
      token: identityFor(bucket.id, trimmedName),
    });
    navigate('/wall/' + bucket.id);
  }

  return (
    <section className="screen center">
      <div className="join-card">
        <h2>Join a board</h2>
        <p className="hint">Ask your host for the bucket's join code, then add the name you want shown on your ideas.</p>
        <form onSubmit={handleJoin}>
          <div className="field">
            <label className="field-label" htmlFor="joinName">Your name</label>
            <input
              id="joinName"
              className="input"
              placeholder="e.g. Ada"
              maxLength={30}
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="joinCode">Bucket code</label>
            <input
              id="joinCode"
              className="input code"
              placeholder="e.g. OFFSITE24"
              maxLength={20}
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
            />
          </div>
          <button type="submit" className="btn primary full">Join board</button>
          {error ? <div className="join-error">{error}</div> : null}
        </form>
        <footer className="foot-link">
          <button type="button" onClick={() => navigate('/')}>← Back</button>
        </footer>
      </div>
    </section>
  );
}
