import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email address is required').email('Please enter a valid work email address'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Work email is required').email('Please enter a valid work email address'),
    companyName: z.string().optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Za-z]/, 'Must include letters')
      .regex(/[0-9]/, 'Must include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    terms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms of Service and Privacy Policy to continue',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const workspaceCreateSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters'),
  type: z.string().min(1, 'Please select an organization type'),
  companySize: z.string().min(1, 'Please select company size'),
  description: z.string().optional(),
  accentColor: z.string().optional(),
});

export type WorkspaceCreateFormData = z.infer<typeof workspaceCreateSchema>;

export const profileSetupSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  jobTitle: z.string().min(1, 'Please enter or select your job title'),
  department: z.string().min(1, 'Please select or enter your department'),
  timezone: z.string().min(1, 'Please select your primary timezone'),
  bio: z.string().max(240, 'Bio must be under 240 characters').optional(),
  role: z.string().min(1, 'Please select a demo role for the workspace'),
  avatarColor: z.string().optional(),
});

export type ProfileSetupFormData = z.infer<typeof profileSetupSchema>;

export const preferencesSetupSchema = z.object({
  theme: z.enum(['light', 'dark']),
  inAppNotifications: z.boolean(),
  emailNotifications: z.boolean(),
  taskAssignmentAlerts: z.boolean(),
  deadlineReminders: z.boolean(),
  approvalReminders: z.boolean(),
  timezone: z.string().min(1, 'Please select a timezone'),
});

export type PreferencesSetupFormData = z.infer<typeof preferencesSetupSchema>;
