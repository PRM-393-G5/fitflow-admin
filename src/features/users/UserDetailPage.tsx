import {
  ArrowLeft,
  ChartColumn,
  Clock,
  Camera,
  Flame,
  Lock,
  LockOpen,
  PersonXmark,
  TrashBin,
} from '@gravity-ui/icons';
import {
  Alert,
  AlertDialog,
  Button,
  Card,
  Chip,
  Input,
  Link,
  Skeleton,
  Spinner,
  TextField,
  toast,
} from '@heroui/react';
import { useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { formatDateTime, formatExact } from '../../format';
import { DataTable } from '../../ui/DataTable';
import { EmptyRows, Notice } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { StatTile } from '../../ui/StatTile';
import { useDeleteUser, useSetUserLocked, useUser } from './api';
import {
  activityLabel,
  formatKg,
  formatMinutes,
  goalLabel,
  sexLabel,
} from './labels';
import { usersListPath } from './paths';
import { StatusTag } from './StatusTag';
import type { TrainingProfile, UserDetail } from './types';
import { UserAvatar } from './UserAvatar';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const user = useUser(id);
  const backTo = usersListPath(useLocation().state);

  if (user.isPending) return <DetailSkeleton />;
  const notFound = user.error instanceof ApiError && user.error.status === 404;
  // Gone (e.g. deleted since it was cached): never show the stale copy.
  if (user.isError && (notFound || !user.data)) {
    return (
      <Card className="mx-auto mt-16 max-w-md items-center py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-default text-muted">
          <PersonXmark className="size-6" />
        </span>
        <h1 className="text-lg font-semibold">
          {notFound ? 'User not found' : user.error.message}
        </h1>
        {notFound && (
          <p className="text-sm text-muted">
            The account may have been deleted.
          </p>
        )}
        <Link href={backTo}>Back to users</Link>
      </Card>
    );
  }
  return (
    <>
      {user.isError && (
        <Notice
          status="warning"
          title={`Could not refresh this user: ${user.error.message}`}
        />
      )}
      {/* Keyed: dialogs opened for one user never act on another. */}
      <UserDetailView key={user.data.id} user={user.data} backTo={backTo} />
    </>
  );
}

function DetailSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading…</span>
      <div className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <Skeleton className="h-4 w-32 rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-32 rounded-3xl" />
        ))}
      </div>
      <Skeleton className="h-72 rounded-3xl" />
    </div>
  );
}

function UserDetailView({
  user,
  backTo,
}: {
  user: UserDetail;
  backTo: string;
}) {
  const navigate = useNavigate();
  const setLocked = useSetUserLocked(user.id);
  const remove = useDeleteUser(user.id);
  const [confirmingLock, setConfirmingLock] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const shownName = user.name || user.email;

  const toggleLock = () => {
    setConfirmingLock(false);
    // A promise, not mutate callbacks: the result is still reported if
    // the admin has left the page by the time it arrives.
    setLocked.mutateAsync(!user.disabled).then(
      () =>
        toast.success(
          user.disabled ? `Unlocked ${shownName}` : `Locked ${shownName}`,
        ),
      (error: Error) => toast.danger(error.message),
    );
  };

  return (
    <>
      <PageHeader
        leading={
          <>
            <Link
              href={backTo}
              aria-label="Back to users"
              className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-default"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <UserAvatar size="lg" name={shownName} photoUrl={user.photoUrl} />
          </>
        }
        title={
          <span className="flex flex-wrap items-center gap-3">
            {shownName}
            <StatusTag disabled={user.disabled} size="md" />
          </span>
        }
        description={user.name ? user.email : undefined}
        actions={
          <>
            <Button
              variant="secondary"
              isPending={setLocked.isPending}
              onPress={() => setConfirmingLock(true)}
            >
              {setLocked.isPending ? (
                <Spinner color="current" size="sm" />
              ) : user.disabled ? (
                <LockOpen />
              ) : (
                <Lock />
              )}
              {user.disabled ? 'Unlock' : 'Lock'}
            </Button>
            <Button
              variant="danger-soft"
              onPress={() => {
                remove.reset(); // no error left from an earlier attempt
                setConfirmingDelete(true);
              }}
            >
              <TrashBin />
              Delete
            </Button>
          </>
        }
      />

      {user.disabled && (
        <Notice
          status="warning"
          title="This account is locked: the user cannot sign in, sync or use AI."
        />
      )}

      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatTile
            label="Workouts"
            icon={<Flame />}
            value={formatExact(user.counts.sessions)}
          />
          <StatTile
            label="Training time"
            icon={<Clock />}
            value={formatMinutes(user.totals.minutes)}
          />
          <StatTile
            label="Volume"
            icon={<ChartColumn />}
            value={formatKg(user.totals.volumeKg)}
          />
          <StatTile
            label="Form checks"
            icon={<Camera />}
            value={formatExact(user.counts.formChecks)}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <SectionCard title="Account">
            <Facts
              rows={[
                ['Email', user.email],
                ['Joined', formatDateTime(user.createdAt)],
                [
                  'Last sign-in',
                  user.lastSignInAt ? formatDateTime(user.lastSignInAt) : '—',
                ],
                [
                  'Last sync',
                  user.lastSyncAt ? formatDateTime(user.lastSyncAt) : '—',
                ],
                ['Custom plans', formatExact(user.counts.workouts)],
                [
                  'Weight entries',
                  `${formatExact(user.counts.weights)}${
                    user.latestWeightKg === null
                      ? ''
                      : ` (latest ${formatKg(user.latestWeightKg)})`
                  }`,
                ],
                ['Meals logged', formatExact(user.counts.meals)],
              ]}
            />
          </SectionCard>
          <SectionCard title="Training profile">
            <ProfileDetails profile={user.profile} />
          </SectionCard>
        </div>

        <SectionCard title="Recent sessions">
          <DataTable
            label="Recent sessions"
            rows={user.recentSessions}
            rowKey={(session) => session.id}
            empty="No sessions synced yet"
            contentClassName="min-w-[640px]"
            columns={[
              {
                title: 'Workout',
                render: (session) => (
                  <span className="flex flex-wrap items-center gap-2">
                    {session.workoutName ?? 'Workout'}
                    {session.formCheck && (
                      <Chip size="sm" color="accent" variant="soft">
                        <Chip.Label>Form check</Chip.Label>
                      </Chip>
                    )}
                  </span>
                ),
              },
              {
                title: 'Finished',
                className: 'tabular-nums whitespace-nowrap',
                // The phone's local time: shown as is, not converted.
                render: (session) =>
                  session.completedAt
                    ? formatDateTime(session.completedAt)
                    : '—',
              },
              {
                title: 'Duration',
                className: 'tabular-nums',
                render: (session) => formatMinutes(session.minutes),
              },
              {
                title: 'Sets',
                numeric: true,
                render: (session) => formatExact(session.completedSets),
              },
              {
                title: 'Volume',
                numeric: true,
                render: (session) => formatKg(session.volumeKg),
              },
            ]}
          />
        </SectionCard>
      </div>

      <LockDialog
        isOpen={confirmingLock}
        onOpenChange={setConfirmingLock}
        locked={user.disabled}
        onConfirm={toggleLock}
      />
      <DeleteUserDialog
        isOpen={confirmingDelete}
        onOpenChange={setConfirmingDelete}
        email={user.email}
        deleting={remove.isPending}
        error={remove.error?.message}
        onConfirm={() =>
          remove.mutate(undefined, {
            onSuccess: () => {
              toast.success(`Deleted ${shownName}`);
              navigate(backTo, { replace: true });
            },
          })
        }
      />
    </>
  );
}

