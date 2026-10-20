import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("conversation_logs")
export class ConversationLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "text" })
  businessId: string;

  @Column({ type: "text" })
  conversationId: string;

  @Column({ type: "text" })
  customerId: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "text" })
  reply: string;

  @CreateDateColumn()
  createdAt: Date;
}