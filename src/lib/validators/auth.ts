
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

export const UpdateSuperAdminSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Please enter a valid email address.' }),
    currentPassword: z.string().min(1, { message: 'Your current password is required to save changes.' }),
    password: z.string().min(8, { message: 'New password must be at least 8 characters.' }).optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
}).refine(data => {
    if (data.password && data.password !== data.confirmPassword) {
        return false;
    }
    return true;
}, {
    message: "New passwords do not match.",
    path: ["confirmPassword"],
});


export const FacultySchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  abbreviation: z.string().min(1, { message: 'Abbreviation is required.' }).max(10, { message: 'Abbreviation cannot exceed 10 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  department: z.string().min(1, { message: 'Please select a department.' }),
  weeklyMaxHours: z.coerce.number().min(0, { message: "Weekly max hours can't be negative." }),
  weeklyOffDays: z.array(z.string()).optional(),
});

export const CreateFacultyFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  abbreviation: z.string().min(1, { message: 'Abbreviation is required.' }).max(10, { message: 'Abbreviation cannot exceed 10 characters.' }),
  email: z.string()
    .min(1, { message: 'Email username is required.' })
    .regex(/^[a-zA-Z0-9._+-]+$/, { message: 'Invalid characters in username.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  department: z.string().min(1, { message: 'Please select a department.' }),
  weeklyMaxHours: z.coerce.number().min(0, { message: "Weekly max hours can't be negative." }),
  weeklyOffDays: z.array(z.string()).optional(),
});

export const UpdateFacultySchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    abbreviation: z.string().min(1, { message: 'Abbreviation is required.' }).max(10, { message: 'Abbreviation cannot exceed 10 characters.' }),
    email: z.string().email(),
    department: z.string().min(1, { message: 'Please select a department.' }),
    weeklyMaxHours: z.coerce.number().min(0, { message: "Weekly max hours can't be negative." }),
    weeklyOffDays: z.array(z.string()).optional(),
    password: z.string().min(8, { message: 'New password must be at least 8 characters.' }).optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
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
});

