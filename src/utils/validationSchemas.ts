/**
 * validationSchemas.ts
 *
 * Why this file exists: centralising Yup schemas prevents duplication and
 * makes validation rules easy to test in isolation without mounting screens.
 *
 * Convention: one exported schema per form.  Each schema has a companion
 * TypeScript type derived with `yup.InferType` so form values are always
 * in sync with validation rules.
 */
import * as yup from 'yup';

// ---------------------------------------------------------------------------
// Auth — Sign In
// ---------------------------------------------------------------------------

export const signInSchema = yup.object({
  email: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Email is required.'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required.'),
});

export type SignInFormValues = yup.InferType<typeof signInSchema>;

// ---------------------------------------------------------------------------
// Auth — Sign Up
// ---------------------------------------------------------------------------

export const signUpSchema = yup.object({
  displayName: yup
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be 50 characters or fewer.')
    .required('Full name is required.'),
  email: yup
    .string()
    .trim()
    .email('Enter a valid email address.')
    .required('Email is required.'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required.'),
  // ref() links this field's validation to the password field value
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});

export type SignUpFormValues = yup.InferType<typeof signUpSchema>;

// ---------------------------------------------------------------------------
// Family — Create
// ---------------------------------------------------------------------------

export const createFamilySchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, 'Family name cannot be empty.')
    .max(40, 'Family name must be 40 characters or fewer.')
    .required('Family name is required.'),
});

export type CreateFamilyFormValues = yup.InferType<typeof createFamilySchema>;

// ---------------------------------------------------------------------------
// Family — Join via invite code
// ---------------------------------------------------------------------------

export const joinFamilySchema = yup.object({
  code: yup
    .string()
    .trim()
    // Invite codes are exactly 6 uppercase alpha-numeric characters
    .length(6, 'Invite code must be exactly 6 characters.')
    .matches(/^[A-Z0-9]+$/, 'Code must contain only letters and numbers.')
    .required('Invite code is required.'),
});

export type JoinFamilyFormValues = yup.InferType<typeof joinFamilySchema>;
