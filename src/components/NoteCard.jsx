import { useState } from 'react';
import { useHuddle } from '../context/HuddleContext';

export default function NoteCard({ post, index, canEdit }) {
  const { toast, updatePost, deletePost } = useHuddle();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(post.text);
  const tilt = ((index * 37) % 7) - 3;
  const edited = post.updatedAt !== post.createdAt;

  async function save() {
    const result = await updatePost(post.id, draft);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    setEditing(false);
    toast('Idea updated');
  }

  async function remove() {
    if (!window.confirm('Remove this idea from the wall?')) return;
    const result = await deletePost(post.id);
    toast(result.ok ? 'Idea deleted' : result.error);
  }

  return (
    <article
      className={'note' + (editing ? ' editing' : '') + (canEdit ? '' : ' locked')}
      style={{ '--tilt': tilt + 'deg', background: post.color }}
    >
      <span className="pin" />
      {editing ? (
        <>
          <textarea
            className="edit-area"
            maxLength={220}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            autoFocus
          />
          <div className="edit-controls">
            <button type="button" className="save" onClick={save}>Save</button>
            <button type="button" onClick={() => { setDraft(post.text); setEditing(false); }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div className="note-text">{post.text}</div>
          <div className="note-foot">
            <span className="author">{post.author}{edited ? ' · edited' : ''}</span>
            {canEdit ? (
              <span className="note-actions">
                <button type="button" title="Edit" onClick={() => { setDraft(post.text); setEditing(true); }}>✎</button>
                <button type="button" title="Delete" onClick={remove}>✕</button>
              </span>
            ) : (
              <span className="lock">🔒</span>
            )}
          </div>
        </>
      )}
    </article>
  );
}
