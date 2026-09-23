import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';
import { useNow } from '../hooks/useNow';
import { dateStamp, timeAgo } from '../utils';
import Topbar from './Topbar';

function downloadCsv(data) {
  const headers = Object.keys(data[0]);
  const escapeCell = (value) => '"' + String(value).replace(/"/g, '""') + '"';
  const lines = [headers.join(',')].concat(
    data.map((row) => headers.map((header) => escapeCell(row[header])).join(',')),
  );
  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'huddle-wall-ideas-' + dateStamp() + '.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function HostTable() {
  const navigate = useNavigate();
  const now = useNow();
  const { buckets, setSession, clearSession, toast, updatePost, deletePost } = useHuddle();
  const [bucketFilter, setBucketFilter] = useState('all');
  const [authorFilter, setAuthorFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    setSession({ role: 'host', view: 'table' });
  }, [setSession]);

  const authors = useMemo(() => {
    const names = new Set(buckets.flatMap((bucket) => bucket.posts.map((post) => post.author)));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [buckets]);

  useEffect(() => {
    if (bucketFilter !== 'all' && !buckets.some((bucket) => bucket.id === bucketFilter)) {
      setBucketFilter('all');
    }
    if (authorFilter !== 'all' && !authors.includes(authorFilter)) {
      setAuthorFilter('all');
    }
  }, [authors, authorFilter, bucketFilter, buckets]);

  const rows = useMemo(() => {
    let list = buckets.flatMap((bucket) => bucket.posts.map((post) => ({
      bucketId: bucket.id,
      bucketName: bucket.name,
      postId: post.id,
      author: post.author,
      text: post.text,
      color: post.color,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })));

    if (bucketFilter !== 'all') list = list.filter((row) => row.bucketId === bucketFilter);
    if (authorFilter !== 'all') list = list.filter((row) => row.author === authorFilter);
    const needle = query.trim().toLowerCase();
    if (needle) {
      list = list.filter((row) => (
        row.text.toLowerCase().includes(needle) || row.author.toLowerCase().includes(needle)
      ));
    }

    list.sort((a, b) => {
      let left = a[sort.key];
      let right = b[sort.key];
      if (sort.key === 'createdAt' || sort.key === 'updatedAt') {
        left = new Date(left).getTime();
        right = new Date(right).getTime();
      } else {
        left = (left || '').toString().toLowerCase();
        right = (right || '').toString().toLowerCase();
      }
      if (left < right) return sort.dir === 'asc' ? -1 : 1;
      if (left > right) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [authorFilter, bucketFilter, buckets, query, sort]);

  const total = buckets.reduce((count, bucket) => count + bucket.posts.length, 0);
  const filtered = rows.length !== total;

  function toggleSort(key) {
    setSort((current) => {
      if (current.key === key) {
        return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: key === 'createdAt' || key === 'updatedAt' ? 'desc' : 'asc' };
    });
  }

  function arrowFor(key) {
    if (sort.key !== key) return '';
    return sort.dir === 'asc' ? '▲' : '▼';
  }

  function startEdit(row) {
    setEditingId(row.postId);
    setDraft(row.text);
  }

  async function saveEdit(row) {
    const result = await updatePost(row.postId, draft);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    setEditingId(null);
    toast('Idea updated');
  }

  async function removeRow(row) {
    if (!window.confirm('Remove this idea from the wall?')) return;
    const result = await deletePost(row.postId);
    if (!result.ok) {
      toast(result.error);
      return;
    }
    if (editingId === row.postId) setEditingId(null);
    toast('Idea deleted');
  }

  function clearFilters() {
    setBucketFilter('all');
    setAuthorFilter('all');
    setQuery('');
  }

  async function exportTable() {
    if (rows.length === 0) {
      toast('No ideas to export');
      return;
    }
    const data = rows.map((row) => ({
      Bucket: row.bucketName,
      Idea: row.text,
      Author: row.author,
      Posted: new Date(row.createdAt).toLocaleString(),
      Updated: row.updatedAt !== row.createdAt ? new Date(row.updatedAt).toLocaleString() : '',
    }));

    try {
      const XLSX = await import('xlsx');
      const sheet = XLSX.utils.json_to_sheet(data);
      sheet['!cols'] = [{ wch: 24 }, { wch: 60 }, { wch: 18 }, { wch: 20 }, { wch: 20 }];
      const book = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(book, sheet, 'Ideas');
      XLSX.writeFile(book, 'huddle-wall-ideas-' + dateStamp() + '.xlsx');
      toast('Exported ' + rows.length + ' idea' + (rows.length === 1 ? '' : 's') + ' to Excel');
    } catch {
      downloadCsv(data);
      toast('Exported ' + data.length + ' idea' + (data.length === 1 ? '' : 's') + ' to CSV (opens in Excel)');
    }
  }

  function exit() {
    clearSession();
    navigate('/');
  }

  return (
    <section className="screen">
      <Topbar
        pill="Host · Table view"
        actions={(
          <>
            <button type="button" className="btn ghost" onClick={exit}>Exit</button>
            <button type="button" className="btn ghost" onClick={() => navigate('/host')}>← Buckets</button>
          </>
        )}
      />
      <div className="content wide">
        <div className="section-head">
          <div>
            <h2>All ideas</h2>
            <div className="sub">
              {rows.length} idea{rows.length === 1 ? '' : 's'}
              {filtered ? ' matching filters' : ''}
              {' '}across {buckets.length} bucket{buckets.length === 1 ? '' : 's'}
            </div>
          </div>
          <button type="button" className="btn primary small" onClick={exportTable}>⬇ Export to Excel</button>
        </div>
        <div className="table-filters">
          <div className="field grow">
            <label className="field-label" htmlFor="tableSearch">Search idea or author</label>
            <input
              id="tableSearch"
              className="input"
              placeholder="Search..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="tableBucket">Bucket</label>
            <select
              id="tableBucket"
              className="input"
              value={bucketFilter}
              onChange={(event) => setBucketFilter(event.target.value)}
            >
              <option value="all">All buckets</option>
              {buckets.map((bucket) => (
                <option key={bucket.id} value={bucket.id}>{bucket.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="tableAuthor">Author</label>
            <select
              id="tableAuthor"
              className="input"
              value={authorFilter}
              onChange={(event) => setAuthorFilter(event.target.value)}
            >
              <option value="all">All authors</option>
              {authors.map((author) => (
                <option key={author} value={author}>{author}</option>
              ))}
            </select>
          </div>
          <div className="field compact">
            <button type="button" className="btn ghost full" onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
        <div className="table-scroll">
          <table className="ideas-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort('bucketName')}>Bucket<span className="sort-arrow">{arrowFor('bucketName')}</span></th>
                <th onClick={() => toggleSort('text')}>Idea<span className="sort-arrow">{arrowFor('text')}</span></th>
                <th onClick={() => toggleSort('author')}>Author<span className="sort-arrow">{arrowFor('author')}</span></th>
                <th onClick={() => toggleSort('createdAt')}>Posted<span className="sort-arrow">{arrowFor('createdAt')}</span></th>
                <th onClick={() => toggleSort('updatedAt')}>Updated<span className="sort-arrow">{arrowFor('updatedAt')}</span></th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="empty-table-row">
                  <td colSpan={6}>No ideas match these filters.</td>
                </tr>
              ) : rows.map((row) => (
                <tr key={row.postId}>
                  <td className="bucket-cell">{row.bucketName}</td>
                  <td className="idea-cell">
                    {editingId === row.postId ? (
                      <textarea
                        maxLength={1000}
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="idea-text-row">
                        <span className="swatch-dot" style={{ background: row.color }} />
                        <span>{row.text}</span>
                      </div>
                    )}
                  </td>
                  <td>{row.author}</td>
                  <td>{timeAgo(row.createdAt, now)}</td>
                  <td>{row.updatedAt !== row.createdAt ? timeAgo(row.updatedAt, now) : '—'}</td>
                  <td className="table-row-actions">
                    {editingId === row.postId ? (
                      <>
                        <button type="button" className="save" onClick={() => saveEdit(row)}>Save</button>
                        <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startEdit(row)}>Edit</button>
                        <button type="button" className="delete" onClick={() => removeRow(row)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
