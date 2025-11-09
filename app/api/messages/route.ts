/**
 * Messages API Routes
 * POST /api/messages - Send a message
 * GET /api/messages?itemId=xxx - Get messages for an item
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabaseClient';
import { getUser } from '@/lib/getUser';
import { createMessageSchema, messagesQuerySchema } from '@/lib/schemas';
import { Message, ApiResponse } from '@/lib/types';
import { addCorsHeaders, handleOptionsRequest } from '@/lib/cors';

/**
 * Handle OPTIONS request for CORS preflight
 */
export async function OPTIONS() {
  return handleOptionsRequest();
}

/**
 * POST /api/messages
 * Send a message related to an item
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request);
    const body = await request.json();
    
    // Validate request body
    const validatedData = createMessageSchema.parse(body);
    
    const supabase = getSupabaseClient();
    
    // Get the item to verify it exists and get the owner_id
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, owner_id')
      .eq('id', validatedData.item_id)
      .single();
    
    if (itemError || !item) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Determine participant_id for private conversation:
    // - If sender is a borrower: participant_id = owner
    // - If sender is the owner: participant_id = borrower (from request body or find from existing conversation)
    let participantId: string;
    
    if (user.id === item.owner_id) {
      // Owner is sending a message
      if (validatedData.participant_id) {
        // Owner specified which borrower they're talking to
        participantId = validatedData.participant_id;
      } else {
        // Owner didn't specify, find the most recent conversation
        // Get the most recent message for this item where owner is involved
        const { data: recentMessage } = await supabase
          .from('messages')
          .select('sender_id, participant_id')
          .eq('item_id', validatedData.item_id)
          .or(`sender_id.eq.${user.id},participant_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recentMessage) {
          // Determine the borrower from the conversation
          participantId = recentMessage.sender_id === user.id 
            ? recentMessage.participant_id 
            : recentMessage.sender_id;
        } else {
          // No existing conversation - owner can't send first message without knowing borrower
          const response = NextResponse.json<ApiResponse<null>>(
            { success: false, error: 'No conversations yet. Wait for a borrower to message you first.' },
            { status: 400 }
          );
          return addCorsHeaders(response);
        }
      }
    } else {
      // Borrower is sending a message
      participantId = item.owner_id;
    }
    
    // Ensure participant_id is different from sender_id
    if (participantId === user.id) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Cannot send message to yourself' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    // Insert message into database
    const { data, error } = await supabase
      .from('messages')
      .insert({
        item_id: validatedData.item_id,
        sender_id: user.id,
        participant_id: participantId,
        text: validatedData.text,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating message:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<Message>>(
      { success: true, data: data as Message },
      { status: 201 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in POST /api/messages:', error);
    
    // Handle authentication errors
    if (error.message?.includes('Unauthorized')) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 401 }
      );
      return addCorsHeaders(response);
    }
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

/**
 * GET /api/messages?itemId=xxx
 * Get messages for a specific item (private conversation)
 * - If user is owner: returns all conversations (all messages for the item, grouped by participant)
 * - If user is borrower: returns only their conversation with the owner
 */
export async function GET(request: NextRequest) {
  try {
    // Try to get user, but don't require authentication (for viewing items)
    let user = null;
    try {
      user = await getUser(request);
    } catch (error) {
      // User is not authenticated - return empty messages
      const { searchParams } = new URL(request.url);
      const itemId = searchParams.get('itemId');
      
      if (!itemId) {
        const response = NextResponse.json<ApiResponse<null>>(
          { success: false, error: 'itemId query parameter is required' },
          { status: 400 }
        );
        return addCorsHeaders(response);
      }
      
      const response = NextResponse.json<ApiResponse<Message[]>>(
        { success: true, data: [] },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }
    
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    // Validate query parameter
    if (!itemId) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'itemId query parameter is required' },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const validatedQuery = messagesQuerySchema.parse({ itemId });
    
    const supabase = getSupabaseClient();
    
    // Get the item owner
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('owner_id')
      .eq('id', validatedQuery.itemId)
      .single();
    
    if (itemError || !item) {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: 'Item not found' },
        { status: 404 }
      );
      return addCorsHeaders(response);
    }
    
    // Fetch messages based on user role
    let messagesQuery;
    
    if (user.id === item.owner_id) {
      // Owner sees all conversations (all messages for the item)
      messagesQuery = supabase
        .from('messages')
        .select('*')
        .eq('item_id', validatedQuery.itemId)
        .order('created_at', { ascending: true });
    } else {
      // Borrower sees only their conversation with the owner
      // Messages where: (sender is borrower AND participant is owner) OR (sender is owner AND participant is borrower)
      messagesQuery = supabase
        .from('messages')
        .select('*')
        .eq('item_id', validatedQuery.itemId)
        .or(`sender_id.eq.${user.id},participant_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
    }
    
    const { data: messages, error } = await messagesQuery;
    
    if (error) {
      console.error('Error fetching messages:', error);
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.message },
        { status: 500 }
      );
      return addCorsHeaders(response);
    }
    
    if (!messages || messages.length === 0) {
      const response = NextResponse.json<ApiResponse<Message[]>>(
        { success: true, data: [] },
        { status: 200 }
      );
      return addCorsHeaders(response);
    }
    
    // Filter messages for borrowers to show only their conversation with the owner
    let filteredMessages = messages;
    if (user.id !== item.owner_id) {
      // Borrower: only show messages where they are involved with the owner
      filteredMessages = messages.filter((msg: any) => {
        // Message is part of this conversation if:
        // (sender is borrower AND participant is owner) OR (sender is owner AND participant is borrower)
        return (
          (msg.sender_id === user.id && msg.participant_id === item.owner_id) ||
          (msg.sender_id === item.owner_id && msg.participant_id === user.id)
        );
      });
    }
    
    // Get all unique sender IDs
    const senderIds = new Set<string>();
    filteredMessages.forEach((msg: any) => {
      senderIds.add(msg.sender_id);
    });
    
    // Fetch user information for all sender IDs
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', Array.from(senderIds));
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      // Continue even if user fetch fails
    }
    
    // Create a map of user ID to user info
    const usersMap = new Map<string, { name?: string; email?: string }>();
    users?.forEach((u: any) => {
      usersMap.set(u.id, { name: u.name, email: u.email });
    });
    
    // Transform the data to include sender information
    const transformedData = filteredMessages.map((message: any) => {
      const sender = usersMap.get(message.sender_id);
      
      return {
        ...message,
        sender_name: sender?.name || sender?.email || 'Unknown User',
        sender_email: sender?.email || '',
      };
    });
    
    const response = NextResponse.json<ApiResponse<any[]>>(
      { success: true, data: transformedData },
      { status: 200 }
    );
    return addCorsHeaders(response);
  } catch (error: any) {
    console.error('Error in GET /api/messages:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const response = NextResponse.json<ApiResponse<null>>(
        { success: false, error: error.errors[0].message },
        { status: 400 }
      );
      return addCorsHeaders(response);
    }
    
    const response = NextResponse.json<ApiResponse<null>>(
      { success: false, error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
    return addCorsHeaders(response);
  }
}

