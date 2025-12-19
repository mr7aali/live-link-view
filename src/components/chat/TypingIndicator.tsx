export default function TypingIndicator({ userId }: { userId: string | null }) {
  if (!userId) return null;

  return <div className="px-3 text-sm text-gray-500">Someone is typing...</div>;
}
