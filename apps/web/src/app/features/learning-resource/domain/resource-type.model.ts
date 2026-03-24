export interface ResourceType {
  id: string;
  code: string;
  displayName: string;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}
