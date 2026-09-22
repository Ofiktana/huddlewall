import { useHuddle } from '../context/HuddleContext';

export default function Toast() {
  const { toastMessage, toastVisible } = useHuddle();
  return (
    <div className={toastVisible ? 'toast show' : 'toast'} role="status">
      {toastMessage}
    </div>
  );
}
