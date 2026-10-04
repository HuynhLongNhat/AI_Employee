import { Column, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("business_knowledge")
export class BusinessKnowledgeEntity {
  @PrimaryColumn({ name: "key" })
  knowledgeKey: string;

  @Column({ type: "text" })
  value: string;

  @UpdateDateColumn()
  updatedAt: Date;
}