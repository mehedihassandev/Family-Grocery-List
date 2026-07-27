export interface IFamily {
  id: string;
  name: string;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
}

export interface ICreateFamilyRequest {
  name: string;
}

export interface IJoinFamilyRequest {
  inviteCode: string;
}
