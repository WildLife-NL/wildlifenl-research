import { act, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AuthWrapper from '../AuthWrapper';
import * as profileService from '../../services/profileService';
import { RateLimitError } from '../../services/problemDetails';
import { User } from '../../types/user';

// The access check: a rate limit makes it wait and check again instead of denying access

const researcher: User = { ID: 'user-1', name: 'Testing Researcher', email: 'testing@example.com', roles: [{ ID: 3, name: 'researcher' }] };

const renderGuarded = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <AuthWrapper>
              <p>Testing dashboard</p>
            </AuthWrapper>
          }
        />
        <Route path="/unauthorized" element={<p>Testing unauthorized</p>} />
      </Routes>
    </MemoryRouter>
  );

describe('AuthWrapper - Unit Tests', () => {
  beforeEach(() => {
    localStorage.setItem('authToken', 'testing-token');
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    localStorage.clear();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('WAITS AND CHECKS AGAIN WHEN THE API ASKS TO SLOW DOWN', async () => {
    jest.useFakeTimers();
    const getMyProfile = jest.spyOn(profileService, 'getMyProfile').mockRejectedValueOnce(new RateLimitError(15)).mockResolvedValueOnce(researcher);

    renderGuarded();

    expect(await screen.findByText(/asked ResearchConnect to slow down\. Checking your access again in 15 seconds/)).toBeInTheDocument();
    expect(screen.queryByText('Testing unauthorized')).not.toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(15000);
    });

    expect(await screen.findByText('Testing dashboard')).toBeInTheDocument();
    expect(getMyProfile).toHaveBeenCalledTimes(2);
  });

  test('STILL SENDS OTHER FAILURES TO THE UNAUTHORIZED PAGE', async () => {
    jest.spyOn(profileService, 'getMyProfile').mockRejectedValue(new Error('Failed to fetch profile'));

    renderGuarded();

    expect(await screen.findByText('Testing unauthorized')).toBeInTheDocument();
  });
});
