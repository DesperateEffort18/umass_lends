/**
 * Zod validation schemas for request validation
 */
import { z } from 'zod';

// Item schemas
export const createItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  category: z.string().max(100, 'Category must be less than 100 characters').optional(),
  condition: z.string().max(50, 'Condition must be less than 50 characters').optional(),
  image_url: z.string().url('Invalid image URL').optional().or(z.literal('')),
  location: z.string().max(200, 'Location must be less than 200 characters').optional(),
  available: z.boolean().default(true),
});

export const updateItemSchema = createItemSchema.partial();

// Borrow request schemas
export const createBorrowRequestSchema = z.object({
  borrow_start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  borrow_end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  // Required field for exact datetime calculation
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  hours: z.number().int().min(0).max(23).optional(),
  minutes: z.number().int().min(0).max(59).optional(),
  // Accept both ISO 8601 with timezone (YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DDTHH:mm:ss+HH:mm)
  // and local time format (YYYY-MM-DDTHH:mm:ss) to avoid timezone conversion issues
  exactReturnDateTime: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})?$/, 'Invalid datetime format. Expected YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm:ssZ')
    .optional(),
}).refine((data) => {
  const start = new Date(data.borrow_start_date);
  const end = new Date(data.borrow_end_date);
  return end >= start;
}, {
  message: 'End date must be after or equal to start date',
});

export const updateBorrowRequestStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'returned']),
});

// Message schemas
export const createMessageSchema = z.object({
  item_id: z.string().uuid('Invalid item ID'),
  text: z.string().min(1, 'Message text is required').max(1000, 'Message must be less than 1000 characters'),
  participant_id: z.string().uuid('Invalid participant ID').optional(), // Optional: required when owner sends to specific borrower
});

// Query parameter schemas
export const itemIdParamSchema = z.object({
  id: z.string().uuid('Invalid item ID'),
});

export const borrowIdParamSchema = z.object({
  id: z.string().uuid('Invalid borrow request ID'),
});

export const messagesQuerySchema = z.object({
  itemId: z.string().uuid('Invalid item ID'),
});

