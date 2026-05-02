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
import * as yup from "yup";
import {
  EFormModelKey,
  ICreateFamilyFormModel,
  IJoinFamilyFormModel,
  ISignInFormModel,
  ISignUpFormModel,
  TFormModelMap,
} from "./formModels";

// ---------------------------------------------------------------------------
// Auth — Sign In
// ---------------------------------------------------------------------------

export const signInSchema: yup.ObjectSchema<ISignInFormModel> = yup.object({
  email: yup.string().trim().email("Enter a valid email address.").required("Email is required."),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters.")
    .required("Password is required."),
});

export type SignInFormValues = ISignInFormModel;

// ---------------------------------------------------------------------------
// Auth — Sign Up
// ---------------------------------------------------------------------------

export const signUpSchema: yup.ObjectSchema<ISignUpFormModel> = yup.object({
  displayName: yup
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name must be 50 characters or fewer.")
    .required("Full name is required."),
  email: yup.string().trim().email("Enter a valid email address.").required("Email is required."),
  password: yup
    .string()
    .min(6, "Password must be at least 6 characters.")
    .required("Password is required."),
  // ref() links this field's validation to the password field value
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match.")
    .required("Please confirm your password."),
});

export type SignUpFormValues = ISignUpFormModel;

// ---------------------------------------------------------------------------
// Family — Create
// ---------------------------------------------------------------------------

export const createFamilySchema: yup.ObjectSchema<ICreateFamilyFormModel> = yup.object({
  name: yup
    .string()
    .trim()
    .min(1, "Family name cannot be empty.")
    .max(40, "Family name must be 40 characters or fewer.")
    .required("Family name is required."),
});

export type CreateFamilyFormValues = ICreateFamilyFormModel;

// ---------------------------------------------------------------------------
// Family — Join via invite code
// ---------------------------------------------------------------------------

export const joinFamilySchema: yup.ObjectSchema<IJoinFamilyFormModel> = yup.object({
  code: yup
    .string()
    .trim()
    // Invite codes are exactly 6 uppercase alpha-numeric characters
    .length(6, "Invite code must be exactly 6 characters.")
    .matches(/^[A-Z0-9]+$/, "Code must contain only letters and numbers.")
    .required("Invite code is required."),
});

export type JoinFamilyFormValues = IJoinFamilyFormModel;

export const formSchemaMap: {
  [K in EFormModelKey]: yup.ObjectSchema<TFormModelMap[K]>;
} = {
  [EFormModelKey.AUTH_SIGN_IN]: signInSchema,
  [EFormModelKey.AUTH_SIGN_UP]: signUpSchema,
  [EFormModelKey.FAMILY_CREATE]: createFamilySchema,
  [EFormModelKey.FAMILY_JOIN]: joinFamilySchema,
};

export const getValidationSchema = <T extends EFormModelKey>(
  formKey: T,
): yup.ObjectSchema<TFormModelMap[T]> => formSchemaMap[formKey];
