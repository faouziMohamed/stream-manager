export interface StreamingAccountRecord {
  createdAt: Date;
  email: string | null;
  id: string;
  isActive: boolean;
  label: string;
  maxProfiles: number;
  passwordEncrypted: string | null;
  serviceId: string;
  supportsProfiles: boolean;
  updatedAt: Date;
}

export interface StreamingAccountDto {
  createdAt: string;
  email: string | null;
  id: string;
  isActive: boolean;
  label: string;
  maxProfiles: number;
  serviceId: string;
  supportsProfiles: boolean;
  updatedAt: string;
}

export interface StreamingProfileRecord {
  accountId: string;
  createdAt: Date;
  id: string;
  isAssigned: boolean;
  name: string;
  pinEncrypted: string | null;
  updatedAt: Date;
}

export interface StreamingProfileDto {
  accountId: string;
  createdAt: string;
  id: string;
  isAssigned: boolean;
  name: string;
  updatedAt: string;
}

export interface StreamingProfileAssignmentRecord {
  accountId: string;
  assignedAt: Date;
  createdAt: Date;
  id: string;
  membershipId: string;
  profileId: string | null;
}

export interface StreamingAccountWithProfilesRecord extends StreamingAccountRecord {
  profiles: StreamingProfileRecord[];
}

export interface StreamingAccountWithProfilesDto extends StreamingAccountDto {
  profiles: StreamingProfileDto[];
}

export interface StreamingProfileAssignmentDto {
  accountId: string;
  assignedAt: string;
  createdAt: string;
  id: string;
  membershipId: string;
  profileId: string | null;
}