/** Label–value pairs, two columns. */
function Facts({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-x-6 gap-y-3 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0 break-words">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileDetails({ profile }: { profile: TrainingProfile | null }) {
  if (!profile) {
    return <EmptyRows>Not set up in the app yet</EmptyRows>;
  }
  const show = <T,>(value: T | null, format: (value: T) => string) =>
    value === null ? '—' : format(value);
  return (
    <Facts
      rows={[
        ['Goal', show(profile.goal, goalLabel)],
        ['Level', show(profile.level, String)],
        ['Weekly goal', show(profile.weeklyGoal, (n) => `${n} workouts`)],
        ['Height', show(profile.heightCm, (n) => `${n} cm`)],
        ['Age', show(profile.age, String)],
        ['Sex', show(profile.isMale, sexLabel)],
        ['Activity', show(profile.activityLevel, activityLabel)],
      ]}
    />
  );
}

function LockDialog({
  isOpen,
  onOpenChange,
  locked,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  locked: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      isKeyboardDismissDisabled={false}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-md">
          <AlertDialog.Header>
            <AlertDialog.Icon status={locked ? 'accent' : 'warning'}>
              {locked ? <LockOpen /> : <Lock />}
            </AlertDialog.Icon>
            <AlertDialog.Heading>
              {locked ? 'Unlock this account?' : 'Lock this account?'}
            </AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>
              {locked
                ? 'They can sign in again; their data is unchanged.'
                : 'They are signed out everywhere and cannot sign in, sync or use AI until unlocked. Their data is kept.'}
            </p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary">
              Cancel
            </Button>
            <Button variant={locked ? 'primary' : 'danger'} onPress={onConfirm}>
              {locked ? 'Unlock account' : 'Lock account'}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

/** Deleting cannot be undone, so the admin types the email to confirm. */
function DeleteUserDialog({
  isOpen,
  onOpenChange,
  email,
  deleting,
  error,
  onConfirm,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  email: string;
  deleting: boolean;
  error: string | undefined;
  onConfirm: () => void;
}) {
  const [typed, setTyped] = useState('');
  const matches = typed.trim().toLowerCase() === email.toLowerCase();
  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) setTyped('');
        onOpenChange(open);
      }}
      isDismissable={!deleting}
      isKeyboardDismissDisabled={deleting}
    >
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-md">
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>Delete this account?</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body className="flex flex-col gap-4">
            <p>
              This permanently deletes the account and everything it synced
              (workouts, plans, weights, meals). It cannot be undone.
            </p>
            <p>
              Type <strong className="font-semibold">{email}</strong> to
              confirm.
            </p>
            <TextField
              aria-label="Email to confirm"
              value={typed}
              onChange={setTyped}
              autoComplete="off"
              isDisabled={deleting}
            >
              <Input variant="secondary" placeholder={email} />
            </TextField>
            {error && (
              <Alert status="danger">
                <Alert.Indicator />
                <Alert.Content>
                  <Alert.Title>{error}</Alert.Title>
                </Alert.Content>
              </Alert>
            )}
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button slot="close" variant="tertiary" isDisabled={deleting}>
              Cancel
            </Button>
            <Button
              variant="danger"
              isDisabled={!matches}
              isPending={deleting}
              onPress={onConfirm}
            >
              {deleting && <Spinner color="current" size="sm" />}
              Delete account
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}
