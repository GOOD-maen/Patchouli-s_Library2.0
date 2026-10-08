import './chatInput.css';

interface ChatInputProps {
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="chatInput">
      <textarea
        className="input-textarea"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入消息，按 Enter 发送，Shift + Enter 换行"
        disabled={isLoading}
      />
      <button
        className="send-btn"
        onClick={onSend}
        disabled={isLoading || !value.trim()}
      >
        {isLoading ? '...' : '发送'}
      </button>
    </div>
  );
}

export default ChatInput;