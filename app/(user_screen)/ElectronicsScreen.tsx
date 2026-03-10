import { useTranslation } from "@/hooks/use-translation";
import {
  useAddToCartMutation,
  useGetCartQuery,
} from "@/store/api/cartApiSlice";
import { useGetMyConnectionsQuery } from "@/store/api/connectionApiSlice";
import { useGetProductsByVendorQuery } from "@/store/api/product_api_slice";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;
const MIN_ORDER_QTY = 10;

const PRODUCTS = [
  {
    id: "1",
    title: "Optical Mouse",
    price: "$20.00",
    rating: 4.4,
    reviews: "1,256",
    image: require("../../assets/users/Mask group.png"),
  },
  {
    id: "2",
    title: "USB Keyboard",
    price: "$20.00",
    rating: 4.4,
    reviews: "1,256",
    image: require("../../assets/users/Mask group (1).png"),
  },
  {
    id: "3",
    title: "Wireless Earbuds",
    price: "$20.00",
    rating: 4.4,
    reviews: "1,256",
    image: require("../../assets/users/Mask group (2).png"),
  },
  {
    id: "4",
    title: "Power Bank",
    price: "$20.00",
    rating: 4.4,
    reviews: "1,256",
    image: require("../../assets/users/Mask group (3).png"),
  },
];

