import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

export enum UserStoryPriority {
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum UserStoryStatus {
  Backlog = 'Backlog',
  InProgress = 'In Progress',
  QAReview = 'QA Review',
  Done = 'Done',
}

@Entity('project_user_stories')
export class UserStory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  title?: string;

  @Column({ nullable: true })
  actor?: string;

  @Column({ type: 'text' })
  goal: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  benefit?: string;

  @Column({ type: 'text', nullable: true })
  acceptanceCriteria?: string;

  @Column({
    type: 'enum',
    enum: UserStoryPriority,
    default: UserStoryPriority.Medium,
  })
  priority: UserStoryPriority;

  @Column({
    type: 'enum',
    enum: UserStoryStatus,
    default: UserStoryStatus.Backlog,
  })
  status: UserStoryStatus;

  @Column({ type: 'date', nullable: true })
  dueDate?: string;

  @Column({ nullable: true })
  assigneeId?: string;

  @Column({ nullable: true })
  assigneeName?: string;

  @Column({ type: 'simple-array', nullable: true })
  attachmentNames?: string[];

  @ManyToOne(() => Project, (project) => project.userStories)
  project: Project;
}
