import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from '@/hooks/use-translation';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HelpScreen = () => {
  const { t } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  const handleBack = () => {
    router.back();
  };

  const faqData = [
    {
      id: 1,
      question: t("help_q1", "How do I track my delivery?"),
      answer: t("help_a1", "You can track your delivery by going to the 'Orders' tab and selecting your active order. You'll see real-time updates on your delivery status, including the driver's location and estimated arrival time.")
    },
    {
      id: 2,
      question: t("help_q2", "What payment methods do you accept?"),
      answer: t("help_a2", "We accept various payment methods including credit/debit cards, digital wallets, and cash on delivery. You can select your preferred payment method during checkout.")
    },
    {
      id: 3,
      question: t("help_q3", "How can I cancel my order?"),
      answer: t("help_a3", "You can cancel your order from the order details page if it hasn't been picked up yet. Go to 'Orders', select the order, and tap 'Cancel Order'. Refunds will be processed according to our cancellation policy.")
    },
    {
      id: 4,
      question: t("help_q4", "What are your delivery hours?"),
      answer: t("help_a4", "Our delivery hours are from 8:00 AM to 10:00 PM, Monday through Sunday. However, specific restaurant hours may vary. You can check individual restaurant timings when ordering.")
    },
    {
      id: 5,
      question: t("help_q5", "How do I report an issue with my order?"),
      answer: t("help_a5", "If you have any issues with your order, please contact our support team through the 'Help' section or email us at support@example.com. We'll respond within 24 hours.")
    },
    {
      id: 6,
      question: t("help_q6", "Can I schedule a delivery for later?"),
      answer: t("help_a6", "Yes! You can schedule deliveries up to 7 days in advance. During checkout, select 'Schedule Delivery' and choose your preferred date and time slot.")
    }
  ];

  const toggleExpand = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
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
          <Text style={{ fontSize: 18, fontWeight: '600' }}>{t("help", "Help")}</Text>
          <View style={{ width: 24 }} />
        </View>
        {/* Body */}
        <ScrollView>
          {faqData.map((item, index) => (
            <View key={item.id} style={{ marginVertical: 5 }}>
              <TouchableOpacity
                onPress={() => toggleExpand(item.id)}
                style={{
                  paddingVertical: 16,
                  marginHorizontal: 20,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937', marginRight: 12 }}>
                    {index + 1}.
                  </Text>
                  <Text style={{ fontSize: 16, color: '#1F2937', flex: 1 }}>
                    {item.question}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color="#6B7280"
                  style={{ transform: [{ rotate: expandedItem === item.id ? '90deg' : '0deg' }] }}
                />
              </TouchableOpacity>

              {expandedItem === item.id && (
                <View style={{
                  paddingVertical: 16,
                  marginHorizontal: 20,
                  borderBottomWidth: 1,
                  borderBottomColor: '#E5E7EB',
                }}>
                  <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 20 }}>
                    {item.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
}

export default HelpScreen
