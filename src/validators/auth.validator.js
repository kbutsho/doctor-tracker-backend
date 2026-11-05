const { z } = require('zod');

exports.loginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, 'Password is required'),
});

const strongPassword = z
  .string()
  .min(8, 'Min 8 characters')
  .max(72, 'Max 72 characters')
  .regex(/[A-Za-z]/, 'Must include a letter')
  .regex(/\d/, 'Must include a number');

exports.updateProfileBody = z
  .object({
    name: z.string().trim().min(2).max(80).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, 'At least one field is required');

exports.changePasswordBody = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: strongPassword,
});

exports.registerBody = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: strongPassword,
  role: z.enum(['admin', 'staff']).default('staff'),
});
