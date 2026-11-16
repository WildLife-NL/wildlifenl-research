import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import StatusChip from '../ui/StatusChip';
import Banner from '../ui/Banner';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';
import AccountMenu from '../AccountMenu';
import { UserProvider } from '../../context/UserContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';

// Shared UI pieces: chip text, banner roles, unavailable buttons, dialog keyboard behaviour, media queries and the account menu

const DialogHarness: React.FC = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title="Testing dialog" footer={<button type="button">Confirm</button>}>
        <input aria-label="First field" />
      </Dialog>
    </>
  );
};

const MediaProbe: React.FC = () => <span>{useMediaQuery('(max-width: 719px)') ? 'phone' : 'desktop'}</span>;

describe('UI components - Unit Tests', () => {
  test('STATUS CHIP KEEPS THE STATUS WORD AS ITS OWN TEXT', () => {
    render(<StatusChip status="Live" />);
    expect(screen.getByText('Live')).toHaveClass('rc-chip', 'rc-chip--live');
  });

  test('BANNERS ANNOUNCE ERRORS AS ALERTS AND THE REST AS STATUS', () => {
    render(
      <>
        <Banner tone="error" title="Broken.">
          Testing error
        </Banner>
        <Banner tone="success">Testing success</Banner>
      </>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Broken. Testing error');
    expect(screen.getByRole('status')).toHaveTextContent('Testing success');
  });

  test('UNAVAILABLE BUTTONS STAY FOCUSABLE BUT IGNORE CLICKS', () => {
    const onClick = jest.fn();
    render(
      <Button unavailable onClick={onClick}>
        Stop experiment
      </Button>
    );
    const button = screen.getByRole('button', { name: 'Stop experiment' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test('DIALOG FOCUSES INSIDE, CLOSES ON ESCAPE AND RETURNS FOCUS', async () => {
    render(<DialogHarness />);
    const opener = screen.getByRole('button', { name: 'Open dialog' });
    opener.focus();
    fireEvent.click(opener);

    const dialog = screen.getByRole('dialog', { name: 'Testing dialog' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(opener).toHaveFocus();
  });

  test('DIALOG CLOSES ON A BACKDROP CLICK ONLY', () => {
    render(<DialogHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Open dialog' }));
    fireEvent.mouseDown(screen.getByLabelText('First field'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('MEDIA QUERY IS FALSE WITHOUT MATCHMEDIA AND FOLLOWS IT WHEN PRESENT', () => {
    const original = window.matchMedia;
    // jsdom has no matchMedia, the hook must not throw
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true });
    const { unmount } = render(<MediaProbe />);
    expect(screen.getByText('desktop')).toBeInTheDocument();
    unmount();

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: () => ({ matches: true, addEventListener: () => undefined, removeEventListener: () => undefined }),
    });
    render(<MediaProbe />);
    expect(screen.getByText('phone')).toBeInTheDocument();
    Object.defineProperty(window, 'matchMedia', { value: original, configurable: true, writable: true });
  });

  test('ACCOUNT MENU SHOWS THE RESEARCHER AND SIGNS OUT', () => {
    localStorage.setItem('authToken', 'testing-token');
    render(
      <UserProvider user={{ ID: 'u1', name: 'Testing Researcher', email: 'testing@example.com', roles: [] }}>
        <MemoryRouter>
          <AccountMenu />
        </MemoryRouter>
      </UserProvider>
    );
    const button = screen.getByRole('button', { name: /Testing Researcher/ });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute('href', '/profile');
    fireEvent.click(screen.getByRole('menuitem', { name: 'Sign out' }));
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
