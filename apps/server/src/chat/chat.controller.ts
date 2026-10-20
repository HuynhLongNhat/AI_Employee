import {
  Body,
  Controller,
  Post,
  Headers,
  Get,
  Query,
  NotFoundException,
  UseGuards,
  Req,
} from "@nestjs/common";
import {
  runHandlers,
  SkillContext,
  SkillHandler,
  SkillResult,
} from "../skills/types";
import * as customerService from "../skills/customer-service.skill";
import * as cartOrder from "../skills/cart-order.skill";
import * as customerCare from "../skills/customer-care.skill";
import * as ownerOps from "../skills/owner-operations.skill";
import * as knowledgeAdmin from "../skills/knowledge-admin.skill";
import * as automation from "../skills/automation.skill";
import { addMessage } from "../memory/chat.memory";
import { brain } from "../brain/brain.instance";
import { buildBrainInput } from "../brain/brain-input.builder";
import { INTENT_HANDLERS } from "../brain/intent-handlers";
import { BusinessKnowledgeService } from "../knowledge/business-knowledge.service";
const INTENT_HANDLER_MAP: Record<string, SkillHandler> = INTENT_HANDLERS;
import { ProductServiceService } from "../product/product-service.service";
import type {
  BusinessContext,
  FaqItem,
  PolicyItem,
  ProductServiceItem,
  PromotionItem,
} from "../skills/types";
import { PromotionService } from "../promotion/promotion.service";
import { FaqService } from "../faq/faq.service";
import { PolicyService } from "../policy/policy.service";
import { BusinessService } from "../business/business.service";
import { BusinessEntity } from "../business/business.entity";
import { enrich } from "./response-enricher";
import { verifyToken } from "@clerk/backend";
import { UserService } from "../auth/user.service";
import { setRole } from "../memory/role.memory";
import { CartService } from "../cart/cart.service";
import { ConversationLogService } from "./conversation-log.service";
import { OrderService } from "../order/order.service";
import { CustomerService } from "../customer/customer.service";
import { ChatAuthGuard } from "../auth/chat-auth.guard";

@Controller("chat")
@UseGuards(ChatAuthGuard)
export class ChatController {
  constructor(
    private readonly businessKnowledge: BusinessKnowledgeService,
    private readonly productService: ProductServiceService,
    private readonly promotionService: PromotionService,
    private readonly faqService: FaqService,
    private readonly policyService: PolicyService,
    private readonly businessService: BusinessService,
    private readonly userService: UserService,
    private readonly cartService: CartService,
    private readonly conversationLogService: ConversationLogService,
    private readonly orderService: OrderService,
    private readonly customerService: CustomerService,
  ) {}

  @Post()
  async chat(
    @Body()
    body: {
      message: string;
      conversationId: string;
      userName?: string;
    },
    @Req() req: any,
    @Headers("x-business-id") businessIdHeader?: string,
    @Headers("authorization") authHeader?: string,
  ) {
    // Gọi chatInternal và nhận kết quả (đã bao gồm việc save cart và log)
    return this.chatInternal(body, req.user, businessIdHeader, authHeader);
  }

