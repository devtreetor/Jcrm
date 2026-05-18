import { z } from 'zod';
import { ROLES } from '@/lib/constants';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember_me: z.boolean().optional().default(false),
});

export const createUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200, 'Full name too long'),
  email: z.string().email('Invalid email format'),
  role: z.enum(ROLES as unknown as [string, ...string[]]),
  team_lead_id: z.string().uuid('Invalid team lead ID').nullable().optional(),
});

export const updateUserSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200, 'Full name too long').optional(),
  email: z.string().email('Invalid email format').optional(),
  role: z.enum(ROLES as unknown as [string, ...string[]]).optional(),
  team_lead_id: z.string().uuid('Invalid team lead ID').nullable().optional(),
  is_active: z.boolean().optional(),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(6, 'Current password must be at least 6 characters'),
  new_password: z.string().min(6, 'New password must be at least 6 characters'),
  confirm_password: z.string().min(6, 'Confirm password must be at least 6 characters'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'New password and confirm password do not match',
  path: ['confirm_password'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
