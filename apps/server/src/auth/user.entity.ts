import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", unique: true })
  clerkUserId: string;

  @Column({ type: "text", nullable: true })
  email: string | null;

  @CreateDateColumn()
  createdAt: Date;
}