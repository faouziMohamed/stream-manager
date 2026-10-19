export type ServiceCategory = 'video' | 'music' | 'gaming' | 'other';

export interface ServiceModel {
  category: ServiceCategory;
  createdAt: Date;
  deletedAt: Date | null;
  descriptionContent: unknown | null;
  id: string;
  imageKey: string | null;
  isActive: boolean;
  name: string;
  supportsProfiles: boolean;
  updatedAt: Date;
}

export interface ServiceDto {
  category: ServiceCategory;
  createdAt: string;
  descriptionContent: unknown | null;
  id: string;
  imageKey: string | null;
  imageUrl: string | null;
  isActive: boolean;
  name: string;
  supportsProfiles: boolean;
  updatedAt: string;
}
