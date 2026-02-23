import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PermissionScreen = () => {
    const { language, t } = useTranslation();
    const [permissions, setPermissions] = useState({
        camera: true,
        photos: true,
        location: false,
        notifications: true,
        microphone: false,
        contacts: false,
        storage: true,
        calendar: false
    });

    const labels = React.useMemo(() => {
        if (language === "he") {
            return {
                locationAccess: "גישה למיקום",
                allowLocation: "אפשר גישה למיקום שלך",
                allowNotifications: "אפשר התראות",
                allowPush: "אפשר התראות דחיפה",
                cameraAccess: "גישה למצלמה",
                allowCamera: "אפשר גישה למצלמה לצילום",
            };
        }
        if (language === "hi") {
            return {
                locationAccess: "लोकेशन एक्सेस",
                allowLocation: "आपकी लोकेशन तक पहुंच की अनुमति दें",
                allowNotifications: "नोटिफिकेशन की अनुमति दें",
                allowPush: "पुश नोटिफिकेशन की अनुमति दें",
                cameraAccess: "कैमरा एक्सेस",
                allowCamera: "फोटो लेने के लिए कैमरा एक्सेस दें",
            };
        }
        return {
            locationAccess: "Location Access",
            allowLocation: "Allow access to your location",
            allowNotifications: "Allow Notifications",
            allowPush: "Allow push notifications",
            cameraAccess: "Camera Access",
            allowCamera: "Allow access to camera for taking photos",
        };
    }, [language]);

    const handleBack = () => {
        router.back();
    };

    const togglePermission = (key: keyof typeof permissions) => {
        setPermissions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const permissionItems: { key: keyof typeof permissions; label: string; description: string }[] = [
        { key: 'location', label: labels.locationAccess, description: labels.allowLocation },
        { key: 'notifications', label: labels.allowNotifications, description: labels.allowPush },
        { key: 'camera', label: labels.cameraAccess, description: labels.allowCamera },
    ];

    const ToggleSwitch = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
        <TouchableOpacity
            onPress={onToggle}
            style={{
                width: 48,
                height: 28,
                backgroundColor: enabled ? '#278687' : '#D1D5DB',
                borderRadius: 14,
                justifyContent: 'center',
                alignItems: enabled ? 'flex-end' : 'flex-start',
                paddingRight: enabled ? 6 : 0,
                paddingLeft: enabled ? 0 : 6
            }}
        >
            <View
                style={{
                    width: 20,
                    height: 20,
                    backgroundColor: '#fff',
                    borderRadius: 10,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.2,
                    shadowRadius: 2,
                    elevation: 2
                }}
            />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1 }}>
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
                <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("permission", "Permission")}</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Permission List */}
            <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
            >
                <View style={{ gap: 16 }}>
                    {permissionItems.map((item) => (
                        <View
                            key={item.key}
                            style={{
                                padding: 16,
                            }}
                        >
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <MaterialIcons name={item.key === 'location' ? 'location-on' : item.key === 'notifications' ? 'notifications' : 'camera'} size={24} color="black" />
                                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 }}>
                                        {item.label}
                                    </Text>
                                </View>
                                <ToggleSwitch
                                    enabled={permissions[item.key as keyof typeof permissions]}
                                    onToggle={() => togglePermission(item.key)}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

export default PermissionScreen
