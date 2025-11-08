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
}

export interface Message {
  id: string;
  item_id: string;
  sender_id: string;
  text: string;
  created_at?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

