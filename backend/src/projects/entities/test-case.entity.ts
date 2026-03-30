import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Project } from './project.entity';

@Entity('project_test_cases')
export class TestCase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  testCaseId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  preconditions?: string;

  @Column({ type: 'text', nullable: true })
  steps?: string;

  @Column({ type: 'text', nullable: true })
  expectedResult?: string;

  @ManyToOne(() => Project, (project) => project.testCases)
  project: Project;
}
