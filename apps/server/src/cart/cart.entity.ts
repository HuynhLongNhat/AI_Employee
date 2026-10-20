import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("carts")
export class CartEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  businessId: string;

  @Column({ type: "text" })
  customerId: string;

  // Lưu toàn bộ items và pending state dưới dạng JSON
  @Column({ type: "simple-json" })
  data: any; 

  @UpdateDateColumn()
  updatedAt: Date;
}