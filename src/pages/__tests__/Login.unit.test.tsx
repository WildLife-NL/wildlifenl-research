import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Login from '../Login';
import * as authService from '../../services/authService';
import { RateLimitError } from '../../services/problemDetails';

// Two-step sign-in: the email step, then a code that is checked as soon as six digits are in

const renderLogin = () =>
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<p>Testing dashboard</p>} />
      </Routes>
    </MemoryRouter>
  );

const reachCodeStep = async () => {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'testing@example.com' } });
  fireEvent.click(screen.getByRole('button', { name: /Email me a code/ }));
  return screen.findByTestId('login-code-step');
};

describe('Login - Unit Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('ASKS FOR A VALID EMAIL BEFORE REQUESTING A CODE', () => {
    const requestSpy = jest.spyOn(authService, 'requestOTP');
    renderLogin();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'not-an-address' } });
    fireEvent.click(screen.getByRole('button', { name: /Email me a code/ }));
    expect(screen.getByText(/does not look like an email address/)).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
    expect(requestSpy).not.toHaveBeenCalled();
  });

  test('MOVES TO THE CODE STEP AND SIGNS IN AT SIX DIGITS', async () => {
    jest.spyOn(authService, 'requestOTP').mockResolvedValue({ ok: true } as Response);
    const verifySpy = jest.spyOn(authService, 'verifyOTP').mockResolvedValue('testing-token');
    renderLogin();

    await reachCodeStep();
    expect(screen.getByText('testing@example.com')).toBeInTheDocument();

    const code = screen.getByLabelText('Code');
    expect(code).toHaveAttribute('autocomplete', 'one-time-code');
    fireEvent.change(code, { target: { value: '123 456' } });

    await waitFor(() => expect(verifySpy).toHaveBeenCalledWith('testing@example.com', '123456'));
    expect(await screen.findByText('Testing dashboard')).toBeInTheDocument();
    expect(localStorage.getItem('authToken')).toBe('testing-token');
  });

  test('EXPLAINS A WRONG CODE AND LETS YOU GO BACK', async () => {
    jest.spyOn(authService, 'requestOTP').mockResolvedValue({ ok: true } as Response);
    jest.spyOn(authService, 'verifyOTP').mockResolvedValue(null);
    renderLogin();

    await reachCodeStep();
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '000000' } });
    expect(await screen.findByText(/didn't match/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Use a different address/ }));
    expect(await screen.findByTestId('login-email-step')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('testing@example.com');
  });

  test('SAYS TO WAIT WHEN THE API LIMITS SIGN-IN REQUESTS', async () => {
    jest.spyOn(authService, 'requestOTP').mockResolvedValue({ ok: false, status: 429, headers: { get: () => null } } as unknown as Response);
    renderLogin();

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'testing@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Email me a code/ }));

    expect(await screen.findByText(/asked ResearchConnect to slow down\. Try again in 15 seconds/)).toBeInTheDocument();
    expect(screen.queryByText(/Check that it is the one registered/)).not.toBeInTheDocument();
  });

  test('DOES NOT CALL A RATE LIMITED CODE CHECK A WRONG CODE', async () => {
    jest.spyOn(authService, 'requestOTP').mockResolvedValue({ ok: true } as Response);
    jest.spyOn(authService, 'verifyOTP').mockRejectedValue(new RateLimitError(15));
    renderLogin();

    await reachCodeStep();
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: '123456' } });

    expect(await screen.findByText(/asked ResearchConnect to slow down\. Try again in 15 seconds/)).toBeInTheDocument();
    expect(screen.queryByText(/didn't match/)).not.toBeInTheDocument();
  });
});
