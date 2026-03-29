export interface TopicDto {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TopicListDto {
  topics: TopicDto[];
}
