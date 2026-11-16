// Short confirmation before a destructive or final action, the confirm button names the action
import { ReactNode } from 'react';
import Banner from './Banner';
import Button from './Button';
import Dialog from './Dialog';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  tone?: 'danger' | 'primary';
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  children,
  confirmLabel,
  busyLabel,
  tone = 'danger',
  busy = false,
  error,
  onConfirm,
  onCancel,
}) => (
  <Dialog
    open={open}
    title={title}
    onClose={() => {
      if (!busy) onCancel();
    }}
    compact
    footer={
      <>
        <Button variant="secondary" onClick={onCancel} unavailable={busy}>
          Cancel
        </Button>
        <Button variant={tone} onClick={onConfirm} busy={busy} busyLabel={busyLabel}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div>{children}</div>
    {error && <Banner tone="error" title="That did not work.">{error}</Banner>}
  </Dialog>
);

export default ConfirmDialog;
