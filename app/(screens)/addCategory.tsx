import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/use-translation";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAddCategoryMutation,
  useUpdateCategoryMutation,
} from "../../store/api/categoryApiSlice";

const AddCategoryScreen: React.FC = () => {
  const { language, t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { id, name: initialName, description: initialDescription, catImage: initialImage, displayOrder: initialOrder } = params;

  // Mutations
  const [addCategory, { isLoading: isAdding }] = useAddCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateCategoryMutation();

  // Form State
  const [name, setName] = useState(initialName as string || "");
  const [description, setDescription] = useState(initialDescription as string || "");
  const [displayOrder, setDisplayOrder] = useState(initialOrder as string || "0");
  const [selectedImage, setSelectedImage] = useState<string | null>(initialImage as string || null);
  const ui = React.useMemo(() => {
    if (language === "he") {
      return {
        editCategory: "עריכת קטגוריה",
        addNewCategory: "הוספת קטגוריה חדשה",
        categoryImage: "תמונת קטגוריה",
        uploadImage: "העלה תמונה",
        categoryName: "שם קטגוריה",
        displayOrder: "סדר תצוגה",
        descriptionOptional: "תיאור (אופציונלי)",
        briefDescription: "תיאור קצר של הקטגוריה",
        updateCategory: "עדכן קטגוריה",
        createCategory: "צור קטגוריה",
        enterCategoryName: "נא להזין שם קטגוריה",
        categoryUpdated: "הקטגוריה עודכנה בהצלחה",
        categoryAdded: "הקטגוריה נוספה בהצלחה",
        failedSave: "משהו השתבש. נסה שוב.",
      };
    }
    if (language === "hi") {
      return {
        editCategory: "कैटेगरी एडिट करें",
        addNewCategory: "नई कैटेगरी जोड़ें",
        categoryImage: "कैटेगरी इमेज",
        uploadImage: "इमेज अपलोड करें",
        categoryName: "कैटेगरी नाम",
        displayOrder: "डिस्प्ले क्रम",
        descriptionOptional: "विवरण (वैकल्पिक)",
        briefDescription: "इस कैटेगरी का संक्षिप्त विवरण",
        updateCategory: "कैटेगरी अपडेट करें",
        createCategory: "कैटेगरी बनाएं",
        enterCategoryName: "कृपया कैटेगरी नाम दर्ज करें",
        categoryUpdated: "कैटेगरी सफलतापूर्वक अपडेट हुई",
        categoryAdded: "कैटेगरी सफलतापूर्वक जोड़ दी गई",
        failedSave: "कुछ गलत हुआ। कृपया फिर से प्रयास करें।",
      };
    }
    return {
      editCategory: "Edit Category",
      addNewCategory: "Add New Category",
      categoryImage: "Category Image",
      uploadImage: "Upload Image",
      categoryName: "Category Name",
      displayOrder: "Display Order",
      descriptionOptional: "Description (Optional)",
      briefDescription: "Brief description of this category",
      updateCategory: "Update Category",
      createCategory: "Create Category",
      enterCategoryName: "Please enter a category name",
      categoryUpdated: "Category updated successfully",
      categoryAdded: "Category added successfully",
      failedSave: "Something went wrong. Please try again.",
    };
  }, [language]);

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        t("permission_required", "Permission Required"),
        t("need_photos_permission", "Sorry, we need camera roll permissions to make this work!")
      );
      return;
    }

    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("ImagePicker Error: ", error);
      Alert.alert(t("error", "Error"), t("failed_pick_image", "Failed to pick image. Please try again."));
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("error", "Error"), ui.enterCategoryName);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("description", description.trim());
      formData.append("displayOrder", displayOrder || "0");

      if (selectedImage && !selectedImage.startsWith('http')) {
        const uriParts = selectedImage.split(".");
        const fileType = uriParts[uriParts.length - 1];

        formData.append("catImage", {
          uri: selectedImage,
          name: `category_${Date.now()}.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      if (id) {
        await updateCategory({ id: id as string, formData }).unwrap();
        Alert.alert(t("success", "Success"), ui.categoryUpdated);
      } else {
        await addCategory(formData).unwrap();
        Alert.alert(t("success", "Success"), ui.categoryAdded);
      }
      router.back();
    } catch (error: any) {
      console.error("Failed to save category:", error);
      Alert.alert(t("error", "Error"), error?.data?.message || ui.failedSave);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{id ? ui.editCategory : ui.addNewCategory}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Image Upload */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>{ui.categoryImage}</Text>
            <TouchableOpacity style={styles.uploadBox} onPress={handleImagePicker}>
              {selectedImage ? (
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              ) : (
                <View style={styles.placeholder}>
                  <Ionicons name="camera" size={40} color="#999" />
                  <Text style={styles.uploadText}>{ui.uploadImage}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.categoryName}</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Electronics"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.displayOrder}</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={displayOrder}
                onChangeText={setDisplayOrder}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{ui.descriptionOptional}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={ui.briefDescription}
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveBtn, (isAdding || isUpdating) && styles.disabledBtn]}
            onPress={handleSave}
            disabled={isAdding || isUpdating}
          >
            {isAdding || isUpdating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveBtnText}>{id ? ui.updateCategory : ui.createCategory}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF" },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0"
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  backBtn: { padding: 5 },
  scrollContent: { padding: 20 },
  imageSection: { marginBottom: 25 },
  label: { fontSize: 15, fontWeight: "600", color: "#333", marginBottom: 10 },
  uploadBox: {
    height: 180,
    borderRadius: 15,
    backgroundColor: "#F9FAF9",
    borderWidth: 1,
    borderColor: "#DDD",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden"
  },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  placeholder: { alignItems: "center" },
  uploadText: { color: "#999", marginTop: 8, fontSize: 13 },
  form: { gap: 15 },
  inputGroup: { gap: 8 },
  input: {
    backgroundColor: "#F9FAF9",
    borderWidth: 1,
    borderColor: "#EEE",
    borderRadius: 10,
    padding: 12,
    fontSize: 15
  },
  textArea: { height: 100, textAlignVertical: "top" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  saveBtn: {
    backgroundColor: "#349488",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center"
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "bold" },
  disabledBtn: { opacity: 0.7 }
});

export default AddCategoryScreen;
