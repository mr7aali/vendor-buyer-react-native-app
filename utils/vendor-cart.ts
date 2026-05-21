const PLACEHOLDER_IMAGE = "https://via.placeholder.com/150";

const toNumber = (value: any, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const isRecord = (value: any): value is Record<string, any> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const getVendorRecord = (item: any): Record<string, any> | null => {
  const candidates = [
    item?.product?.vendor,
    item?.productId?.vendor,
    item?.vendor,
    item?.vendorId,
    item?.product?.vendorId,
    item?.productId?.vendorId,
  ];

  return candidates.find((candidate) => isRecord(candidate)) || null;
};

export const normalizeEntityId = (value: any): string => {
  if (value === undefined || value === null) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  return "";
};

export const resolveVendorId = (item: any): string =>
  normalizeEntityId(
    getVendorRecord(item)?.id ||
      getVendorRecord(item)?._id ||
      item?.vendorId ||
      item?.product?.vendorId ||
      item?.productId?.vendorId ||
      getVendorRecord(item)?.userId,
  );

export const resolveVendorName = (
  item: any,
  fallback = "Vendor",
): string => {
  const vendor = getVendorRecord(item);
  const rawName =
    vendor?.storename ||
    vendor?.businessName ||
    vendor?.fullName ||
    item?.storename;

  return String(rawName || "").trim() || fallback;
};

export const resolveVendorLogo = (item: any): string =>
  String(
    getVendorRecord(item)?.logoUrl || "",
  ).trim();

export const resolveVendorBusinessName = (item: any): string =>
  String(getVendorRecord(item)?.businessName || "").trim();

export const resolveVendorStoreName = (item: any): string =>
  String(getVendorRecord(item)?.storename || "").trim();

export const resolveVendorContactName = (item: any): string =>
  String(getVendorRecord(item)?.fullName || "").trim();

export const resolveVendorCode = (item: any): string =>
  String(getVendorRecord(item)?.vendorCode || "").trim();

export const resolveVendorCountry = (item: any): string =>
  String(getVendorRecord(item)?.country || "").trim();

export const resolveVendorAddress = (item: any): string =>
  String(getVendorRecord(item)?.address || "").trim();

export const resolveCartItemName = (
  item: any,
  fallback = "Unknown Product",
): string =>
  String(
    item?.product?.name ||
      item?.product?.title ||
      item?.productId?.title ||
      item?.productId?.name ||
      item?.title ||
      item?.name ||
      fallback,
  ).trim();

export const resolveCartItemImage = (item: any): string =>
  String(
    item?.product?.images?.[0] ||
      item?.product?.imageUrl ||
      item?.productId?.images?.[0] ||
      item?.productId?.image ||
      item?.image ||
      PLACEHOLDER_IMAGE,
  ).trim() || PLACEHOLDER_IMAGE;

export type VendorCartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  vendorStoreName: string;
  vendorBusinessName: string;
  vendorContactName: string;
  vendorCode: string;
  vendorCountry: string;
  vendorAddress: string;
  rawItem: any;
};

export type VendorCartGroup = {
  vendorId: string;
  vendorName: string;
  vendorLogo: string;
  vendorStoreName: string;
  vendorBusinessName: string;
  vendorContactName: string;
  vendorCode: string;
  vendorCountry: string;
  vendorAddress: string;
  itemCount: number;
  subtotal: number;
  items: VendorCartItem[];
};

export const mapCartItem = (
  item: any,
  fallbackVendorName = "Vendor",
  fallbackProductName = "Unknown Product",
): VendorCartItem => ({
  id: normalizeEntityId(item?.id || item?._id),
  name: resolveCartItemName(item, fallbackProductName),
  price: toNumber(
    item?.product?.price || item?.productId?.price || item?.price || 0,
  ),
  quantity: toNumber(item?.quantity, 1),
  image: resolveCartItemImage(item),
  vendorId: resolveVendorId(item),
  vendorName: resolveVendorName(item, fallbackVendorName),
  vendorLogo: resolveVendorLogo(item),
  vendorStoreName: resolveVendorStoreName(item),
  vendorBusinessName: resolveVendorBusinessName(item),
  vendorContactName: resolveVendorContactName(item),
  vendorCode: resolveVendorCode(item),
  vendorCountry: resolveVendorCountry(item),
  vendorAddress: resolveVendorAddress(item),
  rawItem: item,
});

export const groupCartItemsByVendor = (
  rawItems: any[],
  options?: {
    fallbackVendorName?: string;
    fallbackProductName?: string;
  },
): VendorCartGroup[] => {
  const fallbackVendorName = options?.fallbackVendorName || "Vendor";
  const fallbackProductName =
    options?.fallbackProductName || "Unknown Product";
  const groups = new Map<string, VendorCartGroup>();

  (Array.isArray(rawItems) ? rawItems : []).forEach((rawItem: any, index) => {
    const item = mapCartItem(rawItem, fallbackVendorName, fallbackProductName);
    const groupKey = item.vendorId || `missing-vendor-${index}`;
    const existing = groups.get(groupKey);

    if (!existing) {
      groups.set(groupKey, {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        vendorLogo: item.vendorLogo,
        vendorStoreName: item.vendorStoreName,
        vendorBusinessName: item.vendorBusinessName,
        vendorContactName: item.vendorContactName,
        vendorCode: item.vendorCode,
        vendorCountry: item.vendorCountry,
        vendorAddress: item.vendorAddress,
        itemCount: item.quantity,
        subtotal: item.price * item.quantity,
        items: [item],
      });
      return;
    }

    existing.items.push(item);
    existing.itemCount += item.quantity;
    existing.subtotal += item.price * item.quantity;
  });

  return Array.from(groups.values());
};
