import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type FaqStatus = "active" | "inactive";

@Entity("faqs")
export class FaqEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  question: string;

  @Column({ type: "text" })
  answer: string;

  @Column({ type: "text", default: "active" })
  status: FaqStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}