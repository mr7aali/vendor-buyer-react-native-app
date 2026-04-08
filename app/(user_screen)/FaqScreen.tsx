import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  LayoutAnimation,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";



/* ---------------- FAQ ITEM TYPES ---------------- */
interface FaqItemProps {
  question: string;
  answer: string;
  isExpanded: boolean;
  onToggle: () => void;
}

const FaqItem: React.FC<FaqItemProps> = ({
  question,
  answer,
  isExpanded,
  onToggle,
}) => {
  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity
        style={styles.questionRow}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text
          style={[styles.questionText, isExpanded && styles.activeQuestion]}
        >
          {question}
        </Text>

        <MaterialCommunityIcons
          name={isExpanded ? "chevron-up" : "chevron-right"}
          size={24}
          color={isExpanded ? "#2D8282" : "#555"}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}

      <View style={styles.separator} />
    </View>
  );
};

const FaqScreen = () => {
  const [expandedId, setExpandedId] = useState<number | null>(1);

  const faqData = [
    {
      id: 1,
      question: "1. How do I book a delivery?",
      answer:
        "Select your service, pick a date & time, and confirm. You'll get a notification with details.",
    },
    {
      id: 2,
      question: "2. What items can I send?",
      answer:
        "You can send documents, clothes, electronics, and small household items within our weight limit.",
    },
    {
      id: 3,
      question: "3. What items are not allowed?",
      answer:
        "Hazardous materials, illegal goods, and fragile items without proper packaging are not allowed.",
    },
    {
      id: 4,
      question: "4. How much does delivery cost?",
      answer:
        "Cost depends on the distance and weight of the items. You can see the estimate before booking.",
    },
    {
      id: 5,
      question: "5. Can I negotiate the delivery price?",
      answer:
        "Our prices are fixed and calculated by our system to ensure fairness for everyone.",
    },
    {
      id: 6,
      question: "6. How do I track my delivery?",
      answer:
        "Go to the 'My Orders' section and click on your active delivery to see real-time tracking.",
    },
  ];

  const handleToggle = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace("/(user_screen)/HelpSupportScreen")}
        >
          <MaterialCommunityIcons name="chevron-left" size={30} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Faq</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {faqData.map((item) => (
          <FaqItem
            key={item.id}
            question={item.question}
            answer={item.answer}
            isExpanded={expandedId === item.id}
            onToggle={() => handleToggle(item.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAF9",
  },
  header: {
    direction: 'ltr',
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  backBtn: {
    padding: 5,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  faqContainer: {
    marginBottom: 5,
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
  },
  questionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#34495E",
    flex: 1,
    paddingRight: 10,
  },
  activeQuestion: {
    color: "#2D8282",
  },
  answerContainer: {
    paddingBottom: 15,
    paddingRight: 10,
  },
  answerText: {
    fontSize: 14,
    color: "#7F8C8D",
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#ECF0F1",
  },
});

export default FaqScreen;
