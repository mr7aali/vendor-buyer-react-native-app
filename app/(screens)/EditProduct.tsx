import { useTranslation } from "@/hooks/use-translation";
import { useGetCategoriesByVendorQuery } from "@/store/api/categoryApiSlice";
import {
  useCreateProductMutation,
  useCreateProductSpecificationMutation,
  useGetProductByIdQuery,
  useUpdateProductMutation,
} from "@/store/api/product_api_slice";
import { useAppSelector } from "@/store/hooks";
import { selectCurrentUser } from "@/store/slices/authSlice";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type SpecItem = { label: string; value: string; isExisting?: boolean };

const getEntityId = (entity: any) => entity?.id || entity?._id;

const getProductIdFromResponse = (response: any) =>
  response?.id ||
  response?._id ||
  response?.product?.id ||
  response?.product?._id ||
  response?.data?.id ||
  response?.data?._id ||
  response?.data?.product?.id ||
  response?.data?.product?._id ||
  response?.data?.data?.id ||
  response?.data?.data?._id ||
  response?.data?.data?.product?.id ||
  response?.data?.data?.product?._id ||
  response?.result?.id ||
  response?.result?._id ||
  response?.result?.product?.id ||
  response?.result?.product?._id ||
  "";

const INPUT_PLACEHOLDER_COLOR = "#8A969D";
const MAX_UPLOAD_IMAGE_BYTES = 900 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_COMPRESSION_STEPS = [0.7, 0.55, 0.4];

const toCleanNumberString = (value: string) => value.replace(/[^0-9.]/g, "");
const imagePickerMediaTypes: ImagePicker.MediaType[] = ["images"];

const isNonNegativeNumber = (value: string) => {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) && parsed >= 0;
};

const formatApiErrorMessage = (error: any, fallback: string) => {
  const messages = error?.data?.messages;
  if (Array.isArray(messages) && messages.length > 0) {
    return messages.join("\n");
  }

  const responseMessage = error?.data?.response?.message;
  if (Array.isArray(responseMessage) && responseMessage.length > 0) {
    return responseMessage.join("\n");
  }

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (typeof error?.data?.message === "string" && error.data.message.trim()) {
    return error.data.message;
  }

  if (
    error?.originalStatus === 413 ||
    error?.status === 413 ||
    String(error?.data || "").includes("413 Request Entity Too Large")
  ) {
    return "Image size is too large. Please use a smaller or compressed photo.";
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallback;
};

const getImageInfoSize = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri, { size: true });
    return fileInfo.exists ? Number(fileInfo.size || 0) : 0;
  } catch {
    return 0;
  }
};

const buildResizeAction = (width?: number, height?: number) => {
  const safeWidth = Number(width || 0);
  const safeHeight = Number(height || 0);

  if (!safeWidth || !safeHeight) {
    return { width: MAX_IMAGE_DIMENSION };
  }

  if (safeWidth >= safeHeight) {
    return safeWidth > MAX_IMAGE_DIMENSION
      ? { width: MAX_IMAGE_DIMENSION }
      : undefined;
  }

  return safeHeight > MAX_IMAGE_DIMENSION
    ? { height: MAX_IMAGE_DIMENSION }
    : undefined;
};

const optimizePickedImage = async (asset: ImagePicker.ImagePickerAsset) => {
  const originalUri = String(asset?.uri || "");
  if (!originalUri || originalUri.startsWith("http")) return originalUri;

  const initialSize = await getImageInfoSize(originalUri);
  const resizeAction = buildResizeAction(asset?.width, asset?.height);

  let currentUri = originalUri;
  let currentSize = initialSize;

  for (const compress of IMAGE_COMPRESSION_STEPS) {
    const actions = resizeAction ? [{ resize: resizeAction }] : [];
    const manipulated = await manipulateAsync(currentUri, actions, {
      compress,
      format: SaveFormat.JPEG,
    });

    currentUri = manipulated.uri;
    currentSize = await getImageInfoSize(currentUri);

    if (currentSize > 0 && currentSize <= MAX_UPLOAD_IMAGE_BYTES) {
      return currentUri;
    }
  }

  return currentUri;
};

