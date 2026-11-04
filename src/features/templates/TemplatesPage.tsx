import { ArrowDown, ArrowUp, Pencil, Plus, TrashBin } from '@gravity-ui/icons';
import {
  AlertDialog,
  Button,
  Card,
  Link,
  Spinner,
  toast,
  Tooltip,
} from '@heroui/react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { formatDateTime } from '../../format';
import { DataTable } from '../../ui/DataTable';
import { EmptyRows, Notice } from '../../ui/feedback';
import { PageHeader } from '../../ui/PageHeader';
import { useDeleteTemplate, useReorderTemplates, useTemplates } from './api';
import { CategoryChip, LevelChip } from './labels';
import { moved } from './moved';
import { templateEditPath } from './paths';
import type { Template } from './types';

/** An icon button named for screen readers and, on hover, in a tooltip. */
function IconAction({
  label,
  tip,
  danger = false,
  isDisabled,
  onPress,
  children,
}: {
  label: string;
  tip: string;
  danger?: boolean;
  isDisabled?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip delay={400}>
      <Button
        isIconOnly
        size="sm"
        variant={danger ? 'danger-soft' : 'ghost'}
        aria-label={label}
        isDisabled={isDisabled}
        onPress={onPress}
      >
        {children}
      </Button>
      <Tooltip.Content>{tip}</Tooltip.Content>
    </Tooltip>
  );
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const templates = useTemplates();
  const remove = useDeleteTemplate();
  const reorder = useReorderTemplates();
  const [deleting, setDeleting] = useState<Template | null>(null);
  const list = templates.data ?? [];
  const ids = list.map((item) => item.id);
  // Reordering sends every id: wait until the list matches the server.
  const orderLocked =
    reorder.isPending || remove.isPending || templates.isFetching;

  const move = (index: number, by: -1 | 1) =>
    reorder.mutate(moved(ids, index, by), {
      onError: (error) => toast.danger(error.message),
    });

  const confirmDelete = () => {
    if (!deleting) return;
    const template = deleting;
    setDeleting(null);
    remove.mutate(template.id, {
      onSuccess: () => toast.success(`Deleted ${template.name}`),
      onError: (error) => toast.danger(error.message),
    });
  };

  return (
    <>
      <PageHeader
        title="Workout templates"
        description="The public library every FitFlow user sees, in this order."
        actions={
          <Button onPress={() => navigate('/templates/new')}>
            <Plus />
            New template
          </Button>
        }
      />
      {templates.isError && (
        <Notice status="danger" title={templates.error.message} />
      )}
      <Card>
        <DataTable
          label="Workout templates"
          contentClassName="min-w-[900px]"
          rows={list}
          rowKey={(template) => template.id}
          empty={
            templates.isPending ? (
              <div className="flex justify-center py-10">
                <Spinner aria-label="Loading templates" />
              </div>
            ) : (
              <EmptyRows>No templates yet</EmptyRows>
            )
          }
          columns={[
            {
              title: '#',
              className: 'tabular w-12 text-muted',
              render: (template) => ids.indexOf(template.id) + 1,
            },
            {
              title: 'Name',
              rowHeader: true,
              render: (template) => (
                <div className="min-w-0">
                  <Link href={templateEditPath(template.id)}>
                    {template.name}
                  </Link>
                  <div className="truncate font-mono text-xs text-muted">
                    {template.id}
                  </div>
                </div>
              ),
            },
            {
              title: 'Category',
              render: (template) => (
                <CategoryChip category={template.category} />
              ),
            },
            {
              title: 'Level',
              render: (template) => <LevelChip level={template.level} />,
            },
            {
              title: 'Duration',
              numeric: true,
              render: (template) => `${template.durationMinutes} min`,
            },
            {
              title: 'Exercises',
              numeric: true,
              render: (template) => template.exercises.length,
            },
            {
              title: 'Last edited',
              className: 'tabular whitespace-nowrap',
              render: (template) =>
                template.updatedAt ? formatDateTime(template.updatedAt) : '—',
            },
            {
              title: 'Actions',
              render: (template) => {
                const index = ids.indexOf(template.id);
                return (
                  <div className="flex items-center gap-1">
                    <IconAction
                      label={`Move ${template.name} up`}
                      tip="Move up"
                      isDisabled={index === 0 || orderLocked}
                      onPress={() => move(index, -1)}
                    >
                      <ArrowUp />
                    </IconAction>
                    <IconAction
                      label={`Move ${template.name} down`}
                      tip="Move down"
                      isDisabled={index === ids.length - 1 || orderLocked}
                      onPress={() => move(index, 1)}
                    >
                      <ArrowDown />
                    </IconAction>
                    <IconAction
                      label={`Edit ${template.name}`}
                      tip="Edit"
                      onPress={() => navigate(templateEditPath(template.id))}
                    >
                      <Pencil />
                    </IconAction>
                    <IconAction
                      label={`Delete ${template.name}`}
                      tip="Delete"
                      danger
                      isDisabled={orderLocked}
                      onPress={() => setDeleting(template)}
                    >
                      <TrashBin />
                    </IconAction>
                  </div>
                );
              },
            },
          ]}
        />
      </Card>

      <AlertDialog.Backdrop
        isOpen={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        isDismissable
        isKeyboardDismissDisabled={false}
      >
        <AlertDialog.Container>
          <AlertDialog.Dialog className="sm:max-w-md">
            <AlertDialog.Header>
              <AlertDialog.Icon status="danger" />
              <AlertDialog.Heading>
                Delete “{deleting?.name}”?
              </AlertDialog.Heading>
            </AlertDialog.Header>
            <AlertDialog.Body>
              <p>Phones drop it from the library on their next refresh.</p>
            </AlertDialog.Body>
            <AlertDialog.Footer>
              <Button slot="close" variant="tertiary">
                Cancel
              </Button>
              <Button variant="danger" onPress={confirmDelete}>
                Delete
              </Button>
            </AlertDialog.Footer>
          </AlertDialog.Dialog>
        </AlertDialog.Container>
      </AlertDialog.Backdrop>
    </>
  );
}
