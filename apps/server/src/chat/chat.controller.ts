import { Body, Controller, Post, Headers } from "@nestjs/common";
import { getCart } from "../memory/cart.memory";
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
import { logTurn } from "../memory/conversation.log.memory";
import { getCustomer } from "../memory/customer.memory";
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
@Controller("chat")
export class ChatController {
  constructor(
    private readonly businessKnowledge: BusinessKnowledgeService,
    private readonly productService: ProductServiceService,
    private readonly promotionService: PromotionService,
    private readonly faqService: FaqService,
    private readonly policyService: PolicyService,
    private readonly businessService: BusinessService,
    private readonly userService: UserService,
  ) {}

  @Post()
  async chat(
    @Body()
    body: { message: string; conversationId: string; customerId: string },
    @Headers("x-business-id") businessIdHeader?: string,
    @Headers("authorization") authHeader?: string,
  ) {
    const result = await this.chatInternal(body, businessIdHeader, authHeader);
    logTurn(body.conversationId, body.customerId, body.message, result.reply);
    return result;
  }

  private async chatInternal(
    body: { message: string; conversationId: string; customerId: string },
    businessIdHeader?: string,
    authHeader?: string,
  ): Promise<SkillResult> {
    const message = body.message.toLowerCase().trim();
    const customerId = body.customerId;
    const conversationId = body.conversationId;

    // ===== 1. Resolve active business =====
    let activeBusiness: BusinessEntity | null = null;

    if (businessIdHeader) {
      const candidate = await this.businessService.findOne(businessIdHeader);
      if (candidate) activeBusiness = candidate;
    }

    if (!activeBusiness) {
      activeBusiness = await this.businessService.getDefaultBusiness();
    }

    const businessId = activeBusiness?.id ?? "";

    // ===== Optional Clerk verification =====
    let authenticatedUserId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      try {
        const payload = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY!,
        });
        authenticatedUserId = payload.sub;
      } catch {
        // Invalid/expired token → treat as guest
      }
    }

    // ===== Determine role =====
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
    // ===== 2. Load business knowledge =====
    const [
      profile,
      businessNameRes,
      aiConfig,
      addressRes,
      phoneRes,
      hoursRes,
      wifiNameRes,
      wifiPassRes,
    ] = businessId
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
    // ===== 3. Load products / promotions / faqs / policies =====
    const productsRaw = activeBusiness
      ? await this.productService.findAllActive(activeBusiness.id)
      : [];

    const products: ProductServiceItem[] = productsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      status: p.status,
      attributes: p.attributes ?? null,
    }));

    const promotionsRaw = activeBusiness
      ? await this.promotionService.findAllActive(activeBusiness.id)
      : [];

    const promotions: PromotionItem[] = promotionsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      keywords: p.keywords,
      condition: p.condition,
      discount: p.discount,
      scope: p.scope,
      productIds: p.productIds,
      status: p.status,
    }));

    const faqsRaw = activeBusiness
      ? await this.faqService.findAllActive(activeBusiness.id)
      : [];

    const faqs: FaqItem[] = faqsRaw.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      status: f.status,
    }));

    const policiesRaw = activeBusiness
      ? await this.policyService.findAllActive(activeBusiness.id)
      : [];

    const policies: PolicyItem[] = policiesRaw.map((p) => ({
      id: p.id,
      title: p.title,
      content: p.content,
      status: p.status,
    }));

    // ===== 4. Build BusinessContext =====
    const businessCtx: BusinessContext = {
      id: activeBusiness?.id ?? "default",
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
    // ===== 5. Build SkillContext =====
    const ctx: SkillContext = {
      message,
      customerId,
      conversationId,
      customer: getCustomer(customerId),
     cart: getCart(activeBusiness?.id ?? "default", customerId),
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
      automation.tryViewAutomationLogs,
      ownerOps.tryViewAllOrders,
      knowledgeAdmin.tryViewKnowledge,
      knowledgeAdmin.tryViewPromotions,
      knowledgeAdmin.tryViewRefundPolicy,
      ownerOps.tryViewLogs,
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
      customerService.trySetName,
      customerService.tryRecallName,
      customerService.tryShortContext,
    ];

    const beforeResult = runHandlers(beforeAddMessage, ctx);
    if (beforeResult) return enrich(beforeResult, ctx);

    addMessage(conversationId, message);

    // ===== 7. Brain integration =====
    const brainInput = buildBrainInput(ctx);
    const brainOutput = await brain.interpret(brainInput);

    if (brainOutput.confidence > 0) {
      const handler = INTENT_HANDLER_MAP[brainOutput.intent];
      if (handler) {
        const brainResult = handler(ctx, brainOutput.entities);
        if (brainResult) return enrich(brainResult, ctx);
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
    if (afterResult) return enrich(afterResult, ctx);

    return enrich(customerService.tryFallback(ctx), ctx);
  }
}
