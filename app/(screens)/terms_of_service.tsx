import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from '@/hooks/use-translation'
import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const TermsOfService = () => {
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
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("terms_of_service", "Terms of Service")}</Text>
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
                            {t("terms_heading", "Terms of Service")}
                        </Text>

                        <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24, marginBottom: 30 }}>
                            {t("terms_intro", "By accessing or using this application or service, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you must not use the application or service.")}
                        </Text>

                        <View style={{ marginBottom: 25 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("terms_section_1_title", "1. Use of the Service")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("terms_section_1_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>

                        <View style={{ marginBottom: 25 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("terms_section_2_title", "2. User Responsibilities")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("terms_section_2_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>

                        <View style={{ marginBottom: 40 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("terms_section_3_title", "3. Account & Access")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("terms_section_3_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>
                        <View style={{ marginBottom: 40 }}>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 }}>
                                {t("terms_section_4_title", "4. Limitation of Liability")}
                            </Text>
                            <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 24 }}>
                                {t("terms_section_4_body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.")}
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default TermsOfService
