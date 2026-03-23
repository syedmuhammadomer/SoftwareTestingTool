import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('pending_registrations')
export class PendingRegistration {
  @PrimaryColumn()
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  passwordHash: string;

  @Column()
  otp: string;

  @Column({ type: 'bigint' })
  otpExpiry: number;

  @Column({ default: 0 })
  attempts: number;

  @CreateDateColumn()
  createdAt: Date;
}