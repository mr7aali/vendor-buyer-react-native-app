import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/hooks/use-translation'
import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PrivacyPolicy = () => {
    const { t } = useTranslation();
    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={{ flex: 1 }}>

                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 20,
                }}>
                    <TouchableOpacity onPress={() => handleBack()}>
                        <MaterialIcons name="arrow-back-ios-new" size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("privacy_policy", "Privacy Policy")}</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Body */}
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 20 }}>
                            {t("privacy_heading", "Privacy & Policy")}
                        </Text>

                        <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24, marginBottom: 30 }}>
                            {t("privacy_intro", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.")}
                        </Text>

                        <View style={{ marginBottom: 25 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("privacy_section_1_title", "1. Information we collect")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("privacy_section_1_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>

                        <View style={{ marginBottom: 25 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("privacy_section_2_title", "2. How We Use Your Information")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("privacy_section_2_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>

                        <View style={{ marginBottom: 40 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("privacy_section_3_title", "3. Information Sharing")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("privacy_section_3_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default PrivacyPolicy
