import {
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  AutoComplete,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Result,
  Row,
  Segmented,
  Select,
  Skeleton,
  Space,
  Statistic,
  Typography,
} from 'antd';
import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { ApiError } from '../../api/client';
import { useSaveTemplate, useTemplate } from './api';
import {
  MAX_TEMPLATE_ID_LENGTH,
  TEMPLATE_ID_PATTERN,
  templateIdFor,
} from './ids';
import {
  estimateMinutes,
  fromFormValues,
  NEW_EXERCISE,
  workOf,
  toFormValues,
  type ExerciseFormValues,
  type TemplateFormValues,
} from './templateForm';
import { CATEGORIES, LEVELS, MUSCLE_GROUPS } from './types';

const EMPTY: TemplateFormValues = {
  id: '',
  name: '',
  category: 'Strength',
  level: 'Beginner',
  description: '',
  exercises: [{ ...NEW_EXERCISE }],
};

const muscleOptions = MUSCLE_GROUPS.map((value) => ({ value }));

/** `/templates/new` creates a template; `/templates/:id/edit` edits one. */
export function TemplateEditorPage() {
  const { id } = useParams();
  const existing = useTemplate(id);

  // Fill the form from the server's current copy, not a cached one that a
  // refetch could replace after the form has read its initial values.
  // (Two admins editing at once still means last save wins.)
  if (id !== undefined && !existing.isFetchedAfterMount) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }
  // A failed background refetch keeps the cached template (and the form).
  if (id !== undefined && existing.isError && !existing.data) {
    const notFound =
      existing.error instanceof ApiError && existing.error.status === 404;
    return (
      <Result
        status={notFound ? '404' : 'error'}
        title={notFound ? 'Template not found' : existing.error.message}
        extra={<Link to="/templates">Back to templates</Link>}
      />
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

function TemplateForm({
  existingId,
  initialValues,
}: {
  existingId: string | undefined;
  initialValues: TemplateFormValues;
}) {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [form] = Form.useForm<TemplateFormValues>();
  const save = useSaveTemplate(existingId);
  const isNew = existingId === undefined;
  // The id follows the name until the admin types one.
  const idTouched = useRef(false);

  const name = Form.useWatch('name', form);
  useEffect(() => {
    if (isNew && !idTouched.current) {
      // setFields (not setFieldValue) also clears a stale "Enter an id".
      form.setFields([
        { name: 'id', value: templateIdFor(name ?? ''), errors: [] },
      ]);
    }
  }, [form, isNew, name]);

  const exercises = Form.useWatch('exercises', form) as
    ExerciseFormValues[] | undefined;
  // Rows being edited can have empty fields.
  const minutes = estimateMinutes(
    (exercises ?? []).map((exercise) =>
      workOf({
        ...NEW_EXERCISE,
        mode: exercise?.mode ?? 'reps',
        sets: exercise?.sets ?? 0,
        amount: exercise?.amount ?? 0,
        restSeconds: exercise?.restSeconds ?? 0,
      }),
    ),
  );

  const onFinish = (values: TemplateFormValues) =>
    save.mutate(fromFormValues(values), {
      onSuccess: (saved) => {
        message.success(
          isNew ? `Created ${saved.name}` : `Saved ${saved.name}`,
        );
        navigate('/templates');
      },
    });

  return (
    <Form<TemplateFormValues>
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={onFinish}
      disabled={save.isPending}
      scrollToFirstError
    >
      <div className="page-header">
        <Space align="center">
          <Link to="/templates" aria-label="Back to templates">
            <ArrowLeftOutlined />
          </Link>
          <Typography.Title level={2} style={{ margin: 0 }}>
            {isNew ? 'New template' : initialValues.name}
          </Typography.Title>
        </Space>
        <Space>
          <Button onClick={() => navigate('/templates')}>Cancel</Button>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            {isNew ? 'Create' : 'Save'}
          </Button>
        </Space>
      </div>

      {save.isError && (
        <Alert
          type="error"
          showIcon
          title={save.error.message}
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title="Plan" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Name"
              name="name"
              rules={[
                { required: true, whitespace: true, message: 'Enter a name' },
                { max: 80 },
              ]}
            >
              <Input placeholder="Full Body Foundation" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Id"
              name="id"
              extra={
                isNew
                  ? 'Lowercase words joined by “-”; cannot change later.'
                  : 'Phones refer to the plan by this id.'
              }
              rules={[
                { required: true, message: 'Enter an id' },
                { max: MAX_TEMPLATE_ID_LENGTH },
                {
                  pattern: TEMPLATE_ID_PATTERN,
                  message:
                    'Use lowercase words joined by “-”, not starting with “custom-”',
                },
              ]}
            >
              <Input
                disabled={!isNew}
                onChange={(event) => {
                  // Emptied: follow the name again.
                  idTouched.current = event.target.value !== '';
                  if (!idTouched.current) {
                    form.setFieldValue('id', templateIdFor(name ?? ''));
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Category" name="category">
              <Select
                options={CATEGORIES.map((value) => ({ value, label: value }))}
              />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item label="Level" name="level">
              <Select
                options={LEVELS.map((value) => ({ value, label: value }))}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Statistic
              title="Estimated duration (as the app computes it)"
              value={minutes}
              suffix="min"
            />
          </Col>
          <Col span={24}>
            <Form.Item
              label="Description"
              name="description"
              rules={[{ max: 500 }]}
            >
              <Input.TextArea rows={2} showCount maxLength={500} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Form.List
        name="exercises"
        rules={[
          {
            validator: async (_, list?: unknown[]) => {
              if (!list || list.length === 0) {
                throw new Error('Add at least one exercise');
              }
              if (list.length > 30) throw new Error('At most 30 exercises');
            },
          },
        ]}
      >
        {(fields, { add, remove, move }, { errors }) => (
          <Card
            title={`Exercises (${fields.length})`}
            extra={
              <Button
                icon={<PlusOutlined />}
                disabled={fields.length >= 30}
                onClick={() => add({ ...NEW_EXERCISE })}
              >
                Add exercise
              </Button>
            }
          >
            {fields.map((field, index) => (
              <ExerciseRow
                key={field.key}
                name={field.name}
                index={index}
                count={fields.length}
                onMove={(by) => move(index, index + by)}
                onRemove={() => remove(field.name)}
              />
            ))}
            <Form.ErrorList errors={errors} />
          </Card>
        )}
      </Form.List>
    </Form>
  );
}

function ExerciseRow({
  name,
  index,
  count,
  onMove,
  onRemove,
}: {
  name: number;
  index: number;
  count: number;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}) {
  const form = Form.useFormInstance<TemplateFormValues>();
  const mode = Form.useWatch(['exercises', name, 'mode'], form);
  const timed = mode === 'timed';
  const label = `exercise ${index + 1}`;

  return (
    <div className="exercise-row">
      {/* Carries an existing exercise's id through to the save. */}
      <Form.Item name={[name, 'id']} hidden>
        <Input />
      </Form.Item>
      <Row gutter={12} align="top">
        <Col xs={24} lg={6}>
          <Form.Item
            label={`${index + 1}. Name`}
            name={[name, 'name']}
            rules={[
              { required: true, whitespace: true, message: 'Enter a name' },
              { max: 80 },
            ]}
          >
            <Input placeholder="Push-up" aria-label={`Name of ${label}`} />
          </Form.Item>
        </Col>
        <Col xs={12} lg={4}>
          <Form.Item
            label="Muscle group"
            name={[name, 'muscleGroup']}
            rules={[
              { required: true, whitespace: true, message: 'Pick a group' },
              { max: 40 },
            ]}
          >
            <AutoComplete
              options={muscleOptions}
              placeholder="Chest"
              aria-label={`Muscle group of ${label}`}
              filterOption={(input, option) =>
                (option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
        <Col xs={12} lg={2}>
          <Form.Item
            label="Sets"
            name={[name, 'sets']}
            rules={[{ required: true, type: 'integer', min: 1, max: 20 }]}
          >
            <InputNumber
              min={1}
              max={20}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={12} lg={3}>
          <Form.Item label="Type" name={[name, 'mode']}>
            <Segmented
              options={[
                { label: 'Reps', value: 'reps' },
                { label: 'Timed', value: 'timed' },
              ]}
            />
          </Form.Item>
        </Col>
        <Col xs={12} lg={2}>
          <Form.Item
            label={timed ? 'Seconds' : 'Reps'}
            name={[name, 'amount']}
            // Re-check the limit when the type switches.
            dependencies={[['exercises', name, 'mode']]}
            rules={[
              // Reads the type when validating, not when this row rendered.
              ({ getFieldValue }) => {
                const isTimed =
                  getFieldValue(['exercises', name, 'mode']) === 'timed';
                return {
                  required: true,
                  type: 'integer',
                  min: 1,
                  max: isTimed ? 3600 : 200,
                  message: isTimed ? '1–3600 seconds' : '1–200 reps',
                };
              },
            ]}
          >
            <InputNumber
              min={1}
              max={timed ? 3600 : 200}
              precision={0}
              style={{ width: '100%' }}
              aria-label={`${timed ? 'Seconds' : 'Reps'} of ${label}`}
            />
          </Form.Item>
        </Col>
        <Col xs={12} lg={2}>
          <Form.Item
            label="Rest (s)"
            name={[name, 'restSeconds']}
            rules={[{ required: true, type: 'integer', min: 0, max: 900 }]}
          >
            <InputNumber
              min={0}
              max={900}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={12} lg={2}>
          <Form.Item
            label="Load (kg)"
            name={[name, 'weightKg']}
            rules={[{ required: true, type: 'number', min: 0, max: 500 }]}
          >
            <InputNumber
              min={0}
              max={500}
              step={0.5}
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} lg={3}>
          <Form.Item label=" " colon={false}>
            <Space size={4}>
              <Button
                icon={<ArrowUpOutlined />}
                aria-label={`Move ${label} up`}
                disabled={index === 0}
                onClick={() => onMove(-1)}
              />
              <Button
                icon={<ArrowDownOutlined />}
                aria-label={`Move ${label} down`}
                disabled={index === count - 1}
                onClick={() => onMove(1)}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                aria-label={`Remove ${label}`}
                disabled={count === 1}
                onClick={onRemove}
              />
            </Space>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
}
