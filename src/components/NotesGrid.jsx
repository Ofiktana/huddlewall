import NoteCard from './NoteCard';

export default function NotesGrid({ bucket, canEdit }) {
  if (bucket.posts.length === 0) {
    return <div className="empty-note">No ideas on this wall yet. Be the first to post one.</div>;
  }

  return (
    <div className="notes-grid">
      {bucket.posts.map((post, index) => (
        <NoteCard
          key={post.id}
          post={post}
          index={index}
          canEdit={canEdit(post)}
        />
      ))}
    </div>
  );
}
