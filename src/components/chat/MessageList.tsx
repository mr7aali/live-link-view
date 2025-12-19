/* eslint-disable @typescript-eslint/no-explicit-any */
export default function MessageList({ messages }: { messages: any[] }) {
  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      {messages.map((msg) => (
        <div key={msg._id} className="bg-gray-200 p-2 rounded max-w-xs">
          {msg.content}
        </div>
      ))}
      {messages.length === 0 && (
        <div className="text-center text-gray-500">No messages yet</div>
      )}
    </div>
  );
}
