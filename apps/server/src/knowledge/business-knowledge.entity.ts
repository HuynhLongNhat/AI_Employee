import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("business_knowledge")
@Index(["businessId", "knowledgeKey"], { unique: true })
export class BusinessKnowledgeEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  businessId: string;

  @Column({ type: "text", name: "key" })
  knowledgeKey: string;

  @Column({ type: "text" })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}