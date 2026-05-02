export enum EFormModelKey {
  AUTH_SIGN_IN = "auth_sign_in",
  AUTH_SIGN_UP = "auth_sign_up",
  FAMILY_CREATE = "family_create",
  FAMILY_JOIN = "family_join",
}

export interface ISignInFormModel {
  email: string;
  password: string;
}

export interface ISignUpFormModel extends ISignInFormModel {
  displayName: string;
  confirmPassword: string;
}

export interface ICreateFamilyFormModel {
  name: string;
}

export interface IJoinFamilyFormModel {
  code: string;
}

export type TFormModelMap = {
  [EFormModelKey.AUTH_SIGN_IN]: ISignInFormModel;
  [EFormModelKey.AUTH_SIGN_UP]: ISignUpFormModel;
  [EFormModelKey.FAMILY_CREATE]: ICreateFamilyFormModel;
  [EFormModelKey.FAMILY_JOIN]: IJoinFamilyFormModel;
};

export const formDefaultValues: TFormModelMap = {
  [EFormModelKey.AUTH_SIGN_IN]: {
    email: "",
    password: "",
  },
  [EFormModelKey.AUTH_SIGN_UP]: {
    displayName: "",
    email: "",
    password: "",
    confirmPassword: "",
  },
  [EFormModelKey.FAMILY_CREATE]: {
    name: "",
  },
  [EFormModelKey.FAMILY_JOIN]: {
    code: "",
  },
};

export const getFormDefaultValues = <T extends EFormModelKey>(formKey: T): TFormModelMap[T] =>
  formDefaultValues[formKey];
