import { coffeeKnowledge } from './coffee.knowledge';

type Overrides = {
  openingHours?: string;
  phone?: string;
  address?: string;
  wifiName?: string;
  wifiPassword?: string;
  parking?: string;
};

const overrides: Overrides = {};

export function setOpeningHours(value: string): void {
  overrides.openingHours = value;
}

export function setPhone(value: string): void {
  overrides.phone = value;
}

export function setAddress(value: string): void {
  overrides.address = value;
}

export function setWifiName(value: string): void {
  overrides.wifiName = value;
}

export function setWifiPassword(value: string): void {
  overrides.wifiPassword = value;
}

export function setParking(value: string): void {
  overrides.parking = value;
}

export function getEffectiveOpeningHours(): string {
  return overrides.openingHours ?? coffeeKnowledge.openingHours;
}

export function getEffectivePhone(): string {
  return overrides.phone ?? coffeeKnowledge.phone;
}

export function getEffectiveAddress(): string {
  return overrides.address ?? coffeeKnowledge.address;
}

export function getEffectiveWifiName(): string {
  return overrides.wifiName ?? coffeeKnowledge.wifi.name;
}

export function getEffectiveWifiPassword(): string {
  return overrides.wifiPassword ?? coffeeKnowledge.wifi.password;
}

export function getEffectiveParking(): string {
  return overrides.parking ?? coffeeKnowledge.parking;
}

export const KNOWLEDGE_OVERRIDE_COMMANDS: {
  regex: RegExp;
  label: string;
  apply: (value: string) => void;
}[] = [
  {
    regex: /^đổi giờ mở cửa thành (.+)$/i,
    label: "giờ mở cửa",
    apply: setOpeningHours,
  },
  {
    regex: /^đổi số điện thoại thành (.+)$/i,
    label: "số điện thoại",
    apply: setPhone,
  },
  {
    regex: /^đổi địa chỉ thành (.+)$/i,
    label: "địa chỉ",
    apply: setAddress,
  },
  {
    regex: /^đổi tên wifi thành (.+)$/i,
    label: "tên wifi",
    apply: setWifiName,
  },
  {
    regex: /^đổi mật khẩu wifi thành (.+)$/i,
    label: "mật khẩu wifi",
    apply: setWifiPassword,
  },
  {
    regex: /^đổi gửi xe thành (.+)$/i,
    label: "gửi xe",
    apply: setParking,
  },
];