const ElectronicsScreen = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams<{
    categoryId: string;
    categoryName: string;
  }>();
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantityInput, setQuantityInput] = useState("");
  const suppressNextCardPressRef = useRef(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = user?.userId || user?.id || (user as any)?._id;

  const { data: connections, isLoading: isConnectionsLoading } =
    useGetMyConnectionsQuery(currentUserId, {
      skip: !currentUserId,
      refetchOnMountOrArgChange: true,
    });
  const activeVendorId =
    connections?.data?.[0]?.vendor?._id || connections?.data?.[0]?.vendor?.id;

  const { data: products, isLoading: isProductsLoading } =
    useGetProductsByVendorQuery(
      { vendorId: activeVendorId, categoryId },
      { skip: !activeVendorId },
    );

  const [addToCartMutation, { isLoading: isAddingToCart }] =
    useAddToCartMutation();
  const { data: cartData, refetch: refetchCart } = useGetCartQuery();

  const loadAddedItems = useCallback(() => {
    if (cartData) {
      const rawItems =
        cartData?.data?.items ||
        cartData?.items ||
        (Array.isArray(cartData) ? cartData : []);
      const addedMap: { [key: string]: boolean } = {};
      rawItems.forEach((item: any) => {
        const id = item.productId?._id || item.productId?.id || item.productId;
        if (id) addedMap[id] = true;
      });
      setAddedItems(addedMap);
    }
  }, [cartData]);

  useFocusEffect(
    useCallback(() => {
      refetchCart();
      loadAddedItems();
    }, [refetchCart, loadAddedItems]),
  );

  const addToCart = async (product: any, quantity?: number) => {
    // Safety guard: never allow direct add below minimum quantity.
    // This also protects against any stale/old call sites that might pass no quantity.
    if (!Number.isInteger(quantity) || Number(quantity) < MIN_ORDER_QTY) {
      setSelectedProduct(product);
      setShowQtyModal(true);
      Alert.alert(
        t("error", "Error"),
        t("electronics_min_order_error", "Minimum order quantity is 10"),
      );
      return;
    }

    try {
      await addToCartMutation({
        productId: product._id || product.id,
        quantity: Number(quantity),
      }).unwrap();

      Alert.alert(
        t("success", "Success"),
        t("electronics_added_to_cart", "Product added to cart!"),
      );
      setShowQtyModal(false);
      setSelectedProduct(null);
      setQuantityInput("");
      // loadAddedItems will be updated via cartData change
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      Alert.alert(
        t("error", "Error"),
        error?.data?.message ||
          t("electronics_failed_add_to_cart", "Failed to add to cart"),
      );
    }
  };

  const openQtyModal = (product: any) => {
    setSelectedProduct(product);
    setQuantityInput("");
    setShowQtyModal(true);
  };

  const handleConfirmAddToCart = async () => {
    if (!selectedProduct) return;
    const qty = Number(quantityInput);
    if (!Number.isInteger(qty) || qty < MIN_ORDER_QTY) {
      Alert.alert(
        t("error", "Error"),
        t("electronics_min_order_error", "Minimum order quantity is 10"),
      );
      return;
    }
    await addToCart(selectedProduct, qty);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {categoryName || t("electronics_title", "Electronics")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar Section */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#888" />
        <TextInput
          placeholder={t("electronics_search_placeholder", "Search Product..")}
          style={styles.searchInput}
          placeholderTextColor="#888"
        />
      </View>

      {/* Product Grid List */}
      {isConnectionsLoading || isProductsLoading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#2A8383" />
        </View>
      ) : (
        <FlatList
          data={products}
          numColumns={2}
          keyExtractor={(item) => item.id || item._id}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                  // If "+" was tapped and the press bubbled, skip this navigation once.
                  if (suppressNextCardPressRef.current) {
                    suppressNextCardPressRef.current = false;
                    return;
                  }
                  router.push({
                    pathname: "/(user_screen)/ProductDetails",
                    params: { productId: item.id || item._id },
                  });
                }}
              >
                {/* Light Blue Image Container */}
                <View style={styles.imageBox}>
                  <Image
                    source={
                      item.images?.[0] ? { uri: item.images[0] } : item.image
                    }
                    style={styles.img}
                    resizeMode="contain"
                  />
                </View>

                {/* Product Title */}
                <Text style={styles.title} numberOfLines={1}>
                  {item.title || item.name}
                </Text>

                {/* Rating Section */}
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color="#FFB800" />
                  <Text style={styles.ratingText}>{item.rating || "0.0"}</Text>
                  <Text style={styles.reviews}>
                    ({item.reviews || 0} {t("electronics_reviews", "reviews")})
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Price and Circular Add Button */}
              <View style={styles.cardBottom}>
                <View>
                  <Text style={styles.priceText}>
                    ${item.price}
                    <Text style={styles.unitText}>
                      {" "}
                      /{t("electronics_unit", "unit")}
                    </Text>
                  </Text>
                </View>

                <Pressable
                  style={[
                    styles.addButton,
                    addedItems[item.id || item._id] && {
                      backgroundColor: "#E0F2F1",
                    },
                  ]}
                  hitSlop={8}
                  onPress={() => {
                    suppressNextCardPressRef.current = true;
                    openQtyModal(item);
                  }}
                >
                  {addedItems[item.id || item._id] ? (
                    <Ionicons name="checkmark" size={24} color="#2A8383" />
                  ) : (
                    <Ionicons name="add" size={24} color="#333" />
                  )}
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text
              style={{ textAlign: "center", color: "#6B7280", marginTop: 32 }}
            >
              {t("electronics_no_products", "No products found")}
            </Text>
          }
        />
      )}

      <Modal
        visible={showQtyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQtyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t("electronics_min_order", "Minimum order quantity: 10")}
              </Text>
              <TouchableOpacity onPress={() => setShowQtyModal(false)}>
                <Ionicons name="close" size={34} color="#FF5A5F" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.qtyInput}
              placeholder={t(
                "electronics_enter_quantity",
                "Enter your quantity",
              )}
              placeholderTextColor="#7A7E80"
              keyboardType="number-pad"
              value={quantityInput}
              onChangeText={setQuantityInput}
            />

            <TouchableOpacity
              style={styles.addToCartBtn}
              onPress={handleConfirmAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.addToCartBtnText}>
                  {t("electronics_add_to_cart", "Add to Cart")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F7FAF8" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  searchBar: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 25,
    elevation: 2,
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 14 },
  listPadding: { padding: 16 },
  columnWrapper: { justifyContent: "space-between" },

  card: {
    width: CARD_WIDTH,
    backgroundColor: "#FFF",
    borderRadius: 25,
    padding: 12,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  imageBox: {
    height: 130,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  img: { width: "100%", height: "100%" },
  title: {
    fontWeight: "bold",
    marginTop: 12,
    fontSize: 16,
    color: "#2D3E33",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 5,
    color: "#333",
  },
  reviews: {
    fontSize: 13,
    color: "#999",
    marginLeft: 4,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 15,
  },
  priceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  unitText: {
    fontSize: 12,
    color: "#888",
    fontWeight: "normal",
  },
  addButton: {
    backgroundColor: "#F2F2F2",
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    backgroundColor: "#E9ECEA",
    borderRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  modalTitle: {
    color: "#FF5A5F",
    fontSize: 22,
    fontWeight: "500",
    flex: 1,
    paddingRight: 12,
  },
  qtyInput: {
    height: 80,
    borderWidth: 2,
    borderColor: "#C4C8CB",
    borderRadius: 22,
    paddingHorizontal: 22,
    fontSize: 24,
    color: "#1F2937",
    marginBottom: 22,
    backgroundColor: "#EEF1EF",
  },
  addToCartBtn: {
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2A8B8A",
    alignItems: "center",
    justifyContent: "center",
  },
  addToCartBtnText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "500",
  },
});

export default ElectronicsScreen;