  private async chatInternal(
    body: {
      message: string;
      conversationId: string;
      userName?: string;
    },
    reqUser: { customerId: string; role: string },
    businessIdHeader?: string,
    authHeader?: string,
  ): Promise<SkillResult> {
    const message = body.message.toLowerCase().trim();
    const customerId = reqUser.customerId;
    const conversationId = body.conversationId;

    // ===== 1. Resolve active business =====
    let activeBusiness: BusinessEntity | null = null;

    if (businessIdHeader) {
      const candidate = await this.businessService.findOne(businessIdHeader);
      if (candidate) activeBusiness = candidate;
    }

    if (!activeBusiness) {
      throw new NotFoundException(
        "Business không tồn tại hoặc đường dẫn không hợp lệ.",
      );
    }

    const businessId = activeBusiness.id;

    // ===== 2. Verify Clerk & Determine role =====
    let authenticatedUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        authenticatedUserId = payload.sub;
      } catch {}
    }

    let role: "customer" | "staff" | "owner" = "customer";

    if (authenticatedUserId) {
      const internalUser = await this.userService.getOrCreate(
        authenticatedUserId,
        null,
      );
      if (activeBusiness && activeBusiness.ownerUserId === internalUser.id) {
        role = "owner";
      }
    }

    setRole(customerId, role);
    const isAuthenticated = authenticatedUserId !== null;

    // ===== 3. Load business knowledge =====
    const [
      profile,
      businessNameRes,
      aiConfig,
      addressRes,
      phoneRes,
      hoursRes,
      wifiNameRes,
      wifiPassRes,
    ] = activeBusiness
      ? await Promise.all([
          this.businessKnowledge.getBusinessProfile(businessId),
          this.businessKnowledge.getBusinessName(businessId),
          this.businessKnowledge.getAiConfig(businessId),
          this.businessKnowledge.getAddress(businessId),
          this.businessKnowledge.getPhone(businessId),
          this.businessKnowledge.getOpeningHours(businessId),
          this.businessKnowledge.getWifiName(businessId),
          this.businessKnowledge.getWifiPassword(businessId),
        ])
      : [
          {
            industry: null,
            terminology: {
              businessTerm: null,
              customerTerm: null,
              productTerm: null,
            },
          },
          null,
          null,
          null,
          null,
          null,
          null,
          null,
        ];

    // ===== 4. Load products / promotions / faqs / policies =====
    const productsRaw = activeBusiness
      ? await this.productService.findAllActive(activeBusiness.id)
      : [];
    const products: ProductServiceItem[] = productsRaw.map((p) => ({
      ...p,
      attributes: p.attributes ?? null,
    }));

    const promotionsRaw = activeBusiness
      ? await this.promotionService.findAllActive(activeBusiness.id)
      : [];
    const promotions: PromotionItem[] = promotionsRaw.map((p) => ({ ...p }));

    const faqsRaw = activeBusiness
      ? await this.faqService.findAllActive(activeBusiness.id)
      : [];
    const faqs: FaqItem[] = faqsRaw.map((f) => ({ ...f }));

    const policiesRaw = activeBusiness
      ? await this.policyService.findAllActive(activeBusiness.id)
      : [];
    const policies: PolicyItem[] = policiesRaw.map((p) => ({ ...p }));

    // ===== 5. Build Contexts =====
    const businessCtx: BusinessContext = {
      id: businessId,
      name: activeBusiness?.name ?? businessNameRes ?? "",
      industry: activeBusiness?.industry || (profile.industry ?? ""),
      terminology: {
        businessTerm: profile.terminology.businessTerm ?? "",
        customerTerm: profile.terminology.customerTerm ?? "",
        productTerm: profile.terminology.productTerm ?? "",
      },
      address: addressRes ?? "",
      phone: phoneRes ?? "",
      openingHours: hoursRes ?? "",
      wifiName: wifiNameRes ?? "",
      wifiPassword: wifiPassRes ?? "",
    };

    // LẤY GIỎ HÀNG TỪ DB
    const cartData = await this.cartService.getCart(businessId, customerId);
    const recentLogs =
      role === "owner"
        ? await this.conversationLogService.getRecentLogs(businessId, 20)
        : [];
    const customerOrders = await this.orderService.getCustomerOrders(
      businessId,
      customerId,
    );
    const latestOrder = customerOrders.length > 0 ? customerOrders[0] : null;
    const allOrders =
      role === "owner" ? await this.orderService.getAllOrders(businessId) : [];

    const allCustomers =
      role === "owner" ? await this.customerService.getAll(businessId) : [];

    const customerEntity = await this.customerService.getOrCreate(
      businessId,
      customerId,
      body.userName,
    );
    const ctx: SkillContext = {
      message,
      customerId,
      conversationId,
      customer: customerEntity,
      cart: cartData,
      products,
      promotions,
      policies,
      faqs,
      aiConfig: aiConfig ?? {
        name: null,
        role: null,
        style: null,
        permissions: null,
      },
      role,
      isAuthenticated,
      business: businessCtx,
      recentLogs,
      latestOrder,
      customerOrders,
      allOrders,
      allCustomers,
    };

    // ===== HELPER: Bọc kết quả để lưu Cart và Log (Tư duy Unit of Work) =====
    const finalize = async (res: SkillResult) => {
      console.log("=== DEBUG CHAT ===");
      console.log("Customer ID:", customerId);
      console.log("Message:", message);
      console.log("Saved Name in DB:", ctx.customer.name);
      const enrichedResult = enrich(res, ctx);

      await this.cartService.saveCart(businessId, customerId, ctx.cart);
      await this.orderService.saveMany(ctx.customerOrders);
      await this.customerService.save(ctx.customer);
      // Đổi sang gọi DB thay vì gọi hàm memory cũ
      await this.conversationLogService.logTurn(
        businessId,
        conversationId,
        customerId,
        message,
        enrichedResult.reply,
      );

      return enrichedResult;
    };

    // ===== 6. Dispatch beforeAddMessage =====
    const beforeAddMessage: SkillHandler[] = [
      cartOrder.tryAwaitingConfirm,
      cartOrder.tryPendingFulfillment,
      cartOrder.tryOrderStatus,
      cartOrder.tryCancelIntent,
      cartOrder.tryPendingEditAddress,
      customerCare.tryPendingComplaint,
      customerCare.tryPendingRefund,
      customerCare.tryRefundIntent,
      customerCare.tryPendingReservation,
      ownerOps.tryOrderFilter,
      ownerOps.tryCustomerList,
      ownerOps.tryCustomerDetail,
      ownerOps.tryRevenue,
      ownerOps.tryBestSeller,
      ownerOps.tryTopCustomers,
      ownerOps.tryClassification,
      ownerOps.tryTierDistribution,
      ownerOps.tryOrderDistribution,
      ownerOps.tryAov,
      ownerOps.tryCareSuggestions,
      ownerOps.tryTierUpgrade,
      automation.tryRunAutomation,
      ownerOps.tryViewAllOrders,
      knowledgeAdmin.tryViewKnowledge,
      knowledgeAdmin.tryViewPromotions,
      knowledgeAdmin.tryViewRefundPolicy,
      customerCare.tryTierQuery,
      customerCare.tryHistory,
      customerCare.tryRegular,
      customerCare.tryComplaintIntent,
      customerCare.tryHandoffIntent,
      customerCare.tryHandoffBlock,
      cartOrder.tryEditAddressIntent,
      cartOrder.tryPendingCancel,
      customerCare.tryReservationIntent,
      cartOrder.tryPendingPayment,
      cartOrder.tryOrderIntent,
      cartOrder.tryViewCart,
      cartOrder.tryClearCart,
      customerService.tryProductPrice,
      cartOrder.tryCalculateTotal,
      cartOrder.tryRemoveMatch,
      cartOrder.tryEditTarget,
      cartOrder.tryQuantityMatch,
      customerService.tryPromotions,
      customerService.tryRecallName,
      customerService.trySetName,
      customerService.tryShortContext,
    ];

    const beforeResult = runHandlers(beforeAddMessage, ctx);
    if (beforeResult) return finalize(beforeResult);

    addMessage(conversationId, message);

    // ===== 7. Brain integration =====
    const brainInput = buildBrainInput(ctx);
    const brainOutput = await brain.interpret(brainInput);

    if (brainOutput.confidence > 0) {
      const handler = INTENT_HANDLER_MAP[brainOutput.intent];
      if (handler) {
        const brainResult = handler(ctx, brainOutput.entities);
        if (brainResult) return finalize(brainResult);
      }
    }

    // ===== 8. Dispatch afterAddMessage =====
    const afterAddMessage: SkillHandler[] = [
      customerService.tryGreeting,
      customerService.tryMenuView,
      customerService.tryBusinessName,
      customerService.tryAddress,
      customerService.tryOpeningHours,
      customerService.tryWifi,
      customerService.tryPhone,
      customerService.tryPriceQuestion,
      customerService.tryDetailQuestion,
      customerService.tryRecommendation,
      customerService.tryCompare,
      customerService.tryUnclear,
      customerService.tryFaq,
    ];

    const afterResult = runHandlers(afterAddMessage, ctx);
    if (afterResult) return finalize(afterResult);

    return finalize(customerService.tryFallback(ctx));
  }

  @Get("conversations")
  async getConversations(
    @Req() req: any,
    @Query("businessId") businessIdHeader: string, // <-- Đổi sang Query
  ) {
    const customerId = req.user.customerId;
    if (!customerId) return [];
    const activeBusiness = await this.businessService.findOne(businessIdHeader);
    if (!activeBusiness) throw new NotFoundException("Business not found");
    return this.conversationLogService.getCustomerConversations(
      activeBusiness.id,
      customerId,
    );
  }

  @Get("history")
  async getHistory(
    @Req() req: any,
    @Query("businessId") businessIdHeader: string,
    @Query("conversationId") conversationId: string,
  ) {
    const customerId = req.user.customerId;
    if (!conversationId || !customerId) return []; // Trả về rỗng thay vì lỗi

    const activeBusiness = await this.businessService.findOne(businessIdHeader);

    if (!activeBusiness) throw new NotFoundException("Business not found");
    const logs = await this.conversationLogService.getConversationHistory(
      activeBusiness.id,
      conversationId,
      customerId,
    );

    return logs; // Nếu không có log, nó tự trả về mảng rỗng []
  }
}
