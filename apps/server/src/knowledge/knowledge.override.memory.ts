type Overrides = {
  businessName?: string;
  openingHours?: string;
  phone?: string;
  address?: string;
  wifiName?: string;
  wifiPassword?: string;
  parking?: string;
};

const overrides: Overrides = {};

export function setBusinessName(value: string): void {
  overrides.businessName = value;
}

export function getEffectiveBusinessName(): string | null {
  return overrides.businessName ?? null;
}

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


export function getEffectiveOpeningHours(): string | null {
  return overrides.openingHours ?? null;
}

export function getEffectivePhone(): string | null {
  return overrides.phone ?? null;
}

export function getEffectiveAddress(): string | null {
  return overrides.address ?? null;
}

export function getEffectiveWifiName(): string | null {
  return overrides.wifiName ?? null;
}

export function getEffectiveWifiPassword(): string | null {
  return overrides.wifiPassword ?? null;
}

export function getEffectiveParking(): string | null {
  return overrides.parking ?? null;
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