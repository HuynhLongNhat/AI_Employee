import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UserEntity } from "./user.entity";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findByClerkId(clerkUserId: string): Promise<UserEntity | null> {
    return this.repo.findOne({ where: { clerkUserId } });
  }

  async getOrCreate(
    clerkUserId: string,
    email: string | null,
  ): Promise<UserEntity> {
    let user = await this.findByClerkId(clerkUserId);
    if (user) return user;

    user = await this.repo.save({ clerkUserId, email });
    return user;
  }
}