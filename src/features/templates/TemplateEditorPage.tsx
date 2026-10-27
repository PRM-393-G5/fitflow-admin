import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Clock,
  FileXmark,
  Plus,
  TrashBin,
} from '@gravity-ui/icons';
import {
  Button,
  Card,
  ComboBox,
  Description,
  FieldError,
  Input,
  Label,
  Link,
  ListBox,
  NumberField,
  Select,
  Skeleton,
  Spinner,
  TextArea,
  TextField,
  toast,
} from '@heroui/react';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { Notice } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { SectionCard } from '../../ui/SectionCard';
import { Segmented } from '../../ui/Segmented';
import { useSaveTemplate, useTemplate } from './api';
import { templateIdFor } from './ids';
import {
  estimateMinutes,
  fromFormValues,
  NEW_EXERCISE,
  toFormValues,
  workOf,
  type ExerciseFormValues,
  type TemplateFormValues,
} from './templateForm';
import { CATEGORIES, LEVELS, MUSCLE_GROUPS } from './types';
import {
  amountFor,
  amountRange,
  hasErrors,
  MAX_DESCRIPTION,
  MAX_EXERCISES,
  validateTemplate,
  type ExerciseErrors,
} from './validate';

const EMPTY: TemplateFormValues = {
  id: '',
  name: '',
  category: 'Strength',
  level: 'Beginner',
  description: '',
  exercises: [{ ...NEW_EXERCISE }],
};

/** An exercise row with a key that stays with it when rows move. */
type Row = ExerciseFormValues & { key: number };

let lastRowKey = 0;
const withKey = (exercise: ExerciseFormValues): Row => ({
  ...exercise,
  key: ++lastRowKey,
});

/** `/templates/new` creates a template; `/templates/:id/edit` edits one. */
export function TemplateEditorPage() {
  const { id } = useParams();
  const existing = useTemplate(id);

  // Fill the form from the server's current copy, not a cached one that a
  // refetch could replace after the form has read its initial values.
  // (Two admins editing at once still means last save wins.)
  if (id !== undefined && !existing.isFetchedAfterMount) {
    return <EditorSkeleton />;
  }
  // A failed background refetch keeps the cached template (and the form).
  if (id !== undefined && existing.isError && !existing.data) {
    const notFound =
      existing.error instanceof ApiError && existing.error.status === 404;
    return (
      <Card className="mx-auto mt-16 max-w-md items-center py-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-default text-muted">
          <FileXmark className="size-6" />
        </span>
        <h1 className="text-lg font-semibold">
          {notFound ? 'Template not found' : existing.error.message}
        </h1>
        <Link href="/templates">Back to templates</Link>
      </Card>
    );
  }
  return (
    <TemplateForm
      key={id ?? 'new'}
      existingId={id}
      initialValues={existing.data ? toFormValues(existing.data) : EMPTY}
    />
  );
}

function EditorSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">Loading…</span>
      <Skeleton className="h-8 w-64 rounded-lg" />
      <Skeleton className="h-64 rounded-3xl" />
      <Skeleton className="h-80 rounded-3xl" />
    </div>
  );
}

// Module-level: React Aria rebuilds a field's parser when these change.
const WHOLE = { maximumFractionDigits: 0 };
const FRACTION = { maximumFractionDigits: 2 };

/** A NaN from an emptied number field counts as nothing. */
const orZero = (value: number) => (Number.isFinite(value) ? value : 0);

