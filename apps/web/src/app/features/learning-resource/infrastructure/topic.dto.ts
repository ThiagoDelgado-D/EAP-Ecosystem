export interface TopicDto {
  id: string;
  name: string;
  color: string;
  resourceCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TopicListDto {
  topics: TopicDto[];
}
