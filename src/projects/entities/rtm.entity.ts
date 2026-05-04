import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_rtm_entries')
export class RtmEntry {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  requirementId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array', nullable: true })
  linkedUserStories?: string[];

  @Column({ type: 'simple-array', nullable: true })
  linkedTestCases?: string[];

  @ManyToOne(() => Project, (project) => project.rtm)
  project: Project;
}
