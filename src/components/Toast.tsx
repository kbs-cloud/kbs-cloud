export interface ToastProps {
  toast: { message: string; type: 'success' | 'info' | 'error' } | null;
}

export default function Toast({ toast }: ToastProps) {
  if (!toast) return null;

  return (
    <div className="toast-notification" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      padding: '12px 24px',
      borderRadius: '8px',
      background: 'rgba(12, 9, 28, 0.95)',
      borderLeft: `4px solid ${toast.type === 'success' ? 'var(--green)' : toast.type === 'error' ? 'var(--pink)' : 'var(--cyan)'}`,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      color: '#fff',
      zIndex: 999,
      fontSize: '0.95rem',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      backdropFilter: 'blur(8px)',
      animation: 'dropdownFade 0.3s ease'
    }}>
      <span style={{
        color: toast.type === 'success' ? 'var(--green)' : toast.type === 'error' ? 'var(--pink)' : 'var(--cyan)',
        fontWeight: 'bold'
      }}>
        {toast.type.toUpperCase()}:
      </span>
      {toast.message}
    </div>
  );
}
