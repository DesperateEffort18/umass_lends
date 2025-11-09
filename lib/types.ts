/**
 * TypeScript interfaces for UMass Lends platform
 */

export interface User {
  id: string;
  email?: string;
  name?: string;
  created_at?: string;
}

export interface Item {
  id: string;
  owner_id: string;
  title: string;
  description?: string;
  category?: string;
  condition?: string;
  image_url?: string;
  location?: string;
  available: boolean;
  created_at?: string;
}

export interface BorrowRequest {
  id: string;
  item_id: string;
  borrower_id: string;
  owner_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  request_date?: string;
  borrow_start_date?: string;
  borrow_end_date?: string;
  borrow_start_time?: string; // HH:MM:SS format
  borrow_duration_hours?: number;
  borrow_duration_minutes?: number;
  return_deadline_datetime?: string; // ISO 8601 datetime string
  picked_up_at?: string; // ISO 8601 datetime string - when item was actually picked up
  // Added for displaying user names
  borrower_name?: string;
  borrower_email?: string;
  owner_name?: string;
  owner_email?: string;
}

export interface Message {
  id: string;
  item_id: string;
  sender_id: string;
  participant_id: string; // The other person in the conversation (owner or borrower)
  text: string;
  created_at?: string;
  // Display fields
  sender_name?: string;
  sender_email?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

