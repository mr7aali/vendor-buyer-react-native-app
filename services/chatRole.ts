const normalizeId = (value: any): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
};

const collectIds = (...values: any[]) =>
  Array.from(new Set(values.map(normalizeId).filter(Boolean)));

const collectEntityIds = (entity: any) =>
  collectIds(
    entity?.id,
    entity?._id,
    entity?.userId,
    entity?.user?.id,
    entity?.user?._id,
    entity?.user?.userId,
  );

const hasOverlap = (left: string[], right: string[]) =>
  left.some((value) => right.includes(value));

export const resolveCurrentRole = (
  user: any,
  storedRole?: string | null,
): "vendor" | "buyer" => {
  const normalizedUserType = String(user?.userType || "").toLowerCase();
  const normalizedStoredRole = String(storedRole || "").toLowerCase();

  if (normalizedUserType === "vendor" || normalizedUserType === "buyer") {
    return normalizedUserType;
  }

  return normalizedStoredRole === "vendor" ? "vendor" : "buyer";
};

export const resolveConversationRole = (
  conversation: any,
  user: any,
): "vendor" | "buyer" | null => {
  const vendorConversationIds = collectIds(
    conversation?.vendorId,
    conversation?.vendorId?.id,
    conversation?.vendorId?._id,
    conversation?.vendorId?.userId,
    conversation?.vendor?.id,
    conversation?.vendor?._id,
    conversation?.vendor?.userId,
    conversation?.partner?.vendor?.id,
    conversation?.partner?.vendor?._id,
    conversation?.partner?.vendor?.userId,
  );

  const buyerConversationIds = collectIds(
    conversation?.buyerId,
    conversation?.buyerId?.id,
    conversation?.buyerId?._id,
    conversation?.buyerId?.userId,
    conversation?.buyer?.id,
    conversation?.buyer?._id,
    conversation?.buyer?.userId,
    conversation?.partner?.buyer?.id,
    conversation?.partner?.buyer?._id,
    conversation?.partner?.buyer?.userId,
  );

  const currentVendorIds = collectIds(
    user?.vendor?.id,
    user?.vendor?._id,
    user?.vendor?.userId,
    user?.userId,
    user?.id,
    user?._id,
  );

  const currentBuyerIds = collectIds(
    user?.buyer?.id,
    user?.buyer?._id,
    user?.buyer?.userId,
    user?.userId,
    user?.id,
    user?._id,
  );

  if (hasOverlap(vendorConversationIds, currentVendorIds)) {
    return "vendor";
  }

  if (hasOverlap(buyerConversationIds, currentBuyerIds)) {
    return "buyer";
  }

  const partnerVendorIds = collectEntityIds(conversation?.partner?.vendor);
  const partnerBuyerIds = collectEntityIds(conversation?.partner?.buyer);

  if (partnerVendorIds.length && !partnerBuyerIds.length) {
    return "buyer";
  }

  if (partnerBuyerIds.length && !partnerVendorIds.length) {
    return "vendor";
  }

  return null;
};

export const formatRoleLabel = (role: "vendor" | "buyer" | null) => {
  if (role === "vendor") return "Vendor";
  if (role === "buyer") return "Buyer";
  return "Unknown";
};
