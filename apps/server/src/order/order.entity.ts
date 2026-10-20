import { Column, Entity, PrimaryColumn } from "typeorm";

export type OrderItem = {
  name: string;
  quantity: number;
  note?: string;
};

// Định nghĩa các kiểu dữ liệu chuẩn (Union Types)
export type OrderStatus = "pending" | "confirmed" | "cancelled";
export type OrderFulfillment = "dine-in" | "delivery";
export type OrderPaymentMethod = "cash" | "bank-transfer";

@Entity("orders")
export class OrderEntity {
  @PrimaryColumn({ type: "text" })
  id: string;

  @Column({ type: "text" })
  businessId: string;

  @Column({ type: "text" })
  customerId: string;

  @Column({ type: "simple-json" })
  items: OrderItem[];

  @Column({ type: "integer" })
  total: number;

  // SỬA Ở ĐÂY: Dùng OrderStatus thay vì string
  @Column({ type: "text" })
  status: OrderStatus; 

  @Column({ type: "text" })
  createdAt: string;

  // SỬA Ở ĐÂY: Dùng OrderFulfillment thay vì string
  @Column({ type: "text", nullable: true })
  fulfillment: OrderFulfillment | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  // SỬA Ở ĐÂY: Dùng OrderPaymentMethod thay vì string
  @Column({ type: "text", nullable: true })
  paymentMethod: OrderPaymentMethod | null;
}