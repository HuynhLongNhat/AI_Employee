import { isOwner } from "../common/access";
import { formatDateTime } from "../common/format";
import { OWNER_ONLY_REPLY } from "../common/messages";
import { logAutomation, getRecentAutomationLogs } from "../automation/automation.log.memory";
import { runRemindVipAutomation } from "../automation/remind-vip.automation";
import type { SkillContext, SkillResult } from "./types";

export function tryRunAutomation(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("chạy automation nhắc vip") && !m.includes("chạy automation remind vip")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const result = runRemindVipAutomation();
  logAutomation("nhắc VIP", ctx.customerId, result);

  return { reply: `Dạ, em đã chạy automation 'nhắc VIP' ạ.\n\nKết quả: ${result}` };
}

export function tryViewAutomationLogs(ctx: SkillContext): SkillResult | null {
  const m = ctx.message;

  if (!m.includes("xem log automation") && !m.includes("log automation") && !m.includes("lịch sử automation")) {
    return null;
  }

  if (!isOwner(ctx.customerId)) return { reply: OWNER_ONLY_REPLY };

  const logs = getRecentAutomationLogs(10);

  if (logs.length === 0) {
    return { reply: "Dạ, hiện tại chưa có log automation nào ạ." };
  }

  const lines = logs.map((log, i) => {
    const time = formatDateTime(log.createdAt);
    return `${i + 1}. [${time}] ${log.name} — bởi ${log.triggeredBy}\n   Kết quả: ${log.result}`;
  });

  return { reply: `Dạ, ${logs.length} lần chạy automation gần nhất:\n\n${lines.join("\n\n")}` };
}