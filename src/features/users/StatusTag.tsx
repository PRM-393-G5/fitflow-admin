import { Tag } from 'antd';

export function StatusTag({ disabled }: { disabled: boolean }) {
  return disabled ? (
    <Tag color="red">Locked</Tag>
  ) : (
    <Tag color="green">Active</Tag>
  );
}
