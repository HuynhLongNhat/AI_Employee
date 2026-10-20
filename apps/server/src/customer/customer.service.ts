import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CustomerEntity } from "./customer.entity";

@Injectable()
export class CustomerService {
  constructor(
    @InjectRepository(CustomerEntity)
    private readonly repo: Repository<CustomerEntity>,
  ) {}

  async getOrCreate(
    businessId: string,
    customerId: string,
    defaultName?: string | null,
  ): Promise<CustomerEntity> {
    let customer = await this.repo.findOne({
      where: { businessId, customerId },
    });

    if (!customer) {
      customer = await this.repo.save({
        businessId,
        customerId,
        name: defaultName || null, // <-- Gán tên Clerk khi tạo mới
        tier: "bronze",
        points: 0,
      });
    } else if (!customer.name && defaultName) {
      // Nếu đã có record nhưng name đang null, và có tên Clerk -> Cập nhật
      customer.name = defaultName;
      await this.repo.save(customer);
    }

    return customer;
  }

  async save(customer: CustomerEntity): Promise<void> {
    await this.repo.save(customer);
  }

  async getAll(businessId: string): Promise<CustomerEntity[]> {
    return this.repo.find({ where: { businessId } });
  }
}
