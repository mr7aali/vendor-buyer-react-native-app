import { useGetCategoriesByVendorQuery } from "@/store/api/categoryApiSlice";
import { useGetMyConnectionsQuery } from "@/store/api/connectionApiSlice";
import { useTranslation } from "@/hooks/use-translation";
import { RootState } from "@/store/store";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSelector } from "react-redux";

interface Category {
  id: string;
  title: string;
  image: ImageSourcePropType;
}



const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

const CategoriesScreen: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const user = useSelector((state: RootState) => state.auth.user);
  const currentUserId = user?.userId || user?.id || (user as any)?._id;

  const { data: connections, isLoading: isConnectionsLoading } = useGetMyConnectionsQuery(currentUserId, {
    skip: !currentUserId,
    refetchOnMountOrArgChange: true,
  });
  const activeVendorId = connections?.data?.[0]?.vendor?._id || connections?.data?.[0]?.vendor?.id;
  console.log("Active Vendor ID:", activeVendorId);
  const { data: categoriesData, isLoading: isCategoriesLoading } = useGetCategoriesByVendorQuery(
    activeVendorId,
    { skip: !activeVendorId }
  );

  const categories = categoriesData?.data || (Array.isArray(categoriesData) ? categoriesData : []);
  const filteredCategories = categories.filter((item: any) => {
    const title = item.title || item.name || "";
    return title.toLowerCase().includes(search.toLowerCase());
  });

  console.log("Categories:", categories);
  console.log("Raw Categories:", categoriesData);
  const handleCategoryPress = (category: any) => {
    router.push({
      pathname: "/(user_screen)/ElectronicsScreen",
      params: {
        categoryId: category._id || category.id,
        categoryName: category.name || category.title
      }
    });
  };

  const renderCategory = ({ item }: { item: any }) => (
    <View style={styles.cardContainer}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => handleCategoryPress(item)}>
        <Image
          source={
            item.catImage ? { uri: item.catImage } :
              item.thumbnail ? { uri: item.thumbnail } :
                (item.image ? (typeof item.image === 'string' ? { uri: item.image } : item.image) :
                  require("../../assets/users/Mask group.png"))
          }
          style={styles.categoryImage}
          resizeMode="cover"
        />
        <View style={styles.categoryButton}>
          <Text style={styles.categoryText}>{item.name || item.title}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  if (isConnectionsLoading || isCategoriesLoading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4FB0A8" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("categories_title", "Categories")}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={20}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={t("categories_search_placeholder", "Search Categories..")}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id || item._id}
        numColumns={2}
        contentContainerStyle={styles.listPadding}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 40 }}>
            {t("categories_no_categories", "No categories found")}
          </Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#333" },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 50,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 20,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16 },
  listPadding: { paddingHorizontal: 16, paddingBottom: 20 },
  columnWrapper: { justifyContent: "space-between" },
  cardContainer: { width: COLUMN_WIDTH, marginBottom: 20 },
  categoryImage: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    marginBottom: 8,
    backgroundColor: "#E0E0E0",
  },
  categoryButton: {
    width: "100%",
    height: 40,
    borderWidth: 1.5,
    borderColor: "#4FB0A8",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryText: { color: "#4FB0A8", fontWeight: "600", fontSize: 15 },
});

export default CategoriesScreen;