export const FacultyChangePasswordSchema = z.object({
  email: z.string().email(),
  adminEmail: z.string().email(),
  currentPassword: z.string().min(1, { message: 'Current password is required.' }),
  password: z.string().min(8, { message: 'New password must be at least 8 characters.' }),
  confirmPassword: z.string().min(8, { message: 'Please confirm your new password.' }),
}).refine(data => data.password === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

export const BuildingSchema = z.object({
  name: z.string().min(2, { message: 'Building name must be at least 2 characters.' }),
});

export const FloorSchema = z.object({
  name: z.string().min(1, { message: 'Floor name or number is required.' }),
});

export const AddFloorSchema = z.object({
  buildingId: z.string(),
  names: z.array(z.object({
    name: z.string().min(1, { message: 'Floor name cannot be empty.' })
  })).min(1, { message: 'Please add at least one floor.' }),
});

export const UpdateFloorSchema = FloorSchema.extend({
  buildingId: z.string(),
  floorId: z.string(),
});

export const RoomSchema = z.object({
  name: z.string().min(1, { message: 'Room name or number is required.' }),
  capacity: z.coerce.number().min(1, { message: 'Capacity must be at least 1.' }),
});

export const BatchAddRoomSchema = z.object({
  buildingId: z.string(),
  floorId: z.string(),
  prefix: z.string().min(1, { message: 'Room prefix is required.' }),
  start: z.coerce.number().min(1, { message: 'Start number must be at least 1.' }),
  end: z.coerce.number().min(1, { message: 'End number must be at least 1.' }),
  capacity: z.coerce.number().min(1, { message: 'Capacity must be at least 1.' }),
}).refine(data => data.end >= data.start, {
  message: 'End number must be greater than or equal to start number.',
  path: ['end'],
});

export const UpdateRoomSchema = RoomSchema.extend({
  buildingId: z.string(),
  floorId: z.string(),
  roomId: z.string(),
});

export const DepartmentSchema = z.object({
  name: z.string().min(2, { message: 'Department name must be at least 2 characters.' }),
});

export const UpdateDepartmentSchema = DepartmentSchema.extend({
  id: z.string(),
});

export const ProgramSchema = z.object({
  name: z.string().min(2, { message: 'Program name must be at least 2 characters.' }),
});

export const YearSchema = z.object({
    name: z.string().min(1, { message: 'Year name is required.' }),
});

export const AddYearsSchema = z.object({
    departmentId: z.string(),
    programId: z.string(),
    names: z.array(z.object({
        name: z.string().min(1, { message: 'Year name cannot be empty.' })
    })).min(1, { message: 'Please add at least one year.' }),
});

export const UpdateYearSchema = YearSchema.extend({
    departmentId: z.string(),
    programId: z.string(),
    yearId: z.string(),
});

export const SectionSchema = z.object({
    name: z.string().min(1, { message: 'Section name is required.' }),
    studentCount: z.coerce.number().min(1, { message: 'Student count must be at least 1.' }),
});

export const BatchAddSectionSchema = z.object({
    departmentId: z.string(),
    programId: z.string(),
    yearId: z.string(),
    prefix: z.string().min(1, { message: 'Section prefix is required.' }),
    start: z.coerce.number().min(1, { message: 'Start number must be at least 1.' }),
    end: z.coerce.number().min(1, { message: 'End number must be at least 1.' }),
    studentCount: z.coerce.number().min(1, { message: 'Student count must be at least 1.' }),
}).refine(data => data.end >= data.start, {
    message: 'End number must be greater than or equal to start number.',
    path: ['end'],
});

export const UpdateSectionSchema = SectionSchema.extend({
    departmentId: z.string(),
    programId: z.string(),
    yearId: z.string(),
    sectionId: z.string(),
});

export const SubjectSchema = z.object({
  name: z.string().min(3, { message: 'Subject name must be at least 3 characters.' }),
  code: z.string().min(3, { message: 'Subject code must be at least 3 characters.' }),
  type: z.enum(['Theory', 'Lab', 'Theory+Lab', 'Project'], {
    required_error: "You need to select a subject type.",
  }),
  departmentId: z.string({ required_error: "Please select a department." }).min(1, { message: 'Please select a department.' }),
  programId: z.string({ required_error: "Please select a program." }).min(1, { message: 'Please select a program.' }),
  yearId: z.string({ required_error: "Please select a year." }).min(1, { message: 'Please select a year.' }),
  facultyEmail: z.string({ required_error: "Please select a faculty member." }).email({ message: 'Please select a valid faculty member.' }),
  theoryCredits: z.coerce.number().optional(),
  labCredits: z.coerce.number().optional(),
});

export const UpdateSubjectSchema = SubjectSchema.extend({
    id: z.string(),
});

export const DeveloperSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Name is required."),
    role: z.string().min(1, "Role is required."),
    bio: z.string().min(1, "Bio is required."),
    avatar: z.string().min(1, "Avatar image is required."),
    hint: z.string(),
    email: z.string().min(1, "Email link is required."),
    github: z.string().url("GitHub link must be a valid URL."),
    linkedin: z.string().url("LinkedIn link must be a valid URL."),
});

export const DeveloperPageContentSchema = z.object({
    aboutTitle: z.string().min(1, "About title is required."),
    aboutDescription: z.string().min(1, "About description is required."),
    teamTitle: z.string().min(1, "Team title is required."),
    teamDescription: z.string().min(1, "Team description is required."),
});

export const LogoSchema = z.object({
  logo: z.string().min(1, "Logo image is required.").refine(
    (val) => val.startsWith('data:image/png;base64,'),
    { message: 'Only PNG images are allowed.' }
  ),
});
