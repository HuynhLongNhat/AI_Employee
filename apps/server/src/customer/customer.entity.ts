import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("customers")
export class CustomerEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  businessId: string;

  @Column({ type: "text" })
  customerId: string; // Clerk ID hoặc Guest UUID

  @Column({ type: "text", nullable: true })
  name: string | null;

  @Column({ type: "text", default: "bronze" })
  tier: "bronze" | "silver" | "gold";

  @Column({ type: "integer", default: 0 })
  points: number;

  @UpdateDateColumn()
  updatedAt: Date;
}