const YES_REGEX = /^(có|ok|oke|đồng ý|xác nhận|ừ|yes|ừm|uhm)$/i;

export function isYes(message: string): boolean {
  return YES_REGEX.test(message.trim());
}

const NO_REGEX = /^(không|thôi|no|ko)$/i;
const NO_OR_CANCEL_REGEX = /^(không|thôi|huỷ|hủy|no|ko)$/i;

export function isNo(message: string): boolean {
  return NO_REGEX.test(message.trim());
}

export function isNoOrCancel(message: string): boolean {
  return NO_OR_CANCEL_REGEX.test(message.trim());
}