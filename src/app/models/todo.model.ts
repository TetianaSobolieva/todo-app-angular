export type Priority = 'low' | 'medium' | 'high';
export type FilterType = 'all' | 'completed' | 'active';

export interface Todo {
  id: number;
  title: string;
  completed: boolean;
  priority: Priority;
  userId?: number;
}
