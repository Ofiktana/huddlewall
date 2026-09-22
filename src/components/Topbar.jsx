export default function Topbar({ title = 'Huddle Wall', pill, actions }) {
  return (
    <div className="topbar">
      <div className="brand">
        <span className="mark">hw</span>
        <span className="name">{title}</span>
        {pill ? <span className="role-pill">{pill}</span> : null}
      </div>
      <div className="topbar-actions">{actions}</div>
    </div>
  );
}
