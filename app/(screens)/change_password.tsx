import { useChangePasswordMutation } from '@/store/api/authApiSlice';
import { useTranslation } from '@/hooks/use-translation';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const ChangePasswordScreen = () => {
    const { t } = useTranslation();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changePassword, { isLoading }] = useChangePasswordMutation();

    const handleBack = () => {
        router.back();
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F8FBFB' }}>
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
                <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("change_password", "Change Password")}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10 }}>

                {/* Current Password Field */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 }}>
                        {t("cp_current_password", "Current Password")}
                    </Text>
                    <TextInput
                        placeholder={t("cp_enter_old_password", "Enter old password")}
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={{
                            backgroundColor: '#EBF2F2',
                            borderRadius: 12,
                            paddingHorizontal: 15,
                            paddingVertical: 18,
                            fontSize: 16,
                            color: '#1F2937'
                            , borderWidth: 1,
                            borderColor: "#E3E6F0"
                        }}
                    />
                </View>

                {/* New Password Field */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 }}>
                        {t("cp_new_password", "New Password")}
                    </Text>
                    <TextInput
                        placeholder={t("cp_enter_new_password", "Enter new password")}
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={{
                            backgroundColor: '#EBF2F2',
                            borderRadius: 12,
                            paddingHorizontal: 15,
                            paddingVertical: 18,
                            fontSize: 16,
                            color: '#1F2937', borderWidth: 1,
                            borderColor: "#E3E6F0"
                        }}
                    />
                </View>

                {/* Confirm Password Field */}
                <View style={{ marginBottom: 40 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 10 }}>
                        {t("cp_confirm_password", "Confirm Password")}
                    </Text>
                    <TextInput
                        placeholder={t("cp_reenter_new_password", "Re-enter new password")}
                        placeholderTextColor="#9CA3AF"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        style={{
                            backgroundColor: '#EBF2F2',
                            borderRadius: 12,
                            paddingHorizontal: 15,
                            paddingVertical: 18,
                            fontSize: 16,
                            color: '#1F2937', borderWidth: 1,
                            borderColor: "#E3E6F0"
                        }}
                    />
                </View>

                {/* Update Button */}
                <TouchableOpacity
                    style={{
                        backgroundColor: '#2D8A8A',
                        borderRadius: 15,
                        paddingVertical: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 'auto',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 5,
                        elevation: 3,
                    }}
                    onPress={async () => {
                        if (newPassword !== confirmPassword) {
                            Alert.alert(t("error", "Error"), t("cp_passwords_not_match", "New passwords do not match"));
                            return;
                        }
                        try {
                            // Using the dedicated change-password endpoint
                            await changePassword({
                                oldPassword: currentPassword,
                                newPassword: newPassword
                            }).unwrap();
                            Alert.alert(t("success", "Success"), t("cp_updated_successfully", "Password updated successfully"), [
                                { text: t("ok", "OK"), onPress: () => router.back() }
                            ]);
                        } catch (error: any) {
                            console.error('Password update failed', error);
                            const errorMessage = error?.data?.message || t("cp_failed_update", "Failed to update password");
                            Alert.alert(t("error", "Error"), errorMessage);
                        }
                    }}
                >
                    <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>
                        {isLoading ? t("cp_updating", "Updating...") : t("cp_update_password", "Update password")}
                    </Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

export default ChangePasswordScreen;
