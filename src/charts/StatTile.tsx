import { Card, Typography } from 'antd';
import type { ReactNode } from 'react';

/** A headline number: label, value, and an optional line of context. */
export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
}) {
  return (
    <Card size="small" className="stat-tile">
      <Typography.Text type="secondary">{label}</Typography.Text>
      <div className="stat-tile-value">{value}</div>
      {note && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {note}
        </Typography.Text>
      )}
    </Card>
  );
}
