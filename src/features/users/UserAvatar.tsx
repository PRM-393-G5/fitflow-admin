import { Avatar } from '@heroui/react';

/** The user's photo, or the first letter of their name or email. */
export function UserAvatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
}) {
  return (
    <Avatar size={size} color="accent" variant="soft">
      {photoUrl && <Avatar.Image src={photoUrl} alt="" />}
      <Avatar.Fallback>{name.charAt(0).toUpperCase()}</Avatar.Fallback>
    </Avatar>
  );
}
