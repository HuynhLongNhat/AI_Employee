import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type ProductServiceStatus = "active" | "inactive";

@Entity("products_services")
export class ProductServiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  name: string;

  @Column({ type: "integer" })
  price: number;

  @Column({ type: "text", default: "" })
  description: string;

  @Column({ type: "text", default: "" })
  category: string;

  @Column({ type: "text", default: "active" })
  status: ProductServiceStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}