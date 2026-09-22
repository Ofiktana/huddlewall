import { useEffect, useRef } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useHuddle } from './context/HuddleContext';
import HostBoard from './components/HostBoard';
import HostDashboard from './components/HostDashboard';
import HostTable from './components/HostTable';
import MemberBoard from './components/MemberBoard';
import MemberJoin from './components/MemberJoin';
import RoleSelect from './components/RoleSelect';
import Toast from './components/Toast';

function BootRedirect() {
  const { session } = useHuddle();
  const location = useLocation();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || location.pathname !== '/') return;
    ran.current = true;
    if (session.role === 'host' && session.view === 'table') {
      navigate('/host/table', { replace: true });
    } else if (session.role === 'host' && session.view === 'board' && session.bucketId) {
      navigate('/host/board/' + session.bucketId, { replace: true });
    } else if (session.role === 'host') {
      navigate('/host', { replace: true });
    } else if (session.role === 'member' && session.bucketId && session.memberName) {
      navigate('/wall/' + session.bucketId, { replace: true });
    } else if (session.role === 'member') {
      navigate('/join', { replace: true });
    }
  }, [location.pathname, navigate, session]);

  return null;
}

export default function App() {
  return (
    <>
      <BootRedirect />
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/host" element={<HostDashboard />} />
        <Route path="/host/board/:bucketId" element={<HostBoard />} />
        <Route path="/host/table" element={<HostTable />} />
        <Route path="/join" element={<MemberJoin />} />
        <Route path="/wall/:bucketId" element={<MemberBoard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  );
}
