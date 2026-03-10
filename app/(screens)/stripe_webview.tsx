import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

type FlowMode = 'connect' | 'payment';

export default function StripeWebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    url?: string | string[];
    flow?: string | string[];
    title?: string | string[];
  }>();
  const [isLoading, setIsLoading] = useState(true);

  const checkoutUrl = useMemo(() => {
    const raw = Array.isArray(params.url) ? params.url[0] : params.url;
    return raw ? decodeURIComponent(raw) : '';
  }, [params.url]);

  const flow = (Array.isArray(params.flow) ? params.flow[0] : params.flow) as FlowMode | undefined;
  const title = Array.isArray(params.title) ? params.title[0] : params.title;

  const handleResolvedUrl = (url: string) => {
    if (url.includes('payment/success')) {
      router.replace('/(user_screen)/OrderAcceptedScreen');
      return true;
    }

    if (url.includes('payment/cancel')) {
      Alert.alert('Payment Canceled', 'You canceled the payment.');
      router.back();
      return true;
    }

    return false;
  };

  if (!checkoutUrl) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Stripe URL is missing.</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title || 'Stripe'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.webContainer}>
        <WebView
          source={{ uri: checkoutUrl }}
          javaScriptEnabled
          domStorageEnabled
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          startInLoadingState
          setSupportMultipleWindows={false}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={(navState) => {
            if (flow === 'payment') {
              handleResolvedUrl(navState.url);
            }
          }}
          onShouldStartLoadWithRequest={(request) => {
            if (flow === 'payment') {
              return !handleResolvedUrl(request.url);
            }

            return true;
          }}
        />
        {isLoading && (
          <View style={styles.loaderOverlay}>
            <ActivityIndicator size="large" color="#635BFF" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    direction: 'ltr',
    height: 52,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  headerButton: {
    minWidth: 52,
  },
  headerButtonText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 52,
  },
  webContainer: {
    flex: 1,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  errorText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 12,
  },
  closeButton: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
