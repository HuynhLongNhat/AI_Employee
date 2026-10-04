import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type PromotionScope = "all" | "product";
export type PromotionStatus = "active" | "inactive";

@Entity("promotions")
export class PromotionEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "text", default: "" })
  description: string;

  @Column({ type: "simple-json" })
  keywords: string[];

  @Column({ type: "text", default: "" })
  condition: string;

  @Column({ type: "text", default: "" })
  discount: string;

  @Column({ type: "text", default: "all" })
  scope: PromotionScope;

  @Column({ type: "simple-json", default: "[]" })
  productIds: string[];

  @Column({ type: "text", default: "active" })
  status: PromotionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}