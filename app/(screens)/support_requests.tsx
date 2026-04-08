import { images } from '@/constants/import_images'
import { useTranslation } from '@/hooks/use-translation'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SupportRequests = () => {
    const { t } = useTranslation();
    const [selectedIssue, setSelectedIssue] = useState('support_issue_vehicle_not_clean');
    const [complaint, setComplaint] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    const issueOptions = [
        'support_issue_vehicle_not_clean',
        'support_issue_driver_behavior',
        'support_issue_late_delivery',
        'support_issue_wrong_order',
        'support_issue_payment_issue',
        'support_issue_other'
    ];

    const handleBack = () => {
        router.back();
    };

    const handleSubmit = () => {
        // Handle form submission
        console.log('Support Request:', { issue: selectedIssue, complaint });
        // You can add API call here
        Alert.alert(t("success", "Success"), t("support_submitted_success", "Support request submitted successfully!"));
        // Reset form
        setComplaint('');
        setSelectedIssue('support_issue_vehicle_not_clean');
    };

    return (
        <SafeAreaView>
            <View>
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
                    <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("support_requests", "Support Requests")}</Text>
                    <View style={{ width: 24 }} />
                </View>
                {/* Body */}
                <ScrollView style={{ paddingHorizontal: 20, paddingTop: 40 }}>
                    {/* Logo */}
                    <View style={{ alignItems: 'center', marginBottom: 18 }}>
                        <Image
                            source={images.send_admin}
                        // style={{ width: 100, height: 100 }}
                        />
                    </View>

                    {/* Description */}
                    <Text style={{
                        fontSize: 16,
                        color: '#374151',
                        textAlign: 'center',
                        marginBottom: 18,
                        paddingHorizontal: 20,
                        lineHeight: 24,
                    }}>
                        {t("support_desc", "If you face any kind of problem with our service feel free to contact us.")}
                    </Text>

                    {/* Issue Type Dropdown */}
                    <View style={{ marginBottom: 18 }}>
                        <TouchableOpacity
                            onPress={() => setShowDropdown(!showDropdown)}
                            style={{
                                backgroundColor: '#e6f1ef',
                                borderRadius: 12,
                                paddingHorizontal: 20,
                                paddingVertical: 16,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                borderWidth: 1,
                                borderColor: '#b8b9b9',
                            }}
                        >
                            <Text style={{ fontSize: 16, color: selectedIssue === 'support_issue_vehicle_not_clean' ? '#9CA3AF' : '#1F2937' }}>
                                {t(selectedIssue, "Vehicle not clean")}
                            </Text>
                            <MaterialIcons
                                name="keyboard-arrow-down"
                                size={24}
                                color="#6B7280"
                                style={{ transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
                            />
                        </TouchableOpacity>

                        {showDropdown && (
                            <View style={{
                                backgroundColor: '#FFFFFF',
                                borderRadius: 12,
                                marginTop: 8,
                                maxHeight: 200,
                            }}>
                                {issueOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => {
                                            setSelectedIssue(option);
                                            setShowDropdown(false);
                                        }}
                                        style={{
                                            paddingHorizontal: 20,
                                            paddingVertical: 14,
                                            borderBottomWidth: index < issueOptions.length - 1 ? 1 : 0,
                                            borderBottomColor: '#E5E7EB',
                                        }}
                                    >
                                        <Text style={{ fontSize: 16, color: '#1F2937' }}>
                                            {t(option, option)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}
                    </View>

                    {/* Complaint Text Input */}
                    <View style={{ marginBottom: 18 }}>
                        <TextInput
                            placeholder={t("support_write_complaint", "Write your complain here")}
                            placeholderTextColor="#9CA3AF"
                            multiline
                            numberOfLines={6}
                            value={complaint}
                            onChangeText={setComplaint}
                            textAlignVertical="top"
                            style={{
                                backgroundColor: '#e6f1ef',
                                borderRadius: 12,
                                paddingHorizontal: 20,
                                paddingVertical: 16,
                                fontSize: 16,
                                color: '#1F2937',
                                minHeight: 120,
                                borderWidth: 1,
                                borderColor: '#b8b9b9',
                            }}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        style={{
                            backgroundColor: '#278687',
                            borderRadius: 12,
                            paddingVertical: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 40,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 3,
                        }}
                    >
                        <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                            {t("support_send_admin", "Send to admin")}
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        </SafeAreaView>
    )
}

export default SupportRequests
