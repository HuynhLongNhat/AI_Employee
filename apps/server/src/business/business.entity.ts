import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("businesses")
export class BusinessEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  ownerUserId: string;

  @Column({ type: "text", default: "My Business" })
  name: string;

  @Column({ type: "text", default: "" })
  industry: string;

  // THÊM CỘT NÀY
  @Column({ type: "text", unique: true, nullable: true })
  slug: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}