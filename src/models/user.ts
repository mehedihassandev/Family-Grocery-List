export type TUserRole = "owner" | "member";

export interface IUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  familyId?: string | null;
  role?: TUserRole | null;
}
