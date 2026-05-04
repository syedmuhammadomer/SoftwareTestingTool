import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum TeamMemberStatus {
  Online = 'online',
  Offline = 'offline',
  Invited = 'invited',
}

@Entity('team_members')
export class TeamMember {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  role: string;

  @Column()
  team: string;

  @Column({ nullable: true })
  project?: string;

  @Column({ default: 0 })
  testCases: number;

  @Column({ nullable: true })
  accessPreset?: string;

  @Column({ default: false })
  sendCopy: boolean;

  @Column({ default: false })
  addWelcomeNote: boolean;

  @Column({
    type: 'enum',
    enum: TeamMemberStatus,
    default: TeamMemberStatus.Offline,
  })
  status: TeamMemberStatus;

  @Column({ nullable: true })
  lastActive?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
