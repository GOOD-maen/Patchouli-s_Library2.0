import { useEffect, useRef } from 'react';
import './chatMessages.css';
import type { Message } from '../modelPage';
import { formatMessageTime } from '../utils/formatMessageTime';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
}

function ChatMessages({ messages, isLoading }: ChatMessagesProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chatMessages">
      <div className="chat-header">对话记录</div>
      <div className="chat-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-placeholder">暂无消息，开始对话吧</div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`message-wrapper ${msg.role}`}>
              <div className={`message ${msg.role}`}>
                <div className="message-content">{msg.content}</div>
              </div>
              <div className="message-time">{formatMessageTime(msg.timestamp)}</div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="message-wrapper assistant">
            <div className="message assistant">
              <div className="message-content typing">正在思考...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessages;