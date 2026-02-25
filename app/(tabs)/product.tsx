import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/use-translation";
import { useGetProfileQuery } from "../../store/api/authApiSlice";
import { useDeleteCategoryMutation, useGetCategoriesByVendorQuery } from "../../store/api/categoryApiSlice";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

const ProductScreen = () => {
  const { language } = useTranslation();
  const { data: profileData } = useGetProfileQuery({});
  const vendorId = profileData?.data?.vendor?.id || profileData?.data?.vendor?._id;
  const [searchQuery, setSearchQuery] = useState("");

  console.log('ProductScreen - vendorId:', vendorId);

  const { data: categoryResponse, isLoading, error, refetch, isFetching } = useGetCategoriesByVendorQuery(vendorId, {
    skip: !vendorId
  });

  console.log('ProductScreen - categoryResponse:', categoryResponse);



  console.log('ProductScreen - categoryResponse:', JSON.stringify(categoryResponse));


  console.log('ProductScreen - error:', JSON.stringify(error));

  const [deleteCategory] = useDeleteCategoryMutation();

  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        title: "מוצרים",
        searchByCategory: "חיפוש לפי קטגוריה",
        deleteCategory: "מחיקת קטגוריה",
        deleteCategoryConfirm: (name: string) => `האם למחוק את "${name}"?`,
        cancel: "ביטול",
        delete: "מחיקה",
        success: "הצלחה",
        categoryDeleted: "הקטגוריה נמחקה בהצלחה",
        error: "שגיאה",
        failedDeleteCategory: "מחיקת הקטגוריה נכשלה",
        completeVendorProfile: "נא להשלים פרופיל ספק כדי לראות קטגוריות.",
        failedLoadCategories: "טעינת הקטגוריות נכשלה. נסה שוב.",
        noCategoriesMatching: (query: string) => `אין קטגוריות שתואמות ל-\"${query}\"`,
        noCategoriesFound: "לא נמצאו קטגוריות",
      };
    }
    if (language === "hi") {
      return {
        title: "प्रोडक्ट",
        searchByCategory: "कैटेगरी से खोजें",
        deleteCategory: "कैटेगरी हटाएं",
        deleteCategoryConfirm: (name: string) => `क्या आप "${name}" को हटाना चाहते हैं?`,
        cancel: "रद्द करें",
        delete: "हटाएं",
        success: "सफलता",
        categoryDeleted: "कैटेगरी सफलतापूर्वक हटाई गई",
        error: "त्रुटि",
        failedDeleteCategory: "कैटेगरी हटाना विफल रहा",
        completeVendorProfile: "कैटेगरी देखने के लिए अपना vendor profile पूरा करें।",
        failedLoadCategories: "कैटेगरी लोड नहीं हुई। कृपया फिर से कोशिश करें।",
        noCategoriesMatching: (query: string) => `"${query}" से मेल खाती कोई कैटेगरी नहीं मिली`,
        noCategoriesFound: "कोई कैटेगरी नहीं मिली",
      };
    }
    return {
      title: "Product",
      searchByCategory: "Search by Category",
      deleteCategory: "Delete Category",
      deleteCategoryConfirm: (name: string) => `Are you sure you want to delete "${name}"?`,
      cancel: "Cancel",
      delete: "Delete",
      success: "Success",
      categoryDeleted: "Category deleted successfully",
      error: "Error",
      failedDeleteCategory: "Failed to delete category",
      completeVendorProfile: "Please complete your vendor profile to see categories.",
      failedLoadCategories: "Failed to load categories. Please try again.",
      noCategoriesMatching: (query: string) => `No categories matching "${query}"`,
      noCategoriesFound: "No categories found",
    };
  }, [language]);

  const categories = categoryResponse?.data || (Array.isArray(categoryResponse) ? categoryResponse : []);

  console.log('ProductScreen - categories length:', categories.length);

  const filteredCategories = categories.filter((item: any) => {
    const nameMatch = item.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch;
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      ui.deleteCategory,
      ui.deleteCategoryConfirm(name),
      [
        { text: ui.cancel, style: "cancel" },
        {
          text: ui.delete,
          style: "destructive",
          onPress: async () => {
            console.log('ProductScreen - Deleting category ID:', id);
            try {
              const res = await deleteCategory(id).unwrap();
              console.log('ProductScreen - Delete response:', JSON.stringify(res));
              Alert.alert(ui.success, ui.categoryDeleted);
            } catch (err: any) {
              console.error('ProductScreen - Delete ERROR:', JSON.stringify(err));
              Alert.alert(ui.error, err?.data?.message || ui.failedDeleteCategory);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header Section */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ui.title}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/(screens)/addCategory")}
        >
          <Ionicons name="add" size={28} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder={ui.searchByCategory}
          placeholderTextColor="#999"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Categories Grid */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#349488" />
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {(error as any)?.data?.message === "Vendor not found"
                ? ui.completeVendorProfile
                : ui.failedLoadCategories}
            </Text>
          </View>
        ) : filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? ui.noCategoriesMatching(searchQuery) : ui.noCategoriesFound}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredCategories.map((item: any) => (
              <View key={item.id} style={styles.card}>
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.thumbnail }} style={styles.catImage} />

                  {/* Action Overlay */}
                  <View style={styles.actionOverlay}>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push({
                        pathname: "/(screens)/addCategory",
                        params: {
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          catImage: item.thumbnail,
                          displayOrder: item.displayOrder?.toString()
                        }
                      })}
                    >
                      <Ionicons name="create-outline" size={18} color="#349488" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => handleDelete(item.id, item.name)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.nameBadge}
                  onPress={() => router.push({
                    pathname: "/(tabs)/electronics-products",
                    params: { categoryId: item.id, categoryName: item.name }
                  })}
                >
                  <Text style={styles.catName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FBFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    height: 60,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  iconBtn: { padding: 5 },
  addBtn: {
    backgroundColor: "#349488",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 55,
    borderWidth: 1,
    borderColor: "#E8F3F2",
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 16, color: "#333" },
  scrollContent: { paddingBottom: 100 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  card: {
    width: COLUMN_WIDTH,
    marginBottom: 20,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "#EEE",
  },
  catImage: { width: "100%", height: "100%", resizeMode: "cover" },
  nameBadge: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#349488",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "#F0F9F8",
  },
  catName: { color: "#349488", fontWeight: "600", fontSize: 14 },
  loadingContainer: {
    paddingTop: 50,
    alignItems: "center",
  },
  emptyContainer: {
    paddingTop: 100,
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: 'center',
  },
  actionOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
    flexDirection: "row",
  },
  actionBtn: {
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
});

export default ProductScreen;
