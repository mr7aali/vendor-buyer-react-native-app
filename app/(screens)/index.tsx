import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "../../hooks/use-translation";

export default function AddProduct() {
  const { t } = useTranslation();
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [showSpecInputs, setShowSpecInputs] = useState(false);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>([]);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          t("permission_required", "Permission required"),
          t("need_photos_permission", "We need access to your photos to upload images.")
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert(t("error", "Error"), t("failed_pick_image", "Failed to pick image. Please try again."));
    }
  };

  const removeImage = () => {
    setImage(null);
  };

  const validateForm = () => {
    if (!productName.trim()) {
      Alert.alert(t("validation_error", "Validation Error"), t("please_enter_product_name", "Please enter product name"));
      return false;
    }
    if (!description.trim()) {
      Alert.alert(t("validation_error", "Validation Error"), t("please_enter_product_description", "Please enter product description"));
      return false;
    }
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert(t("validation_error", "Validation Error"), t("please_enter_valid_price", "Please enter a valid price"));
      return false;
    }
    if (!image) {
      Alert.alert(t("validation_error", "Validation Error"), t("please_upload_product_image", "Please upload a product image"));
      return false;
    }
    return true;
  };

  const handleCancel = () => {
    if (
      productName ||
      description ||
      price ||
      category ||
      image ||
      specs.length > 0
    ) {
      Alert.alert(
        t("discard_changes", "Discard Changes"),
        t("discard_changes_confirm", "Are you sure you want to discard all changes?"),
        [
          {
            text: t("cancel", "Cancel"),
            style: "cancel",
          },
          {
            text: t("discard", "Discard"),
            style: "destructive",
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleAddProduct = async () => {
    if (!validateForm()) {
      return;
    }

    const productData = {
      productName: productName.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim() || null,
      image: image,
      specifications: specs,
      isActive: isActive,
      createdAt: new Date().toISOString(),
    };

    console.log("Product data ready for API:", productData);

    Alert.alert(
      t("success", "Success"),
      t("product_ready_for_api", "Product data is ready for API submission!"),
      [
      {
        text: t("ok", "OK"),
        onPress: () => router.back(),
      },
      ]
    );
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setSpecs([...specs, { key: specKey.trim(), value: specValue.trim() }]);
      setSpecKey("");
      setSpecValue("");
      setShowSpecInputs(false);
    } else {
      Alert.alert(
        t("validation_error", "Validation Error"),
        t("please_enter_spec_key_value", "Please enter both key and value for specification")
      );
    }
  };

  const removeSpecification = (index: number) => {
    const newSpecs = specs.filter((_, i) => i !== index);
    setSpecs(newSpecs);
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        marginLeft: 20,
        marginRight: 20,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 12,
        }}
      >
        <TouchableOpacity onPress={handleCancel}>
          <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "600" }}>{t("add_product", "Add Product")}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Product Image Upload */}
        <View
          style={{
            padding: 16,
            marginBottom: 20,
            backgroundColor: "#FFF",
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: 16,
            }}
          >
            {t("product_image_required", "Product Image *")}
          </Text>

          <TouchableOpacity
            onPress={pickImage}
            style={{
              height: 160,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderStyle: "dashed",
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: image ? "transparent" : "#F9FAFB",
              overflow: "hidden",
            }}
          >
            {image ? (
              <>
                <Image
                  source={{ uri: image }}
                  style={{
                    width: "100%",
                    height: "100%",
                    resizeMode: "cover",
                  }}
                />
                <TouchableOpacity
                  onPress={removeImage}
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    borderRadius: 16,
                    width: 32,
                    height: 32,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="close" size={20} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#F3F4F6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <MaterialIcons name="add-a-photo" size={24} color="#6B7280" />
                </View>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#6B7280",
                    fontWeight: "500",
                    marginBottom: 4,
                  }}
                >
                  {t("upload_image", "Upload Image")}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#9CA3AF",
                  }}
                >
                  {t("tap_select_gallery", "Tap to select from gallery")}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Product Details */}
        <View
          style={{
            padding: 16,
            marginBottom: 20,
            backgroundColor: "#FFF",
            borderRadius: 12,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: 20,
            }}
          >
            {t("product_details", "Product Details")}
          </Text>

          {/* Product Name */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#4B5563",
                marginBottom: 8,
                fontWeight: "500",
              }}
            >
              {t("product_name_required", "Product Name *")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                color: "#1F2937",
                backgroundColor: "#FFF",
              }}
              placeholder={t("enter_product_name", "Enter product name")}
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* Description */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#4B5563",
                marginBottom: 8,
                fontWeight: "500",
              }}
            >
              {t("description_required", "Description *")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                color: "#1F2937",
                backgroundColor: "#FFF",
                height: 100,
                textAlignVertical: "top",
              }}
              placeholder={t("enter_product_description", "Enter product description")}
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Price */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#4B5563",
                marginBottom: 8,
                fontWeight: "500",
              }}
            >
              {t("price_required", "Price *")}
            </Text>
            <View style={{ position: "relative" }}>
              <Text
                style={{
                  position: "absolute",
                  left: 12,
                  top: 12,
                  fontSize: 15,
                  color: "#6B7280",
                  zIndex: 1,
                }}
              >
                $
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  paddingLeft: 32,
                  fontSize: 15,
                  color: "#1F2937",
                  backgroundColor: "#FFF",
                }}
                placeholder={t("price_placeholder", "0.00")}
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Category */}
          <View style={{ marginBottom: 0 }}>
            <Text
              style={{
                fontSize: 14,
                color: "#4B5563",
                marginBottom: 8,
                fontWeight: "500",
              }}
            >
              {t("category", "Category")}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 12,
                fontSize: 15,
                color: "#1F2937",
                backgroundColor: "#FFF",
              }}
              placeholder={t("enter_category_optional", "Enter category (optional)")}
              placeholderTextColor="#9CA3AF"
              value={category}
              onChangeText={setCategory}
            />
          </View>
        </View>

        {/* Specification */}
        <View
          style={{
            padding: 16,
            marginBottom: 20,
            backgroundColor: "#FFF",
            borderRadius: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937",
              }}
            >
              {t("specifications", "Specifications")}
            </Text>
            {!showSpecInputs && (
              <TouchableOpacity onPress={() => setShowSpecInputs(true)}>
                <Text style={{ color: "#278687", fontWeight: "500" }}>
                  {t("add_with_plus", "+ Add")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {showSpecInputs && (
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: "#1F2937",
                      backgroundColor: "#FFF",
                    }}
                    placeholder={t("spec_key_example", "Key (e.g., Color)")}
                    placeholderTextColor="#9CA3AF"
                    value={specKey}
                    onChangeText={setSpecKey}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      borderRadius: 8,
                      padding: 12,
                      fontSize: 15,
                      color: "#1F2937",
                      backgroundColor: "#FFF",
                    }}
                    placeholder={t("spec_value_example", "Value (e.g., Red)")}
                    placeholderTextColor="#9CA3AF"
                    value={specValue}
                    onChangeText={setSpecValue}
                    onSubmitEditing={addSpecification}
                  />
                </View>
              </View>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  gap: 8,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowSpecInputs(false);
                    setSpecKey("");
                    setSpecValue("");
                  }}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "#6B7280", fontWeight: "500" }}>
                    {t("cancel", "Cancel")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={addSpecification}
                  style={{
                    backgroundColor: "#278687",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "500" }}>{t("add", "Add")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {specs.length > 0 ? (
            specs.map((spec, index) => (
              <View
                key={index}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                  padding: 12,
                  backgroundColor: "#F9FAFB",
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <View
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#1F2937",
                      marginRight: 8,
                    }}
                  >
                    {spec.key}:
                  </Text>
                  <Text
                    style={{
                      color: "#6B7280",
                      fontSize: 14,
                    }}
                  >
                    {spec.value}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => removeSpecification(index)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: "#E5E7EB",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MaterialIcons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View
              style={{
                padding: 16,
                backgroundColor: "#F9FAFB",
                borderRadius: 8,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#9CA3AF", fontSize: 14 }}>
                {t("no_specifications_added", "No specifications added")}
              </Text>
            </View>
          )}
        </View>

        {/* Active Status */}
        <View
          style={{
            padding: 16,
            marginBottom: 20,
            backgroundColor: "#FFF",
            borderRadius: 12,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  color: "#1F2937",
                  fontWeight: "600",
                  marginBottom: 4,
                }}
              >
                {t("active_status", "Active Status")}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6B7280",
                }}
              >
                {t("show_product_in_store", "Show product in store")}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#E5E7EB", true: "#278687" }}
              thumbColor="#FFFFFF"
              onValueChange={setIsActive}
              value={isActive}
            />
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "transparent",
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            flex: 1,
            borderColor: "#278687",
            borderWidth: 1,
          }}
          onPress={handleCancel}
        >
          <Text
            style={{
              color: "#278687",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {t("cancel", "Cancel")}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            backgroundColor: "#278687",
            borderRadius: 8,
            padding: 16,
            alignItems: "center",
            flex: 1,
          }}
          onPress={handleAddProduct}
        >
          <Text
            style={{
              color: "#FFF",
              fontSize: 16,
              fontWeight: "600",
            }}
          >
            {t("add_product", "Add Product")}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
