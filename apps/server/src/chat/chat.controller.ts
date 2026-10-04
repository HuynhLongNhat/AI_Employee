import { Body, Controller, Post } from "@nestjs/common";
import { getCart } from "../memory/cart.memory";
import { getEffectiveMenu } from "../knowledge/menu.override.memory";
import {
  runHandlers,
  SkillContext,
  SkillHandler,
  SkillResult,
  PolicyBundle,
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
import {
  setOpeningHours,
  setBusinessName,
  setAddress,
  setPhone,
  setWifiName,
  setWifiPassword,
  setParking,
} from "../knowledge/knowledge.override.memory";
import { BusinessKnowledgeService } from "../knowledge/business-knowledge.service";
const INTENT_HANDLER_MAP: Record<string, SkillHandler> = INTENT_HANDLERS;
import { ProductServiceService } from "../product/product-service.service";
import type {
  AiConfig,
  FaqItem,
  ProductServiceItem,
  PromotionItem,
} from "../skills/types";
import { PromotionService } from "../promotion/promotion.service";
import { FaqService } from "../faq/faq.service";

@Controller("chat")
export class ChatController {
  constructor(
    private readonly businessKnowledge: BusinessKnowledgeService,
    private readonly productService: ProductServiceService,
    private readonly promotionService: PromotionService,
    private readonly faqService: FaqService,
  ) {}

  @Post()
  async chat(
    @Body()
    body: {
      message: string;
      conversationId: string;
      customerId: string;
    },
  ) {
    const result = await this.chatInternal(body);
    logTurn(body.conversationId, body.customerId, body.message, result.reply);
    return result;
  }

  private async chatInternal(body: {
    message: string;
    conversationId: string;
    customerId: string;
  }): Promise<SkillResult> {
    const message = body.message.toLowerCase().trim();
    const customerId = body.customerId;
    const conversationId = body.conversationId;
    const dbOpeningHours = await this.businessKnowledge.getOpeningHours();
    if (dbOpeningHours !== null) {
      setOpeningHours(dbOpeningHours);
    }

    const dbBusinessName = await this.businessKnowledge.getBusinessName();
    if (dbBusinessName !== null) {
      setBusinessName(dbBusinessName);
    }

    const dbAddress = await this.businessKnowledge.getAddress();
    if (dbAddress !== null) setAddress(dbAddress);

    const dbPhone = await this.businessKnowledge.getPhone();
    if (dbPhone !== null) setPhone(dbPhone);

    const dbWifiName = await this.businessKnowledge.getWifiName();
    if (dbWifiName !== null) setWifiName(dbWifiName);

    const dbWifiPassword = await this.businessKnowledge.getWifiPassword();
    if (dbWifiPassword !== null) setWifiPassword(dbWifiPassword);

    const dbParking = await this.businessKnowledge.getParking();
    if (dbParking !== null) setParking(dbParking);

    const productsRaw = await this.productService.findAllActive();
    const products: ProductServiceItem[] = productsRaw.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      category: p.category,
      status: p.status,
    }));

    const promotionsRaw = await this.promotionService.findAllActive();
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

    const policies: PolicyBundle = await this.businessKnowledge.getPolicies();

    const faqsRaw = await this.faqService.findAllActive();
    const faqs: FaqItem[] = faqsRaw.map((f) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      status: f.status,
    }));

    const aiConfig: AiConfig = await this.businessKnowledge.getAiConfig();

    const ctx: SkillContext = {
      message,
      customerId,
      conversationId,
      customer: getCustomer(customerId),
      cart: getCart(customerId),
      menu: getEffectiveMenu(),
      products,
      promotions,
      policies,
      faqs,
      aiConfig,
    };

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
      ownerOps.trySetTier,
      ownerOps.trySetPoints,
      ownerOps.tryRoleCommand,
      ownerOps.tryViewAllOrders,
      knowledgeAdmin.tryKnowledgeOverrideCommand,
      knowledgeAdmin.tryViewKnowledge,
      knowledgeAdmin.trySetPrice,
      knowledgeAdmin.tryViewMenu,
      knowledgeAdmin.tryViewPromotions,
      knowledgeAdmin.tryViewRefundPolicy,
      ownerOps.tryViewLogs,
      customerCare.tryTierQuery,
      customerCare.tryHistory,
      customerCare.tryRegular,
      customerCare.tryComplaintIntent,
      customerService.tryRefundPolicyQuery,
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
    if (beforeResult) return beforeResult;

    addMessage(conversationId, message);

    // ===== Brain integration =====
    const brainInput = buildBrainInput(ctx);
    const brainOutput = await brain.interpret(brainInput);

    if (brainOutput.confidence > 0) {
      const handler = INTENT_HANDLER_MAP[brainOutput.intent];
      if (handler) {
        const brainResult = handler(ctx, brainOutput.entities);
        if (brainResult) return brainResult;
      }
    }

    const afterAddMessage: SkillHandler[] = [
      customerService.tryGreeting,
      customerService.tryMenuView,
      customerService.tryBusinessName,
      customerService.tryAddress,
      customerService.tryOpeningHours,
      customerService.tryWifi,
      customerService.tryParking,
      customerService.tryPhone,
      customerService.tryPriceQuestion,
      customerService.tryDetailQuestion,
      customerService.tryRecommendation,
      customerService.tryCompare,
      customerService.tryUnclear,
      customerService.tryFaq,
    ];

    const afterResult = runHandlers(afterAddMessage, ctx);
    if (afterResult) return afterResult;

    return customerService.tryFallback(ctx);
  }
}
