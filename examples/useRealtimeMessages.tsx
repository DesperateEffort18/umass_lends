/**
 * React Hook for Real-time Messages
 * 
 * A complete React hook example for using real-time messaging in your components
 */

import { useEffect, useState, useCallback } from 'react';
import { subscribeToMessages } from './realtime-messaging';
import { Message } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';

/**
 * Custom hook for real-time messages
 * 
 * @param itemId - The ID of the item to listen for messages
 * @returns Object containing messages array, loading state, and sendMessage function
 * 
 * @example
 * ```tsx
 * function ItemChat({ itemId }: { itemId: string }) {
 *   const { messages, loading, sendMessage } = useRealtimeMessages(itemId);
 * 
 *   const handleSend = async () => {
 *     await sendMessage('Hello!');
 *   };
 * 
 *   return (
 *     <div>
 *       {messages.map((msg) => (
 *         <div key={msg.id}>{msg.text}</div>
 *       ))}
 *       <button onClick={handleSend}>Send</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useRealtimeMessages(itemId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('messages')
          .select('*')
          .eq('item_id', itemId)
          .order('created_at', { ascending: true });

        if (fetchError) {
          setError(fetchError.message);
        } else {
          setMessages(data as Message[]);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (itemId) {
      loadMessages();
    }
  }, [itemId]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!itemId) return;

    const unsubscribe = subscribeToMessages(itemId, (newMessage) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
    });

    return () => {
      unsubscribe();
    };
  }, [itemId]);

  // Send a message
  const sendMessage = useCallback(
    async (text: string) => {
      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            item_id: itemId,
            text,
          }),
        });

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Failed to send message');
        }

        // Message will be added via realtime subscription
        return data.data as Message;
      } catch (err: any) {
        setError(err.message);
        throw err;
      }
    },
    [itemId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
  };
}

