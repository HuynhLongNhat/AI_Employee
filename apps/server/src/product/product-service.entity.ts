import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export type ProductServiceStatus = "active" | "inactive";

/**
 * Generic attributes — core KHÔNG biết nội dung.
 * Business tự định nghĩa key/value theo ngành.
 *
 * Convention (không bắt buộc):
 *   - suitableFor: string[]
 *   - notSuitableFor: string[]
 *   - bất kỳ field nào owner cần (duration, sweetness, intensity, ...)
 */
export type ProductAttributes = Record<string, unknown>;

@Entity("products_services")
export class ProductServiceEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text", nullable: true })
  businessId: string | null;
  
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

  @Column({ type: "simple-json", nullable: true })
  attributes: ProductAttributes | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}