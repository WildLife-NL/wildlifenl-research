import { FormEvent, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestOTP, verifyOTP } from '../services/authService';
import { getRateLimitError, isRateLimited } from '../services/problemDetails';
import { useDocumentTitle } from '../hooks/usePageChrome';
import AuthShell from '../components/AuthShell';
import Banner from '../components/ui/Banner';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { Field } from '../components/ui/Layout';

// Seconds before another code may be requested, kept on the client only
export const RESEND_COOLDOWN_SECONDS = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NETWORK_ERROR = 'Could not reach WildlifeNL. Check your connection and try again.';

// Passwordless sign-in in two steps: the email address, then the 6-digit code sent to it
const Login: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code'>('email');

  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sending, setSending] = useState<boolean>(false);

  const [code, setCode] = useState<string>('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  const verifyingRef = useRef<boolean>(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useDocumentTitle(step === 'email' ? 'Sign in' : 'Check your email');

  useEffect(() => {
    if (step === 'code') {
      codeRef.current?.focus();
    } else {
      emailRef.current?.focus();
    }
  }, [step]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((seconds) => seconds - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const handleEmailSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const address = email.trim();

    if (!address) {
      setEmailError('Enter the email address registered with WildlifeNL');
      return;
    }
    if (!EMAIL_PATTERN.test(address)) {
      setEmailError('That does not look like an email address, check it for typos');
      return;
    }

    setSending(true);
    setEmailError(null);
    try {
      const response = await requestOTP(address);
      if (response.ok) {
        setEmail(address);
        setCode('');
        setCodeError(null);
        setResendNotice(null);
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setStep('code');
      } else {
        setEmailError(
          getRateLimitError(response)?.message ??
            "We couldn't send a code to this address. Check that it is the one registered with WildlifeNL and try again."
        );
      }
    } catch (error) {
      console.error('Error requesting a code:', error);
      setEmailError(NETWORK_ERROR);
    } finally {
      setSending(false);
    }
  };

  const verify = async (value: string) => {
    if (verifyingRef.current) return;
    if (!/^\d{6}$/.test(value)) {
      setCodeError('Enter all 6 digits from the email');
      return;
    }

    verifyingRef.current = true;
    setVerifying(true);
    setCodeError(null);
    try {
      const token = await verifyOTP(email, value);
      if (token) {
        localStorage.setItem('authToken', token);
        navigate('/dashboard', { replace: true });
        return;
      }
      setCodeError("That code didn't match. Check the most recent email, or send a new code.");
    } catch (error) {
      console.error('Error during code verification:', error);
      setCodeError(isRateLimited(error) ? error.message : NETWORK_ERROR);
    } finally {
      verifyingRef.current = false;
      setVerifying(false);
    }
  };

  // Keeps digits only, so a pasted "123 456" works, and checks the code as soon as six digits are in
  const handleCodeChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 6);
    setCode(digits);
    if (codeError) setCodeError(null);
    if (digits.length === 6) verify(digits);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setResendNotice(null);
    setCodeError(null);
    try {
      const response = await requestOTP(email);
      if (response.ok) {
        setCode('');
        setCooldown(RESEND_COOLDOWN_SECONDS);
        setResendNotice(`A new code is on its way to ${email}.`);
        codeRef.current?.focus();
      } else {
        setCodeError(getRateLimitError(response)?.message ?? "We couldn't send a new code. Wait a moment and try again.");
      }
    } catch (error) {
      console.error('Error resending the code:', error);
      setCodeError(NETWORK_ERROR);
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      {step === 'email' ? (
        <form className="rc-auth-card" onSubmit={handleEmailSubmit} noValidate data-testid="login-email-step">
          <div className="rc-auth-card__intro">
            <p className="rc-eyebrow">Step 1 of 2</p>
            <h1 className="rc-title">Sign in</h1>
            <p className="rc-muted">We'll email you a 6-digit code. There is no password.</p>
          </div>

          <Field id="email-input" label="Email" error={emailError} help="Use the address registered with WildlifeNL.">
            {(control) => (
              <input
                {...control}
                ref={emailRef}
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="name@organisation.nl"
                className="rc-input rc-input--lg"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (emailError) setEmailError(null);
                }}
              />
            )}
          </Field>

          <Button type="submit" variant="primary" size="lg" block busy={sending} busyLabel="Sending code…">
            Email me a code
            <Icon name="arrow-right" />
          </Button>

          <p className="rc-auth-card__footnote">Researcher access only. Need an account? Contact the WildlifeNL team.</p>
        </form>
      ) : (
        <form
          className="rc-auth-card"
          onSubmit={(event) => {
            event.preventDefault();
            verify(code);
          }}
          noValidate
          data-testid="login-code-step"
        >
          <div className="rc-auth-card__intro">
            <button
              type="button"
              className="rc-linkbtn rc-auth-card__back"
              onClick={() => {
                setStep('email');
                setCode('');
                setCodeError(null);
              }}
            >
              <Icon name="arrow-left" size={14} />
              Use a different address
            </button>
            <p className="rc-eyebrow">Step 2 of 2</p>
            <h1 className="rc-title">Check your email</h1>
            <p className="rc-muted">
              We sent a 6-digit code to <strong className="rc-auth-card__email">{email}</strong>.
            </p>
          </div>

          <Field id="otp-code" label="Code" error={codeError} help="Paste or type the code, it is checked as soon as six digits are in.">
            {(control) => (
              <input
                {...control}
                ref={codeRef}
                type="text"
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="rc-input rc-otp-input"
                value={code}
                onChange={(event) => handleCodeChange(event.target.value)}
              />
            )}
          </Field>

          {resendNotice && <Banner tone="success">{resendNotice}</Banner>}

          <Button type="submit" variant="primary" size="lg" block busy={verifying} busyLabel="Checking code…">
            Verify and sign in
          </Button>

          <p className="rc-auth-card__note">
            Didn't get it? Check your spam folder, or{' '}
            <button type="button" className="rc-linkbtn" onClick={handleResend} disabled={cooldown > 0 || resending}>
              {resending ? 'sending…' : 'send a new code'}
            </button>
            {cooldown > 0 && <span> (available in {cooldown} s)</span>}.
          </p>
        </form>
      )}
    </AuthShell>
  );
};

export default Login;
