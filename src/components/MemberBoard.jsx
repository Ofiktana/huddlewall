import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';
import { useNow } from '../hooks/useNow';
import { NOTE_COLORS, timeAgo } from '../utils';
import NotesGrid from './NotesGrid';
import Topbar from './Topbar';

export default function MemberBoard() {
  const { bucketId } = useParams();
  const navigate = useNavigate();
  const now = useNow();
  const { buckets, session, setSession, toast, addPost } = useHuddle();
  const bucket = buckets.find((item) => item.id === bucketId);
  const [text, setText] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0]);
  const [openedAt] = useState(() => new Date().toISOString());

  if (!bucket) return <Navigate to="/join" replace />;
  if (session.role !== 'member' || session.bucketId !== bucket.id || !session.memberName || !session.token) {
    return <Navigate to="/join" replace />;
  }

  function handlePost() {
    const trimmed = text.trim();
    if (!trimmed) {
      toast('Write an idea before posting');
      return;
    }
    addPost(bucket.id, {
      author: session.memberName,
      token: session.token,
      text: trimmed,
      color,
    });
    setText('');
    toast('Idea posted to the wall');
  }

  function switchBucket() {
    setSession({ role: 'member', memberName: session.memberName });
    navigate('/join');
  }

  return (
    <section className="screen">
      <Topbar
        title={bucket.name}
        pill={session.memberName}
        actions={(
          <button type="button" className="btn ghost" onClick={switchBucket}>Switch bucket</button>
        )}
      />
      <div className="board-wrap">
        <div className="composer">
          <label className="field-label" htmlFor="composerText">Drop an idea on the wall</label>
          <textarea
            id="composerText"
            placeholder="Type your idea..."
            maxLength={220}
            value={text}
            onChange={(event) => setText(event.target.value)}
          />
          <div className="composer-foot">
            <div className="swatches">
              {NOTE_COLORS.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={swatch === color ? 'swatch selected' : 'swatch'}
                  style={{ background: swatch }}
                  aria-label={'Note color ' + swatch}
                  onClick={() => setColor(swatch)}
                />
              ))}
            </div>
            <button type="button" className="btn primary" onClick={handlePost}>Post idea</button>
          </div>
        </div>
        <div className="board-toolbar">
          <div className="board-title">
            <h2>The wall</h2>
            <span className="live-dot" />
          </div>
          <div className="board-updated">Updated {timeAgo(openedAt, now)}</div>
        </div>
        <NotesGrid
          bucket={bucket}
          canEdit={(post) => post.token === session.token}
        />
      </div>
    </section>
  );
}
