import {
  Envelope,
  Eye,
  EyeSlash,
  LayoutHeaderCellsLarge,
  Lock,
  Persons,
  Sparkles,
} from '@gravity-ui/icons';
import {
  Alert,
  Button,
  FieldError,
  Form,
  InputGroup,
  Label,
  TextField,
} from '@heroui/react';
import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, type Location } from 'react-router';
import { useAuth } from '../auth/useAuth';
import { LOGO_URL } from '../theme/brand';
import { ThemeCycleButton } from '../theme/ThemeSwitch';
import { loginErrorMessage } from './loginErrorMessage';

/** One @, no spaces or list separators, dot-separated domain labels. */
const EMAIL = /^[^\s@,;]+@[^\s@,;.]+(?:\.[^\s@,;.]+)*\.[a-z]{2,}$/i;

const HIGHLIGHTS = [
  {
    Icon: Persons,
    title: 'Users',
    text: 'Find an account, see its activity, lock or delete it.',
  },
  {
    Icon: LayoutHeaderCellsLarge,
    title: 'Workout templates',
    text: 'Edit the templates every user starts from.',
  },
  {
    Icon: Sparkles,
    title: 'AI usage',
    text: 'Calls, failures and who uses the AI features.',
  },
];

interface FieldErrors {
  email?: string;
  password?: string;
}

function validate(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!email) errors.email = 'Enter your email';
  else if (!EMAIL.test(email)) errors.email = 'Enter a valid email';
  if (!password) errors.password = 'Enter your password';
  return errors;
}

export function LoginPage() {
  const { session, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fromLocation = (location.state as { from?: Location } | null)?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search}${fromLocation.hash}`
    : '/';

  if (session) return <Navigate to={from} replace />;

  /** Once a field shows an error, it re-checks as the admin fixes it. */
  const recheck = (nextEmail: string, nextPassword: string) => {
    if (!fieldErrors.email && !fieldErrors.password) return;
    const errors = validate(nextEmail.trim(), nextPassword);
    setFieldErrors({
      email: fieldErrors.email && errors.email,
      password: fieldErrors.password && errors.password,
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const errors = validate(trimmed, password);
    setFieldErrors(errors);
    setError(null);
    if (errors.email || errors.password) return;
    setSubmitting(true);
    try {
      // Signed in: this page re-renders into <Navigate to={from} />.
      await login(trimmed, password);
    } catch (caught) {
      setError(loginErrorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <section className="relative hidden overflow-hidden bg-accent p-12 text-accent-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 -right-32 size-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 size-[28rem] rounded-full bg-black/10 blur-3xl"
        />
        <div className="relative flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white shadow-lg">
            <img src={LOGO_URL} alt="" className="size-7" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            FitFlow Admin
          </span>
        </div>
        <div className="relative max-w-md">
          <h2 className="text-4xl leading-tight font-semibold tracking-tight">
            Everything behind the FitFlow app, in one place.
          </h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-medium">{title}</span>
                  <span className="block text-sm opacity-80">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm opacity-70">PRM393 · FitFlow capstone</p>
      </section>

      <section className="relative flex items-center justify-center px-6 py-12">
        <div className="absolute top-4 right-4">
          <ThemeCycleButton />
        </div>
        <div className="w-full max-w-sm">
          <img src={LOGO_URL} alt="" className="mb-8 size-11 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted">
            Sign in with your admin account
          </p>

          {error && (
            <Alert status="danger" className="mt-6">
              <Alert.Indicator />
              <Alert.Content>
                <Alert.Title>{error}</Alert.Title>
              </Alert.Content>
            </Alert>
          )}

          <Form
            className="mt-6 flex flex-col gap-4"
            validationBehavior="aria"
            onSubmit={onSubmit}
          >
            <TextField
              name="email"
              type="email"
              autoComplete="username"
              autoFocus
              value={email}
              onChange={(value) => {
                setEmail(value);
                recheck(value, password);
              }}
              isInvalid={Boolean(fieldErrors.email)}
              isDisabled={submitting}
            >
              <Label>Email</Label>
              <InputGroup>
                <InputGroup.Prefix>
                  <Envelope className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input placeholder="admin@fitflow.app" />
              </InputGroup>
              <FieldError>{fieldErrors.email}</FieldError>
            </TextField>
            <TextField
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                recheck(email, value);
              }}
              isInvalid={Boolean(fieldErrors.password)}
              isDisabled={submitting}
            >
              <Label>Password</Label>
              <InputGroup>
                <InputGroup.Prefix>
                  <Lock className="size-4 text-muted" />
                </InputGroup.Prefix>
                <InputGroup.Input />
                <InputGroup.Suffix className="pe-1">
                  <Button
                    isIconOnly
                    size="sm"
                    variant="ghost"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    isDisabled={submitting}
                    onPress={() => setShowPassword((shown) => !shown)}
                  >
                    {showPassword ? <EyeSlash /> : <Eye />}
                  </Button>
                </InputGroup.Suffix>
              </InputGroup>
              <FieldError>{fieldErrors.password}</FieldError>
            </TextField>
            <Button
              type="submit"
              fullWidth
              size="lg"
              className="mt-2"
              isPending={submitting}
            >
              Sign in
            </Button>
          </Form>
          <p className="mt-8 text-xs text-muted">
            No account? An admin is created on the API server with{' '}
            <code className="rounded bg-default px-1 py-0.5">
              npm run admin:create
            </code>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
