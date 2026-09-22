import { useEffect, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';
import { useNow } from '../hooks/useNow';
import { timeAgo } from '../utils';
import NotesGrid from './NotesGrid';
import Topbar from './Topbar';

export default function HostBoard() {
  const { bucketId } = useParams();
  const navigate = useNavigate();
  const now = useNow();
  const { buckets, loading, setSession } = useHuddle();
  const bucket = buckets.find((item) => item.id === bucketId);
  const [openedAt] = useState(() => new Date().toISOString());

  useEffect(() => {
    if (!bucket) return;
    setSession({ role: 'host', view: 'board', bucketId: bucket.id });
  }, [bucket, setSession]);

  if (loading) return <section className="screen center"><div className="empty-note">Loading wall…</div></section>;
  if (!bucket) return <Navigate to="/host" replace />;

  return (
    <section className="screen">
      <Topbar
        title={bucket.name}
        pill="Host view"
        actions={(
          <>
            <span className="code-chip">{bucket.code}</span>
            <button type="button" className="btn ghost" onClick={() => navigate('/host/table')}>Table view</button>
            <button type="button" className="btn ghost" onClick={() => navigate('/host')}>← All buckets</button>
          </>
        )}
      />
      <div className="board-wrap">
        <div className="board-toolbar">
          <div className="board-title">
            <h2>Live wall</h2>
            <span className="live-dot" />
          </div>
          <div className="board-updated">Updated {timeAgo(openedAt, now)}</div>
        </div>
        <NotesGrid bucket={bucket} canEdit={() => true} />
      </div>
    </section>
  );
}
