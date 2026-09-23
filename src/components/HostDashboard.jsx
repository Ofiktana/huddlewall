import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';
import { useNow } from '../hooks/useNow';
import { copyText, genCode, timeAgo } from '../utils';
import Modal from './Modal';
import Topbar from './Topbar';

export default function HostDashboard() {
  const navigate = useNavigate();
  const now = useNow();
  const {
    buckets,
    loading,
    loadError,
    setSession,
    clearSession,
    toast,
    createBucket,
    renameBucket,
    regenerateCode,
    deleteBucket,
  } = useHuddle();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCode, setNewCode] = useState('');
  const [renameId, setRenameId] = useState(null);
  const [renameName, setRenameName] = useState('');

  useEffect(() => {
    setSession({ role: 'host', view: 'dashboard' });
  }, [setSession]);

  const closeCreate = useCallback(() => setCreating(false), []);
  const closeRename = useCallback(() => setRenameId(null), []);

  function openCreate() {
    setNewName('');
    setNewCode(genCode());
    setCreating(true);
  }

  async function submitCreate(event) {
    event.preventDefault();
    const result = await createBucket(newName, newCode);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    setCreating(false);
    toast('Bucket created');
  }

  function openRename(bucket) {
    setRenameId(bucket.id);
    setRenameName(bucket.name);
  }

  async function submitRename(event) {
    event.preventDefault();
    const result = await renameBucket(renameId, renameName);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    setRenameId(null);
    toast('Bucket renamed');
  }

  async function handleNewCode(bucket) {
    if (!window.confirm('Generate a new code for "' + bucket.name + '"? The old code will stop working.')) return;
    const result = await regenerateCode(bucket.id);
    toast(result.ok ? 'New code: ' + result.code : result.error);
  }

  async function handleDelete(bucket) {
    if (!window.confirm('Delete "' + bucket.name + '" and all its ideas? This cannot be undone.')) return;
    const result = await deleteBucket(bucket.id);
    toast(result.ok ? 'Bucket deleted' : result.error);
  }

  async function handleCopy(code) {
    const copied = await copyText(code);
    toast(copied ? 'Code copied: ' + code : 'Code: ' + code);
  }

  function exit() {
    clearSession();
    navigate('/');
  }

  return (
    <section className="screen">
      <Topbar
        pill="Host"
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={exit}>Exit</button>
            <button type="button" className="btn ghost" onClick={() => navigate('/host/table')}>Table view</button>
            <button type="button" className="btn primary" onClick={openCreate}>+ New bucket</button>
          </>
        )}
      />
      <div className="content">
        <div className="section-head">
          <div>
            <h2>Your buckets</h2>
            <div className="sub">Each bucket has its own join code. Share the code for the topic you want the team posting to.</div>
          </div>
        </div>
        {loadError ? <div className="empty-note">{loadError}</div> : null}
        {loading ? (
          <div className="empty-note">Loading buckets…</div>
        ) : buckets.length === 0 ? (
          <div className="empty-note">No buckets yet. Create one to start collecting ideas.</div>
        ) : (
          <div className="bucket-grid">
            {buckets.map((bucket) => (
              <article key={bucket.id} className="bucket-card">
                <div>
                  <h4>{bucket.name}</h4>
                  <div className="bucket-meta bucket-meta-spaced">
                    <span>{bucket.posts.length} idea{bucket.posts.length === 1 ? '' : 's'}</span>
                    <span>created {timeAgo(bucket.createdAt, now)}</span>
                  </div>
                </div>
                <span className="code-chip">
                  {bucket.code}
                  <button type="button" title="Copy code" onClick={() => handleCopy(bucket.code)}>copy</button>
                </span>
                <div className="row">
                  <button
                    type="button"
                    className="btn primary small"
                    onClick={() => navigate('/host/board/' + bucket.id)}
                  >
                    Open big screen
                  </button>
                </div>
                <div className="row">
                  <button type="button" className="btn ghost small" onClick={() => openRename(bucket)}>Rename</button>
                  {/* <button type="button" className="btn ghost small" onClick={() => handleNewCode(bucket)}>New code</button> */}
                  <button type="button" className="btn danger small" onClick={() => handleDelete(bucket)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {creating ? (
        <Modal title="New bucket" onClose={closeCreate}>
          <form onSubmit={submitCreate}>
            <div className="field">
              <label className="field-label" htmlFor="newBucketName">Bucket name</label>
              <input
                id="newBucketName"
                className="input"
                placeholder="e.g. Hackathon Ideas"
                maxLength={60}
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                autoFocus
              />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="newBucketCode">Join code</label>
              <input
                id="newBucketCode"
                className="input code"
                maxLength={20}
                value={newCode}
                onChange={(event) => setNewCode(event.target.value.toUpperCase())}
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={closeCreate}>Cancel</button>
              <button type="submit" className="btn primary">Create bucket</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {renameId ? (
        <Modal title="Rename bucket" onClose={closeRename}>
          <form onSubmit={submitRename}>
            <div className="field">
              <label className="field-label" htmlFor="renameBucketName">Bucket name</label>
              <input
                id="renameBucketName"
                className="input"
                maxLength={60}
                value={renameName}
                onChange={(event) => setRenameName(event.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button type="button" className="btn ghost" onClick={closeRename}>Cancel</button>
              <button type="submit" className="btn primary">Save</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}