function TemplateForm({
  existingId,
  initialValues,
}: {
  existingId: string | undefined;
  initialValues: TemplateFormValues;
}) {
  const navigate = useNavigate();
  const save = useSaveTemplate(existingId);
  const isNew = existingId === undefined;
  const [values, setValues] = useState(() => ({
    ...initialValues,
    exercises: initialValues.exercises.map(withKey),
  }));
  // The id follows the name until the admin types one.
  const [idTyped, setIdTyped] = useState(false);
  // Errors show for fields the admin has changed, and for all after a
  // submit (as the API would refuse them anyway).
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [focusError, setFocusError] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const errors = validateTemplate(values, { isNew });
  const shown = (field: string, error: string | undefined) =>
    submitted || touched.has(field) ? error : undefined;
  const touch = (...fields: string[]) =>
    setTouched((current) => new Set([...current, ...fields]));

  // After a refused submit, take the admin to the first problem.
  useEffect(() => {
    if (focusError === 0) return;
    const form = formRef.current;
    const invalid = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (invalid) {
      invalid.scrollIntoView({ block: 'center' });
      invalid.focus();
    } else {
      // A problem with the list itself: show its banner.
      form
        ?.querySelector('[role="alert"]')
        ?.scrollIntoView({ block: 'center' });
    }
  }, [focusError]);

  const minutes = estimateMinutes(
    values.exercises.map((exercise) =>
      workOf({
        ...exercise,
        sets: orZero(exercise.sets),
        amount: orZero(exercise.amount),
        restSeconds: orZero(exercise.restSeconds),
      }),
    ),
  );

  const setName = (name: string) => {
    touch('name');
    setValues((current) => ({
      ...current,
      name,
      id: isNew && !idTyped ? templateIdFor(name) : current.id,
    }));
  };
  const setId = (id: string) => {
    touch('id');
    // Emptied: follow the name again.
    setIdTyped(id !== '');
    setValues((current) => ({
      ...current,
      id: id === '' ? templateIdFor(current.name) : id,
    }));
  };
  const updateRow = (key: number, change: Partial<ExerciseFormValues>) => {
    touch(...Object.keys(change).map((field) => `${key}.${field}`));
    setValues((current) => ({
      ...current,
      exercises: current.exercises.map((row) => {
        if (row.key !== key) return row;
        const next = { ...row, ...change };
        // A new type keeps the amount when it fits, else moves it into
        // range (300 s switched to reps is 200 reps), never out of range.
        return change.mode
          ? { ...next, amount: amountFor(change.mode, next.amount) }
          : next;
      }),
    }));
  };
  const moveRow = (index: number, by: -1 | 1) =>
    setValues((current) => {
      const exercises = [...current.exercises];
      const [row] = exercises.splice(index, 1);
      exercises.splice(index + by, 0, row);
      return { ...current, exercises };
    });
  const removeRow = (key: number) =>
    setValues((current) => ({
      ...current,
      exercises: current.exercises.filter((row) => row.key !== key),
    }));
  const addRow = () =>
    setValues((current) => ({
      ...current,
      exercises: [...current.exercises, withKey({ ...NEW_EXERCISE })],
    }));

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    if (hasErrors(errors)) {
      setFocusError((count) => count + 1);
      return;
    }
    save.mutate(fromFormValues(values), {
      onSuccess: (saved) => {
        toast.success(isNew ? `Created ${saved.name}` : `Saved ${saved.name}`);
        navigate('/templates');
      },
    });
  };

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit}>
      <fieldset disabled={save.isPending} className="contents">
        <PageHeader
          leading={
            <Link
              href="/templates"
              aria-label="Back to templates"
              className="flex size-10 items-center justify-center rounded-full text-foreground hover:bg-default"
            >
              <ArrowLeft className="size-4" />
            </Link>
          }
          title={isNew ? 'New template' : initialValues.name}
          description={
            isNew
              ? 'Added to the end of the library.'
              : 'Changes reach phones on their next refresh.'
          }
          actions={
            <>
              <Button variant="tertiary" onPress={() => navigate('/templates')}>
                Cancel
              </Button>
              <Button type="submit" isPending={save.isPending}>
                {save.isPending && <Spinner color="current" size="sm" />}
                {isNew ? 'Create' : 'Save'}
              </Button>
            </>
          }
        />

        {save.isError && <Notice status="danger" title={save.error.message} />}

        <div className="flex flex-col gap-4">
          <SectionCard title="Plan">
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                value={values.name}
                onChange={setName}
                maxLength={80}
                isInvalid={Boolean(shown('name', errors.name))}
              >
                <Label>Name</Label>
                <Input variant="secondary" placeholder="Full Body Foundation" />
                <FieldError>{shown('name', errors.name)}</FieldError>
              </TextField>
              <TextField
                value={values.id}
                onChange={setId}
                isDisabled={!isNew}
                isInvalid={Boolean(shown('id', errors.id))}
              >
                <Label>Id</Label>
                <Input variant="secondary" className="font-mono" />
                {shown('id', errors.id) ? (
                  <FieldError>{shown('id', errors.id)}</FieldError>
                ) : (
                  <Description>
                    {isNew
                      ? 'Lowercase words joined by “-”; cannot change later.'
                      : 'Phones refer to the plan by this id.'}
                  </Description>
                )}
              </TextField>
              <div className="grid grid-cols-2 gap-4">
                <ChoiceSelect
                  label="Category"
                  value={values.category}
                  options={CATEGORIES}
                  onChange={(category) =>
                    setValues((current) => ({ ...current, category }))
                  }
                />
                <ChoiceSelect
                  label="Level"
                  value={values.level}
                  options={LEVELS}
                  onChange={(level) =>
                    setValues((current) => ({ ...current, level }))
                  }
                />
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-accent/10 px-4 py-3 text-accent">
                <Clock className="size-5 shrink-0" />
                <div>
                  <div className="text-xs">
                    Estimated duration (as the app computes it)
                  </div>
                  <div className="text-xl font-semibold tabular-nums">
                    {minutes} min
                  </div>
                </div>
              </div>
              <TextField
                className="md:col-span-2"
                value={values.description}
                onChange={(description) =>
                  setValues((current) => ({ ...current, description }))
                }
                maxLength={MAX_DESCRIPTION}
                isInvalid={Boolean(errors.description)}
              >
                <Label>Description</Label>
                <TextArea variant="secondary" rows={2} />
                {errors.description ? (
                  <FieldError>{errors.description}</FieldError>
                ) : (
                  <Description className="tabular-nums">
                    {values.description.length} / {MAX_DESCRIPTION}
                  </Description>
                )}
              </TextField>
            </div>
          </SectionCard>

          <SectionCard
            title={`Exercises (${values.exercises.length})`}
            actions={
              <Button
                variant="secondary"
                isDisabled={values.exercises.length >= MAX_EXERCISES}
                onPress={addRow}
              >
                <Plus />
                Add exercise
              </Button>
            }
          >
            <div className="flex flex-col gap-3">
              {values.exercises.map((row, index) => (
                <ExerciseRow
                  key={row.key}
                  row={row}
                  index={index}
                  count={values.exercises.length}
                  errors={errors.rows[index]}
                  shown={(field, error) => shown(`${row.key}.${field}`, error)}
                  onChange={(change) => updateRow(row.key, change)}
                  onMove={(by) => moveRow(index, by)}
                  onRemove={() => removeRow(row.key)}
                />
              ))}
              {submitted && errors.exercises && (
                <Notice status="danger" title={errors.exercises} />
              )}
            </div>
          </SectionCard>
        </div>
      </fieldset>
    </form>
  );
}

function ChoiceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Select
      variant="secondary"
      value={value}
      onChange={(next) => onChange(String(next))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map((option) => (
            <ListBox.Item key={option} id={option} textValue={option}>
              {option}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

/** A visible label, with the row named for screen readers. */
function RowLabel({ children, row }: { children: ReactNode; row: number }) {
  return (
    <Label>
      {children} <span className="sr-only">of exercise {row}</span>
    </Label>
  );
}

function ExerciseRow({
  row,
  index,
  count,
  errors,
  shown,
  onChange,
  onMove,
  onRemove,
}: {
  row: Row;
  index: number;
  count: number;
  errors: ExerciseErrors;
  shown: (field: string, error: string | undefined) => string | undefined;
  onChange: (change: Partial<ExerciseFormValues>) => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  const number = index + 1;
  const timed = row.mode === 'timed';
  const amount = amountRange(row.mode);
  const error = (field: keyof ExerciseErrors) => shown(field, errors[field]);

  return (
    <div className="rounded-2xl border border-separator p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-accent/10 text-xs text-accent tabular-nums">
            {number}
          </span>
          {row.name.trim() || 'New exercise'}
        </span>
        <div className="flex items-center gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Move exercise ${number} up`}
            isDisabled={index === 0}
            onPress={() => onMove(-1)}
          >
            <ArrowUp />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={`Move exercise ${number} down`}
            isDisabled={index === count - 1}
            onPress={() => onMove(1)}
          >
            <ArrowDown />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="danger-soft"
            aria-label={`Remove exercise ${number}`}
            isDisabled={count === 1}
            onPress={onRemove}
          >
            <TrashBin />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-12">
        <TextField
          className="col-span-2 lg:col-span-5"
          value={row.name}
          onChange={(name) => onChange({ name })}
          maxLength={80}
          isInvalid={Boolean(error('name'))}
        >
          <RowLabel row={number}>Name</RowLabel>
          <Input variant="secondary" placeholder="Push-up" />
          <FieldError>{error('name')}</FieldError>
        </TextField>
        <ComboBox
          className="col-span-2 sm:col-span-1 lg:col-span-4"
          variant="secondary"
          allowsCustomValue
          inputValue={row.muscleGroup}
          onInputChange={(muscleGroup) => onChange({ muscleGroup })}
          isInvalid={Boolean(error('muscleGroup'))}
        >
          <RowLabel row={number}>Muscle group</RowLabel>
          <ComboBox.InputGroup>
            <Input variant="secondary" placeholder="Chest" maxLength={40} />
            <ComboBox.Trigger />
          </ComboBox.InputGroup>
          <FieldError>{error('muscleGroup')}</FieldError>
          <ComboBox.Popover>
            <ListBox>
              {MUSCLE_GROUPS.map((group) => (
                <ListBox.Item key={group} id={group} textValue={group}>
                  {group}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </ComboBox.Popover>
        </ComboBox>
        <div className="col-span-2 flex flex-col gap-1 sm:col-span-1 lg:col-span-3">
          <span className="text-sm font-medium">Type</span>
          <Segmented<ExerciseFormValues['mode']>
            ariaLabel={`Type of exercise ${number}`}
            size="md"
            fullWidth
            value={row.mode}
            onChange={(mode) => onChange({ mode })}
            options={[
              { value: 'reps', label: 'Reps' },
              { value: 'timed', label: 'Timed' },
            ]}
          />
        </div>
        <RowNumber
          label="Sets"
          row={number}
          value={row.sets}
          min={1}
          max={20}
          error={error('sets')}
          onChange={(sets) => onChange({ sets })}
        />
        <RowNumber
          label={timed ? 'Seconds' : 'Reps'}
          row={number}
          value={row.amount}
          min={amount.min}
          max={amount.max}
          error={error('amount')}
          onChange={(value) => onChange({ amount: value })}
        />
        <RowNumber
          label="Rest (s)"
          row={number}
          value={row.restSeconds}
          min={0}
          max={900}
          error={error('restSeconds')}
          onChange={(restSeconds) => onChange({ restSeconds })}
        />
        <RowNumber
          label="Load (kg)"
          row={number}
          value={row.weightKg}
          min={0}
          max={500}
          fraction
          error={error('weightKg')}
          onChange={(weightKg) => onChange({ weightKg })}
        />
      </div>
    </div>
  );
}

function RowNumber({
  label,
  row,
  value,
  min,
  max,
  fraction = false,
  error,
  onChange,
}: {
  label: string;
  row: number;
  value: number;
  min: number;
  max: number;
  /** Allows decimals (a load), stepping by 0.5; counts are whole. */
  fraction?: boolean;
  error: string | undefined;
  onChange: (value: number) => void;
}) {
  return (
    <NumberField
      className="lg:col-span-3"
      variant="secondary"
      value={value}
      onChange={onChange}
      minValue={min}
      maxValue={max}
      formatOptions={fraction ? FRACTION : WHOLE}
      step={fraction ? 0.5 : 1}
      isInvalid={Boolean(error)}
    >
      <RowLabel row={row}>{label}</RowLabel>
      <NumberField.Group>
        <NumberField.DecrementButton />
        <NumberField.Input />
        <NumberField.IncrementButton />
      </NumberField.Group>
      <FieldError>{error}</FieldError>
    </NumberField>
  );
}
