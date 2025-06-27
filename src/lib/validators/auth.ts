import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export const SignupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export const UpdateAdminSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email(),
    password: z.string().min(8, { message: 'New password must be at least 8 characters.' }).optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    currentPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.password && !data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Please confirm your new password.",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.password && data.confirmPassword && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
}).refine(data => {
    if (data.password && !data.currentPassword) {
        return false;
    }
    return true;
}, {
    message: "Admin's current password is required to make this change.",
    path: ["currentPassword"],
});