export default function EditProduct() {
  const { language, t } = useTranslation();
  const router = useRouter();
  const { id, categoryId: categoryIdParam } = useLocalSearchParams();
  const productId = id ? String(id) : "";
  const user = useAppSelector(selectCurrentUser);

  const vendorId =
    (user as any)?.vendor?.id ||
    (user as any)?.vendor?._id ||
    user?.id ||
    (user as any)?._id;

  const { data: categories = [] } = useGetCategoriesByVendorQuery(vendorId, {
    skip: !vendorId,
  });
  const { data: productData, isLoading: isLoadingProduct } =
    useGetProductByIdQuery(productId, { skip: !productId });
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [createProductSpecification] = useCreateProductSpecificationMutation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [minimumQuantity, setMinimumQuantity] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [specifications, setSpecifications] = useState<SpecItem[]>([]);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  const [isSpecModalVisible, setIsSpecModalVisible] = useState(false);
  const [newSpecLabel, setNewSpecLabel] = useState("");
  const [newSpecValue, setNewSpecValue] = useState("");
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);

  const ui = useMemo(() => {
    if (language === "he") {
      return {
        editProduct: "עריכת מוצר",
        media: "מדיה",
        productDetails: "פרטי מוצר",
        quantity: "כמות",
        pricing: "תמחור",
        price: "מחיר",
        addCategory: "הוסף קטגוריה",
        settings: "הגדרות",
        save: "שמור",
        saveLoading: "שומר...",
        specification: "מפרט",
        addSpecification: "הוסף מפרט",
        noSpecAddedYet: "עדיין לא נוסף מפרט.",
        missingFields: "שדות חסרים",
        missingFieldsMsg: "נא למלא שם מוצר, מחיר, כמות וקטגוריה.",
        missingMedia: "מדיה חסרה",
        missingMediaMsg: "נא להוסיף לפחות תמונת מוצר אחת.",
        limitReached: "הגעת למגבלה",
        maxImagesMsg: "ניתן להעלות עד 5 תמונות.",
        permissionRequired: "נדרשת הרשאה",
        photoPermissionRequired: "נדרשת הרשאת גלריה.",
        specMissingFields: "חסרים שדות",
        specMissingFieldsMsg: "נא להזין מפתח וערך למפרט.",
        successUpdated: "המוצר עודכן בהצלחה.",
        successCreated: "המוצר נוצר בהצלחה.",
        failedSaveProduct: "שמירת המוצר נכשלה.",
        selectCategory: "בחר קטגוריה",
      };
    }
    if (language === "hi") {
      return {
        editProduct: "प्रोडक्ट एडिट करें",
        media: "मीडिया",
        productDetails: "प्रोडक्ट विवरण",
        quantity: "मात्रा",
        pricing: "प्राइसिंग",
        price: "कीमत",
        addCategory: "कैटेगरी जोड़ें",
        settings: "सेटिंग्स",
        save: "सेव करें",
        saveLoading: "सेव हो रहा है...",
        specification: "स्पेसिफिकेशन",
        addSpecification: "स्पेसिफिकेशन जोड़ें",
        noSpecAddedYet: "अभी तक कोई स्पेसिफिकेशन नहीं जोड़ा गया।",
        missingFields: "फ़ील्ड्स अधूरे हैं",
        missingFieldsMsg: "कृपया प्रोडक्ट नाम, कीमत, मात्रा और कैटेगरी भरें।",
        missingMedia: "मीडिया नहीं है",
        missingMediaMsg: "कृपया कम से कम एक प्रोडक्ट इमेज जोड़ें।",
        limitReached: "सीमा पूरी हुई",
        maxImagesMsg: "आप अधिकतम 5 इमेज अपलोड कर सकते हैं।",
        permissionRequired: "अनुमति आवश्यक",
        photoPermissionRequired: "फोटो लाइब्रेरी अनुमति आवश्यक है।",
        specMissingFields: "फ़ील्ड्स अधूरे हैं",
        specMissingFieldsMsg: "कृपया स्पेसिफिकेशन key और value दोनों भरें।",
        successUpdated: "प्रोडक्ट सफलतापूर्वक अपडेट हो गया।",
        successCreated: "प्रोडक्ट सफलतापूर्वक बनाया गया।",
        failedSaveProduct: "प्रोडक्ट सेव करना विफल रहा।",
        selectCategory: "कैटेगरी चुनें",
      };
    }
    return {
      editProduct: "Edit Product",
      media: "Media",
      productDetails: "Product details",
      quantity: "Quantity",
      pricing: "Pricing",
      price: "Price",
      addCategory: "Add Category",
      settings: "Settings",
      save: "Save",
      saveLoading: "Saving...",
      specification: "Specification",
      addSpecification: "Add Specification",
      noSpecAddedYet: "No specification added yet.",
        missingFields: "Missing fields",
      missingFieldsMsg:
        "Please fill product name, price, quantity and category.",
      invalidMinimumQuantity: "Invalid minimum quantity",
      invalidMinimumQuantityMsg:
        "Enter a minimum quantity of 0 or more before saving.",
      invalidPrice: "Invalid price",
      invalidPriceMsg: "Enter a valid price of 0 or more.",
      invalidStockQuantity: "Invalid stock quantity",
      invalidStockQuantityMsg: "Enter a stock quantity of 0 or more.",
      missingMedia: "Missing media",
      missingMediaMsg: "Please add at least one product image.",
      limitReached: "Limit Reached",
      maxImagesMsg: "You can upload up to 5 images.",
      permissionRequired: "Permission Required",
      photoPermissionRequired: "Photo library permission is required.",
      cameraPermissionRequired: "Camera permission is required.",
      cameraOption: "Take Photo",
      galleryOption: "Choose from Gallery",
      imageSourceTitle: "Add Product Image",
      imageSourceMessage: "Choose how you want to add an image.",
      cameraUnavailable: "Camera unavailable",
      cameraUnavailableMsg:
        "This device cannot open the camera right now. Please try the gallery instead.",
      specMissingFields: "Missing fields",
      specMissingFieldsMsg: "Please enter both specification key and value.",
      successUpdated: "Product updated successfully.",
      successCreated: "Product created successfully.",
      failedSaveProduct: "Failed to save product.",
      selectCategory: "Select Category",
    };
  }, [language]);

  useEffect(() => {
    if (!productData) return;

    setName(productData.name || "");
    setDescription(productData.description || "");
    setPrice(productData.price != null ? String(productData.price) : "");
    setStockQuantity(
      productData.stockQuantity != null
        ? String(productData.stockQuantity)
        : "",
    );
    setMinimumQuantity(
      productData.minimulAuantity != null
        ? String(productData.minimulAuantity)
        : "",
    );
    setIsActive(productData.isAvailable ?? true);
    setSelectedImages(
      Array.isArray(productData.images) ? productData.images : [],
    );

    // Only map actual existing specs from backend; nothing else is auto-inserted.
    const mappedSpecs =
      productData.specification && typeof productData.specification === "object"
        ? Object.entries(productData.specification)
            .filter(
              ([, value]) =>
                value !== undefined &&
                value !== null &&
                String(value).trim() !== "",
            )
            .map(([key, value]) => ({
              label:
                key.charAt(0).toUpperCase() +
                key.slice(1).replace(/([A-Z])/g, " $1"),
              value: Array.isArray(value) ? value.join(", ") : String(value),
              isExisting: true,
            }))
        : [];
    setSpecifications(mappedSpecs);
  }, [productData]);

  useEffect(() => {
    const targetCategoryId = productData?.categoryId || categoryIdParam;
    if (!targetCategoryId) return;
    const found = categories.find(
      (cat: any) => String(getEntityId(cat)) === String(targetCategoryId),
    );
    setSelectedCategoryId(String(targetCategoryId));
    if (found) setSelectedCategoryName(found.name);
  }, [productData, categoryIdParam, categories]);

  const categoryOptions = useMemo(
    () => (Array.isArray(categories) ? categories : []),
    [categories],
  );

  const handleImagePickerResult = async (
    result: ImagePicker.ImagePickerResult,
  ) => {
    if (result.canceled || !result.assets?.length) return;

    try {
      setIsPreparingImage(true);
      const optimizedUri = await optimizePickedImage(result.assets[0]);
      setSelectedImages((prev) => [...prev, optimizedUri]);
    } catch (error) {
      console.error("Failed to prepare image:", error);
      Alert.alert(
        t("error", "Error"),
        "We couldn't prepare that image. Please try another photo.",
      );
    } finally {
      setIsPreparingImage(false);
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(ui.permissionRequired, ui.photoPermissionRequired);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: imagePickerMediaTypes,
      allowsEditing: true,
      quality: 0.6,
    });

    await handleImagePickerResult(result);
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        ui.permissionRequired,
        (ui as any).cameraPermissionRequired || "Camera permission is required.",
      );
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: imagePickerMediaTypes,
        allowsEditing: true,
        quality: 0.6,
      });

      await handleImagePickerResult(result);
    } catch (error) {
      console.error("Failed to launch camera:", error);
      Alert.alert(
        (ui as any).cameraUnavailable || "Camera unavailable",
        (ui as any).cameraUnavailableMsg ||
          "This device cannot open the camera right now. Please try the gallery instead.",
      );
    }
  };

  const pickImage = async () => {
    if (selectedImages.length >= 5) {
      Alert.alert(ui.limitReached, ui.maxImagesMsg);
      return;
    }

    if (Platform.OS === "ios") {
      Alert.alert(
        (ui as any).imageSourceTitle || "Add Product Image",
        (ui as any).imageSourceMessage ||
          "Choose how you want to add an image.",
        [
          {
            text: (ui as any).cameraOption || "Take Photo",
            onPress: openCamera,
          },
          {
            text: (ui as any).galleryOption || "Choose from Gallery",
            onPress: openGallery,
          },
          { text: t("cancel", "Cancel"), style: "cancel" },
        ],
      );
      return;
    }

    Alert.alert(
      (ui as any).imageSourceTitle || "Add Product Image",
      (ui as any).imageSourceMessage || "Choose how you want to add an image.",
      [
        {
          text: (ui as any).cameraOption || "Take Photo",
          onPress: openCamera,
        },
        {
          text: (ui as any).galleryOption || "Choose from Gallery",
          onPress: openGallery,
        },
        { text: t("cancel", "Cancel"), style: "cancel" },
      ],
    );
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addSpec = () => {
    const label = newSpecLabel.trim();
    const value = newSpecValue.trim();
    if (!label || !value) {
      Alert.alert(ui.specMissingFields, ui.specMissingFieldsMsg);
      return;
    }
    setSpecifications((prev) => [...prev, { label, value, isExisting: false }]);
    setNewSpecLabel("");
    setNewSpecValue("");
    setIsSpecModalVisible(false);
  };

  const removeSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (
      !name.trim() ||
      !price.trim() ||
      !stockQuantity.trim() ||
      !selectedCategoryId
    ) {
      Alert.alert(ui.missingFields, ui.missingFieldsMsg);
      return;
    }
    if (!selectedImages.length) {
      Alert.alert(ui.missingMedia, ui.missingMediaMsg);
      return;
    }
    if (!isNonNegativeNumber(price)) {
      Alert.alert(
        (ui as any).invalidPrice || "Invalid price",
        (ui as any).invalidPriceMsg || "Enter a valid price of 0 or more.",
      );
      return;
    }
    if (!isNonNegativeNumber(stockQuantity)) {
      Alert.alert(
        (ui as any).invalidStockQuantity || "Invalid stock quantity",
        (ui as any).invalidStockQuantityMsg ||
          "Enter a stock quantity of 0 or more.",
      );
      return;
    }
    if (!isNonNegativeNumber(minimumQuantity)) {
      Alert.alert(
        (ui as any).invalidMinimumQuantity || "Invalid minimum quantity",
        (ui as any).invalidMinimumQuantityMsg ||
          "Enter a minimum quantity of 0 or more before saving.",
      );
      return;
    }

    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("description", description.trim());
    formData.append("price", String(price).trim());
    formData.append("stockQuantity", String(stockQuantity).trim());
    formData.append("minimulAuantity", String(minimumQuantity).trim());
    formData.append("isAvailable", String(isActive));
    formData.append("categoryId", selectedCategoryId);

    // Preserve existing backend behavior: imageUrl for existing remote URLs, images for new files.
    selectedImages.forEach((uri, index) => {
      if (uri.startsWith("http")) {
        formData.append("imageUrl", uri);
      } else {
        formData.append("images", {
          uri,
          name: `product_${index}.jpg`,
          type: "image/jpeg",
        } as any);
      }
    });

    // Create only newly added specs to avoid duplicate records on edit.

    const specsToCreate = specifications
      .filter((spec) => !spec.isExisting)
      .map((spec) => ({ label: spec.label.trim(), value: spec.value.trim() }))
      .filter((spec) => spec.label && spec.value)
      .filter(
        (spec, index, self) =>
          self.findIndex(
            (s) =>
              s.label.toLowerCase() === spec.label.toLowerCase() &&
              s.value === spec.value,
          ) === index,
      );

    try {
      let savedProductId = productId;
      const isEditing = !!productId;

      if (isEditing) {
        const updated = await updateProduct({
          id: productId,
          formData,
        }).unwrap();
        savedProductId = productId || getProductIdFromResponse(updated);
      } else {
        const created = await createProduct(formData).unwrap();
        console.log("EditProduct createProduct response:", created);
        savedProductId = getProductIdFromResponse(created);
      }

      if (specsToCreate.length > 0 && !savedProductId) {
        throw new Error(
          "Product saved but no product id returned for specification create.",
        );
      }

      if (savedProductId && specsToCreate.length > 0) {
        await Promise.all(
          specsToCreate.map((spec) =>
            createProductSpecification({
              productId: String(savedProductId),
              label: spec.label,
              value: spec.value,
            }).unwrap(),
          ),
        );
      }

      Alert.alert(
        t("success", "Success"),
        isEditing ? ui.successUpdated : ui.successCreated,
      );
      router.back();
    } catch (error: any) {
      console.error("Error saving product:", error);
      Alert.alert(
        t("error", "Error"),
        formatApiErrorMessage(error, ui.failedSaveProduct),
      );
    }
  };

  if (productId && isLoadingProduct) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#278687" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#1F2A30" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {productId ? ui.editProduct : t("add_product", "Add Product")}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{ui.media}</Text>
            <Text style={styles.mediaCount}>{selectedImages.length}/5</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
          >
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              <View style={styles.cameraCircle}>
                {isPreparingImage ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={20} color="#FFF" />
                )}
              </View>
            </TouchableOpacity>
            {selectedImages.map((uri, index) => (
              <View key={`${uri}-${index}`} style={styles.imageWrap}>
                <Image source={{ uri }} style={styles.mediaImage} />
                <TouchableOpacity
                  style={styles.removeBadge}
                  onPress={() => removeImage(index)}
                >
                  <Ionicons name="close-circle" size={20} color="#F15B63" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{ui.productDetails}</Text>
          <Text style={styles.inputLabel}>
            {t("product_name_required", "Product Name *")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={t("enter_product_name", "Enter product name")}
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            value={name}
            onChangeText={setName}
          />
          <Text style={styles.inputLabel}>
            {t("description_required", "Description *")}
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={t(
              "enter_product_description",
              "Enter product description",
            )}
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <Text style={styles.inputLabel}>{t("category", "Category")}</Text>
          <TouchableOpacity
            style={styles.inputPicker}
            onPress={() => setIsCategoryModalVisible(true)}
          >
            <Text
              style={{ color: selectedCategoryName ? "#1F2A30" : "#8A969D" }}
            >
              {selectedCategoryName || ui.addCategory}
            </Text>
          </TouchableOpacity>
          <Text style={styles.inputLabel}>{ui.quantity}</Text>
          <TextInput
            style={styles.input}
            placeholder="123"
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            keyboardType="numeric"
            value={stockQuantity}
            onChangeText={setStockQuantity}
          />
          <Text style={styles.inputLabel}>
            {t("minimum_quantity", "Minimum Quantity")}
          </Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            keyboardType="numeric"
            value={minimumQuantity}
            onChangeText={setMinimumQuantity}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{ui.pricing}</Text>
          <Text style={styles.inputLabel}>{ui.price}</Text>
          <TextInput
            style={styles.input}
            placeholder={t("price_placeholder", "0.00")}
            placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
            keyboardType="numeric"
            value={price}
            onChangeText={(text) => setPrice(toCleanNumberString(text))}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>{ui.specification}</Text>
            <TouchableOpacity onPress={() => setIsSpecModalVisible(true)}>
              <Text style={styles.addSpec}>{ui.addSpecification}</Text>
            </TouchableOpacity>
          </View>
          {specifications.map((spec, index) => (
            <View key={`${spec.label}-${index}`} style={styles.specCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.specLabel}>{spec.label}</Text>
                <Text style={styles.specValue}>{spec.value}</Text>
              </View>
              <TouchableOpacity onPress={() => removeSpec(index)}>
                <Ionicons
                  name="close-circle-outline"
                  size={20}
                  color="#95A2AA"
                />
              </TouchableOpacity>
            </View>
          ))}
          {specifications.length === 0 ? (
            <Text style={styles.emptySpec}>{ui.noSpecAddedYet}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{ui.settings}</Text>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.activeLabel}>
                {t("active_status", "Active Status")}
              </Text>
              <Text style={styles.activeSub}>
                {t("show_product_in_store", "Show product in store")}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#D8E0E4", true: "#2E908F" }}
              thumbColor="#FFF"
              value={isActive}
              onValueChange={setIsActive}
            />
          </View>
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>{t("cancel", "Cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isCreating || isUpdating}
          >
            {isCreating || isUpdating ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.saveText}>{ui.save}</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={isSpecModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSpecModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ui.addSpecification}</Text>
              <TouchableOpacity onPress={() => setIsSpecModalVisible(false)}>
                <Ionicons name="close" size={24} color="#003D4D" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalInputRow}>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Brand"
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                value={newSpecLabel}
                onChangeText={setNewSpecLabel}
              />
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. JBL"
                placeholderTextColor={INPUT_PLACEHOLDER_COLOR}
                value={newSpecValue}
                onChangeText={setNewSpecValue}
              />
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setIsSpecModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>
                  {t("cancel", "Cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={addSpec}>
                <Text style={styles.modalSaveText}>{ui.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isCategoryModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{ui.selectCategory}</Text>
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#003D4D" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 350 }}>
              {categoryOptions.map((cat: any) => {
                const catId = String(getEntityId(cat));
                const selected = selectedCategoryId === catId;
                return (
                  <TouchableOpacity
                    key={catId}
                    style={styles.categoryItem}
                    onPress={() => {
                      setSelectedCategoryId(catId);
                      setSelectedCategoryName(cat.name);
                      setIsCategoryModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected
                          ? { color: "#2E908F", fontWeight: "700" }
                          : null,
                      ]}
                    >
                      {cat.name}
                    </Text>
                    {selected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#2E908F"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F6F5" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F2F6F5",
  },
  header: {
    direction: "ltr",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2A30" },
  content: { paddingHorizontal: 14, paddingBottom: 24 },
  card: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#DDE6EA",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2A30" },
  mediaCount: { fontSize: 12, color: "#8A969D" },
  uploadBox: {
    width: 74,
    height: 74,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#2E908F",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  cameraCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#2E908F",
    justifyContent: "center",
    alignItems: "center",
  },
  imageWrap: { marginRight: 10, position: "relative" },
  mediaImage: {
    width: 74,
    height: 74,
    borderRadius: 10,
    backgroundColor: "#E8EEF1",
  },
  removeBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#FFF",
    borderRadius: 12,
  },
  inputLabel: { marginTop: 9, marginBottom: 5, fontSize: 12, color: "#6E7B84" },
  input: {
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F2F6F6",
    borderWidth: 1,
    borderColor: "#E1E8EB",
    paddingHorizontal: 12,
    color: "#1F2A30",
  },
  textArea: { height: 78, textAlignVertical: "top", paddingTop: 10 },
  inputPicker: {
    height: 42,
    borderRadius: 8,
    backgroundColor: "#F2F6F6",
    borderWidth: 1,
    borderColor: "#E1E8EB",
    paddingHorizontal: 12,
    justifyContent: "center",
  },
  addSpec: { fontSize: 12, color: "#2E908F", fontWeight: "600" },
  specCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E6ECEF",
    backgroundColor: "#F7FAFA",
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  specLabel: { fontSize: 12, color: "#6E7B84" },
  specValue: {
    fontSize: 13,
    color: "#1F2A30",
    fontWeight: "600",
    marginTop: 1,
  },
  emptySpec: { marginTop: 8, fontSize: 12, color: "#8A969D" },
  activeLabel: { fontSize: 14, fontWeight: "600", color: "#1F2A30" },
  activeSub: { fontSize: 11, color: "#8A969D", marginTop: 2 },
  footerRow: { flexDirection: "row", marginTop: 2 },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.3,
    borderColor: "#F09AA0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    backgroundColor: "#FFF7F7",
  },
  cancelText: { color: "#E36570", fontWeight: "700" },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#2E908F",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  saveText: { color: "#FFF", fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: { backgroundColor: "#FFF", borderRadius: 14, padding: 16 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#003D4D" },
  modalInputRow: { flexDirection: "row", marginTop: 14, gap: 10 },
  modalInput: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CFD9DE",
    paddingHorizontal: 12,
    fontSize: 17,
    color: "#1F2A30",
  },
  modalActions: { flexDirection: "row", marginTop: 16, gap: 10 },
  modalCancel: {
    flex: 1,
    height: 52,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#2E908F",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: { color: "#2E908F", fontSize: 16, fontWeight: "700" },
  modalSave: {
    flex: 1,
    height: 52,
    borderRadius: 20,
    backgroundColor: "#2E908F",
    justifyContent: "center",
    alignItems: "center",
  },
  modalSaveText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  categoryItem: {
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F4",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryText: { fontSize: 15, color: "#1F2A30" },
});
