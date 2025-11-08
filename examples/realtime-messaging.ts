/**
 * Realtime Messaging Example
 * 
 * This example shows how to subscribe to real-time messages for an item
 * using Supabase Realtime. Messages are streamed to clients as they are inserted.
 * 
 * Usage:
 * 1. Import this in your React component or client-side code
 * 2. Call subscribeToMessages(itemId, callback) to start listening
 * 3. Call unsubscribe() to stop listening when component unmounts
 */

import { supabase } from '@/lib/supabaseClient';
import { Message } from '@/lib/types';
import { RealtimeChannel } from '@supabase/supabase-js';

let messageChannel: RealtimeChannel | null = null;

/**
 * Subscribe to real-time messages for a specific item
 * 
 * @param itemId - The ID of the item to listen for messages
 * @param onMessage - Callback function called when a new message is received
 * @returns Function to unsubscribe from the channel
 */
export function subscribeToMessages(
  itemId: string,
  onMessage: (message: Message) => void
): () => void {
  // Unsubscribe from any existing channel
  if (messageChannel) {
    messageChannel.unsubscribe();
  }

  // Create a new channel for this item
  messageChannel = supabase
    .channel(`messages:${itemId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `item_id=eq.${itemId}`,
      },
      (payload) => {
        // Call the callback with the new message
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    if (messageChannel) {
      messageChannel.unsubscribe();
      messageChannel = null;
    }
  };
}

/**
 * React Hook Example for using realtime messages
 * 
 * Usage in a React component:
 * 
 * ```tsx
 * import { useEffect, useState } from 'react';
 * import { subscribeToMessages } from '@/examples/realtime-messaging';
 * import { Message } from '@/lib/types';
 * 
 * function ItemChat({ itemId }: { itemId: string }) {
 *   const [messages, setMessages] = useState<Message[]>([]);
 * 
 *   useEffect(() => {
 *     const unsubscribe = subscribeToMessages(itemId, (newMessage) => {
 *       setMessages((prev) => [...prev, newMessage]);
 *     });
 * 
 *     return () => {
 *       unsubscribe();
 *     };
 *   }, [itemId]);
 * 
 *   return (
 *     <div>
 *       {messages.map((msg) => (
 *         <div key={msg.id}>{msg.text}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */

/**
 * Alternative: Subscribe to all messages (for admin/monitoring)
 * 
 * @param onMessage - Callback function called when any new message is received
 * @returns Function to unsubscribe from the channel
 */
export function subscribeToAllMessages(
  onMessage: (message: Message) => void
): () => void {
  if (messageChannel) {
    messageChannel.unsubscribe();
  }

  messageChannel = supabase
    .channel('messages:all')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      },
      (payload) => {
        onMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    if (messageChannel) {
      messageChannel.unsubscribe();
      messageChannel = null;
    }
  };
}

