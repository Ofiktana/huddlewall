import { useNavigate } from 'react-router-dom';
import { useHuddle } from '../context/HuddleContext';

export default function RoleSelect() {
  const navigate = useNavigate();
  const { setSession } = useHuddle();

  function openHost() {
    setSession({ role: 'host', view: 'dashboard' });
    navigate('/host');
  }

  function openJoin() {
    setSession({ role: 'member' });
    navigate('/join');
  }

  return (
    <section className="screen center">
      <div className="role-hero">
        <span className="mark">huddle wall</span>
        <h1>Get every idea on the wall.</h1>
        <p>Spin up a board, share the code, and watch ideas roll in. No sign-ups — just a name and a code.</p>
      </div>
      <div className="role-cards">
        <button type="button" className="role-card host" onClick={openHost}>
          <div className="tag">HOST</div>
          <h3>Run a session</h3>
          <p>Create buckets for each topic, generate a join code for each one, and project the live wall on the big screen.</p>
          <div className="go">Open host dashboard →</div>
        </button>
        <button type="button" className="role-card member" onClick={openJoin}>
          <div className="tag">TEAM MEMBER</div>
          <h3>Post your ideas</h3>
          <p>Enter the code your host shared, add your name, and start dropping ideas onto the wall.</p>
          <div className="go">Join a board →</div>
        </button>
      </div>
    </section>
  );
}
