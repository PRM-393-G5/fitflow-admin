import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import {
  Alert,
  App,
  Button,
  Card,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Link, useNavigate } from 'react-router';
import { formatDateTime } from '../../format';
import { useDeleteTemplate, useReorderTemplates, useTemplates } from './api';
import { moved } from './moved';
import { templateEditPath } from './paths';
import { CATEGORY_COLORS, LEVEL_COLORS, type Template } from './types';

export function TemplatesPage() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const templates = useTemplates();
  const remove = useDeleteTemplate();
  const reorder = useReorderTemplates();
  const ids = templates.data?.map((item) => item.id) ?? [];
  // Reordering sends every id: wait until the list matches the server.
  const orderLocked =
    reorder.isPending || remove.isPending || templates.isFetching;

  const move = (index: number, by: -1 | 1) =>
    reorder.mutate(moved(ids, index, by), {
      onError: (error) => message.error(error.message),
    });

  const columns: ColumnsType<Template> = [
    {
      title: '#',
      key: 'order',
      width: 56,
      render: (_, __, index) => index + 1,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      render: (name: string, template) => (
        <Space orientation="vertical" size={0}>
          <Link to={templateEditPath(template.id)}>{name}</Link>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {template.id}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      render: (category: string) => (
        <Tag color={CATEGORY_COLORS[category]}>{category}</Tag>
      ),
    },
    {
      title: 'Level',
      dataIndex: 'level',
      render: (level: string) => <Tag color={LEVEL_COLORS[level]}>{level}</Tag>,
    },
    {
      title: 'Duration',
      dataIndex: 'durationMinutes',
      render: (minutes: number) => `${minutes} min`,
    },
    {
      title: 'Exercises',
      key: 'exercises',
      render: (_, template) => template.exercises.length,
    },
    {
      title: 'Last edited',
      dataIndex: 'updatedAt',
      render: (updatedAt: string | null) =>
        updatedAt ? formatDateTime(updatedAt) : '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, template, index) => (
        <Space size={4}>
          <Tooltip title="Move up">
            <Button
              size="small"
              icon={<ArrowUpOutlined />}
              aria-label={`Move ${template.name} up`}
              disabled={index === 0 || orderLocked}
              onClick={() => move(index, -1)}
            />
          </Tooltip>
          <Tooltip title="Move down">
            <Button
              size="small"
              icon={<ArrowDownOutlined />}
              aria-label={`Move ${template.name} down`}
              disabled={index === ids.length - 1 || orderLocked}
              onClick={() => move(index, 1)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              aria-label={`Edit ${template.name}`}
              onClick={() => navigate(templateEditPath(template.id))}
            />
          </Tooltip>
          <Popconfirm
            title={`Delete “${template.name}”?`}
            description="Phones drop it from the library on their next refresh."
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() =>
              remove.mutateAsync(template.id).then(
                () => message.success(`Deleted ${template.name}`),
                (error: Error) => message.error(error.message),
              )
            }
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              aria-label={`Delete ${template.name}`}
              disabled={orderLocked}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="page-header">
        <div>
          <Typography.Title level={2}>Workout templates</Typography.Title>
          <Typography.Text type="secondary">
            The public library every FitFlow user sees, in this order.
          </Typography.Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/templates/new')}
        >
          New template
        </Button>
      </div>
      {templates.isError && (
        <Alert
          type="error"
          showIcon
          title={templates.error.message}
          style={{ marginBottom: 16 }}
        />
      )}
      <Card>
        <Table<Template>
          rowKey="id"
          columns={columns}
          dataSource={templates.data}
          loading={templates.isPending}
          pagination={false}
          scroll={{ x: 900 }}
        />
      </Card>
    </>
  );
}
