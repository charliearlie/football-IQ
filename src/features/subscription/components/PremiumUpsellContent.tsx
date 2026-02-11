
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useWindowDimensions,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { PurchasesPackage, IntroEligibility } from 'react-native-purchases';
import {
  Zap,
  Ban,
  Star,
  Check,
  X,
} from 'lucide-react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { ElevatedButton } from '@/components/ElevatedButton';
import { colors } from '@/theme/colors';
import { fonts } from '@/theme/typography';
import { processPackagesWithOffers } from '@/features/subscription';
import { ProBadge } from '@/components/ProBadge';

interface PremiumUpsellContentProps {
  onClose: () => void;
  onPurchase: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
  packages: PurchasesPackage[];
  eligibility?: Record<string, IntroEligibility>;
  state: 'loading' | 'selecting' | 'purchasing' | 'success' | 'error';
  errorMessage?: string | null;
  onRetry?: () => void;
  testID?: string;
}

export function PremiumUpsellContent({
  onClose,
  onPurchase,
  onRestore,
  packages,
  eligibility = {},
  state,
  errorMessage,
  onRetry,
  testID,
}: PremiumUpsellContentProps) {
  const { height: screenHeight } = useWindowDimensions();
  const isSmallScreen = screenHeight < 700;

  // Use actual container dimensions for SVG gradients (formSheet on iPad is smaller than screen)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  
  // Best practice: Pre-select Annual (Best Value).
  const processedOffers = React.useMemo(() => processPackagesWithOffers(packages, 'ANNUAL', eligibility), [packages, eligibility]);
  
  const annualOffer = processedOffers.find(o => o.package.packageType === 'ANNUAL');
  const monthlyOffer = processedOffers.find(o => o.package.packageType === 'MONTHLY');

  const [selectedIdentifier, setSelectedIdentifier] = useState<string | null>(null);

  // Auto-select annual if available, else first
  React.useEffect(() => {
    if (packages.length > 0 && !selectedIdentifier) {
        if (annualOffer) setSelectedIdentifier(annualOffer.package.identifier);
        else setSelectedIdentifier(packages[0].identifier);
    }
  }, [packages, annualOffer, selectedIdentifier]);
  
  const handleMainAction = () => {
      const pkg = packages.find(p => p.identifier === selectedIdentifier);
      if (pkg) {
          onPurchase(pkg);
      }
  };

  /**
   * Helper to simple-format currency (e.g. 1.50 -> £1.50).
   * Uses Intl if available, otherwise fallback.
   */
  const formatMonthlyPrice = (price: number, currencyCode: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
      }).format(price);
    } catch (e) {
      return `${currencyCode} ${(price).toFixed(2)}`;
    }
  };

  // Calculate dynamic text for Annual card
  let annualMonthlyText = '';
  let annualBadgeText = '';

  if (annualOffer) {
    // 1. Calculate Monthly Equivalent
    // Use intro price if active, otherwise standard price
    const currentPrice = annualOffer.offer.isOfferActive && annualOffer.package.product.introPrice
      ? annualOffer.package.product.introPrice.price
      : annualOffer.package.product.price;
    
    const monthlyEq = currentPrice / 12;
    // Check if currencyCode exists, otherwise use fallback logic or empty string if crucial
    // Assuming standard PurchasesStoreProduct has currencyCode
    const currencyCode = annualOffer.package.product.currencyCode || 'USD'; // Fallback just in case
    const formattedMonthly = formatMonthlyPrice(monthlyEq, currencyCode);
    annualMonthlyText = `Just ${formattedMonthly} / month`;

    // 2. Badge Text
    if (annualOffer.offer.isOfferActive) {
      // Intro Offer Active -> "LIMITED OFFER • SAVE X%"
      // savingsText from detectOffer is e.g. "Save 44%"
      annualBadgeText = `LIMITED OFFER • ${annualOffer.offer.savingsText.toUpperCase()}`;
    } else if (monthlyOffer) {
      // Standard Price -> Compare vs Monthly for "BEST VALUE"
      // Monthly * 12 vs Annual
      const annualPrice = annualOffer.package.product.price;
      const monthlyPrice = monthlyOffer.package.product.price;
      const annualizedMonthly = monthlyPrice * 12;
      
      if (annualizedMonthly > 0) {
        const savingsVsMonthly = Math.round((1 - annualPrice / annualizedMonthly) * 100);
        if (savingsVsMonthly > 0) {
           annualBadgeText = `BEST VALUE • SAVE ${savingsVsMonthly}%`;
        } else {
           annualBadgeText = 'BEST VALUE';
        }
      } else {
        annualBadgeText = 'BEST VALUE';
      }
    } else {
      annualBadgeText = 'BEST VALUE';
    }
  }

  return (
    <View
      style={styles.container}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
       {/* Background Glows via SVG — sized to container, not screen */}
       {containerSize.width > 0 && (
         <View style={styles.glowContainer} pointerEvents="none">
            <Svg height={containerSize.height} width={containerSize.width} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient
                  id="greenGlow"
                  cx="0"
                  cy="0"
                  rx="50%"
                  ry="30%"
                  fx="0"
                  fy="0"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor="#58CC02" stopOpacity="0.15" />
                  <Stop offset="1" stopColor="#58CC02" stopOpacity="0" />
                </RadialGradient>
                <RadialGradient
                  id="yellowGlow"
                  cx="100%"
                  cy="100%"
                  rx="50%"
                  ry="30%"
                  fx="100%"
                  fy="100%"
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor="#FACC15" stopOpacity="0.1" />
                  <Stop offset="1" stopColor="#FACC15" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect x="0" y="0" width={containerSize.width} height={containerSize.height} fill="url(#greenGlow)" />
              <Rect x="0" y="0" width={containerSize.width} height={containerSize.height} fill="url(#yellowGlow)" />
            </Svg>
         </View>
       )}

       {/* Header */}
       <View style={styles.header}>
        <Pressable
          onPress={onClose}
          hitSlop={20}
          style={styles.closeButton}
          testID={`${testID}-close`}
        >
          <X size={20} color={colors.floodlightWhite} style={{ opacity: 0.7 }} />
        </Pressable>
      </View>

      <ScrollView
         style={styles.scrollView}
         contentContainerStyle={[
            styles.scrollContent,
            isSmallScreen && styles.scrollContentSmall
         ]}
         bounces={false}
         showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
             <View style={styles.trophyWrapper}>
                <ProBadge size={56} color={colors.stadiumNavy} />
             </View>
             
             <Text style={styles.heroTitle}>
                  Football IQ <Text style={{ color: colors.cardYellow }}>PRO</Text>
             </Text>
             <Text style={styles.heroSubtitle}>Join the elite. Unlock the full archive.</Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
            <BenefitRow
                icon={Zap}
                title="UNLIMITED ARCHIVE ACCESS"
                subtitle="Play every puzzle from previous seasons"
            />
            <BenefitRow
                icon={Ban}
                title="AD-FREE EXPERIENCE"
                subtitle="Zero interruptions, pure gameplay"
            />
            <BenefitRow
                icon={Star}
                title="PRO STATS & INSIGHTS"
                subtitle="Coming soon once we have enough data"
            />
        </View>

        {/* Pricing Cards */}
        {state === 'loading' ? (
            <View style={{ padding: 20 }}>
                 <ActivityIndicator color={colors.cardYellow} />
            </View>
        ) : state === 'error' ? (
             <View style={styles.errorContainer}>
                 <Text style={styles.errorText}>{errorMessage}</Text>
                 <Pressable onPress={onRetry}><Text style={styles.retryText}>Try Again</Text></Pressable>
             </View>
        ) : state === 'success' ? (
            <View style={styles.successContainer}>
                <Check size={48} color={colors.pitchGreen} />
                <Text style={styles.successTitle}>WELCOME TO PRO!</Text>
                <Text style={styles.successSubtitle}>You now have full access.</Text>
            </View>
        ) : (
            <View style={styles.plansContainer}>
                 {annualOffer && (
                     <PlanCard
                        title="ANNUAL"
                        price={annualOffer.offer.discountedPriceString} // e.g. $9.99
                        period="/yr"
                        savingsText={annualMonthlyText}
                        originalPrice={annualOffer.offer.originalPriceString}
                        isSelected={selectedIdentifier === annualOffer.package.identifier}
                        onSelect={() => setSelectedIdentifier(annualOffer.package.identifier)}
                        isBestValue
                        badgeText={annualBadgeText}
                     />
                 )}
                 {monthlyOffer && (
                     <PlanCard
                        title="MONTHLY"
                        price={monthlyOffer.offer.discountedPriceString}
                        period="/mo"
                        subtitle="Flexible plan, cancel anytime"
                        isSelected={selectedIdentifier === monthlyOffer.package.identifier}
                        onSelect={() => setSelectedIdentifier(monthlyOffer.package.identifier)}
                     />
                 )}
            </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
         {state !== 'success' && state !== 'purchasing' && (
              <ElevatedButton
                title={state === 'loading' ? "LOADING..." : "UNLOCK FULL ACCESS"}
                onPress={handleMainAction}
                variant="primary"
                size="large" // Ensure this maps to ~52px
                disabled={state === 'loading' || state === 'error' || !selectedIdentifier}
                fullWidth
                testID={`${testID}-subscribe-button`}
                topColor={colors.pitchGreen}
                shadowColor="#46A302"
              />
         )}
         {state === 'purchasing' && (
             <View style={styles.purchasingShim}>
                 <ActivityIndicator color={colors.stadiumNavy} />
                 <Text style={styles.purchasingText}>Processing...</Text>
             </View>
         )}

         <View style={styles.footerLinks}>
              <FooterLink title="RESTORE" onPress={onRestore} />
              <View style={styles.dot} />
              <FooterLink title="TERMS" onPress={() => Linking.openURL('https://football-iq.app/terms')} />
              <View style={styles.dot} />
              <FooterLink title="PRIVACY" onPress={() => Linking.openURL('https://football-iq.app/privacy')} />
         </View>
      </View>
    </View>
  );
}

// Sub-components

function BenefitRow({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) {
    return (
        <View style={styles.benefitRow}>
            <View style={styles.benefitIconBox}>
                <Icon size={16} color={colors.cardYellow} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.benefitTitle} numberOfLines={1}>{title}</Text>
                <Text style={styles.benefitSubtitle} numberOfLines={1}>{subtitle}</Text>
            </View>
        </View>
    );
}

function PlanCard({
    title,
    price,
    period,
    savingsText,
    originalPrice,
    subtitle,
    isSelected,
    onSelect,
    isBestValue,
    badgeText,
}: {
    title: string,
    price: string,
    period: string,
    savingsText?: string,
    originalPrice?: string | null,
    subtitle?: string,
    isSelected: boolean,
    onSelect: () => void,
    isBestValue?: boolean,
    badgeText?: string,
}) {
    return (
        <Pressable onPress={onSelect} style={[styles.planCard, isSelected && styles.planCardSelected]}>
             {isBestValue && badgeText ? (
                 <View style={styles.bestValueBadge}>
                     <Text style={styles.bestValueText}>{badgeText}</Text>
                 </View>
             ) : null}
             
             <View style={styles.planCardContent}>
                 {/* Radio Circle */}
                 <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                     {isSelected && <Check size={10} color={colors.stadiumNavy} strokeWidth={4} />}
                 </View>
                 
                 <View style={{ flex: 1 }}>
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                         <Text style={[styles.planTitle, isSelected ? { color: 'white' } : { color: colors.floodlightWhite }]}>{title}</Text>
                         <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                             <Text style={styles.planPrice}>{price}</Text>
                             <Text style={styles.planPeriod}>{period}</Text>
                         </View>
                     </View>
                     
                     <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                         {savingsText ? (
                             <Text style={styles.savingsText}>{savingsText}</Text>
                         ) : (
                             <Text style={styles.planSubtitle}>{subtitle}</Text>
                         )}
                         
                         {originalPrice && originalPrice !== price && (
                             <Text style={styles.originalPrice}>{originalPrice}</Text>
                         )}
                     </View>
                 </View>
             </View>
        </Pressable>
    )
}

function FooterLink({ title, onPress }: { title: string, onPress: () => void }) {
    return (
        <Pressable onPress={onPress}>
            <Text style={styles.footerLinkText}>{title}</Text>
        </Pressable>
    )
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Stadium Navy
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      alignItems: 'flex-end',
      zIndex: 10,
  },
  closeButton: {
      padding: 8,
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 20,
  },
  scrollContent: {
      paddingTop: 10,
      paddingBottom: 20,
  },
  scrollContentSmall: {
      paddingTop: 0,
      paddingBottom: 10,
  },
  heroSection: {
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
  },
  trophyWrapper: {
      marginBottom: 12,
  },
  trophyGradient: {
      ...StyleSheet.absoluteFillObject,
  },
  heroTitle: {
      fontFamily: fonts.headline,
      fontSize: 36,
      color: '#F8FAFC',
      letterSpacing: 1,
      marginBottom: 4,
      textAlign: 'center',
  },
  heroSubtitle: {
      fontFamily: fonts.body,
      fontWeight: '500',
      fontSize: 14,
      color: 'rgba(248, 250, 252, 0.7)',
      textAlign: 'center',
  },
  benefitsContainer: {
      paddingHorizontal: 20,
      marginBottom: 16,
      gap: 8,
  },
  benefitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 6,
  },
  benefitIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  benefitTitle: {
      fontFamily: fonts.headline,
      fontSize: 18,
      color: '#F8FAFC',
      letterSpacing: 0.5,
  },
  benefitSubtitle: {
      fontFamily: fonts.body,
      fontWeight: '400',
      fontSize: 11,
      color: 'rgba(248, 250, 252, 0.7)',
      marginTop: 2,
  },
  plansContainer: {
      paddingHorizontal: 16,
      gap: 12,
      paddingBottom: 10,
  },
  planCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)',
      padding: 14,
  },
  planCardSelected: {
      backgroundColor: 'rgba(248, 204, 21, 0.1)',
      borderColor: '#FACC15',
      borderWidth: 2,
      padding: 13, // Compensate for border width to keep size same? Or just accept slight growth
  },
  planCardContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
  },
  bestValueBadge: {
      position: 'absolute',
      top: -10,
      right: 16,
      backgroundColor: '#FACC15',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 100,
      zIndex: 5,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
  },
  bestValueText: {
      fontFamily: fonts.headline,
      fontSize: 12,
      color: '#0F172A',
      letterSpacing: 0.5,
      includeFontPadding: false,
  },
  radioCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'rgba(255, 255, 255, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  radioCircleSelected: {
      backgroundColor: '#FACC15',
      borderColor: '#FACC15',
  },
  planTitle: {
      fontFamily: fonts.headline,
      fontSize: 20,
      letterSpacing: 0.5,
  },
  planPrice: {
      fontFamily: fonts.headline,
      fontSize: 20,
      color: '#F8FAFC',
  },
  planPeriod: {
      fontFamily: fonts.body,
      fontWeight: '400',
      fontSize: 10,
      color: 'rgba(248, 250, 252, 0.5)',
      marginLeft: 4,
  },
  savingsText: {
      fontFamily: fonts.body,
      fontWeight: '700', // Bold for impact
      fontSize: 12,
      color: '#FACC15',
  },
  planSubtitle: {
       fontFamily: fonts.body,
       fontWeight: '400',
       fontSize: 10,
       color: 'rgba(248, 250, 252, 0.5)',
  },
  originalPrice: {
      fontFamily: fonts.body,
      fontWeight: '400',
      fontSize: 10,
      color: 'rgba(248, 250, 252, 0.5)',
      textDecorationLine: 'line-through',
  },
  footer: {
      backgroundColor: '#0F172A',
      paddingHorizontal: 20,
      paddingBottom: 16,
      paddingTop: 8,
  },
  footerLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 16,
      gap: 12,
  },
  footerLinkText: {
      fontFamily: fonts.body,
      fontWeight: '500',
      fontSize: 9,
      color: 'rgba(248, 250, 252, 0.4)',
      textTransform: 'uppercase',
  },
  dot: {
      width: 3,
      height: 3,
      borderRadius: 1.5,
      backgroundColor: 'rgba(248, 250, 252, 0.2)',
  },
  purchasingShim: {
      height: 52, // Match button height
      backgroundColor: '#58CC02',
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
  },
  purchasingText: {
       fontFamily: fonts.headline,
       fontSize: 20,
       color: '#0F172A',
  },
  dynamicContent: {
      minHeight: 100,
      justifyContent: 'center',
  },
  centeredState: {
      alignItems: 'center',
      padding: 24,
      gap: 12,
  },
  statusText: {
      fontFamily: fonts.body,
      fontWeight: '600',
      color: colors.floodlightWhite,
      textAlign: 'center',
  },
  errorContainer: {
      padding: 20,
      alignItems: 'center',
      gap: 10,
  },
  errorText: {
      color: colors.redCard,
      textAlign: 'center',
      fontFamily: fonts.body,
      fontWeight: '500',
  },
  retryButton: {
      padding: 10,
  },
  retryText: {
      color: colors.cardYellow,
      textDecorationLine: 'underline',
      fontFamily: fonts.body,
      fontWeight: '600',
  },
  successContainer: {
      alignItems: 'center',
      padding: 24,
      gap: 12,
  },
  successTitle: {
      fontFamily: fonts.headline,
      fontSize: 28,
      color: colors.cardYellow,
      textAlign: 'center',
  },
  successSubtitle: {
      fontFamily: fonts.body,
      fontWeight: '500',
      fontSize: 14,
      color: colors.floodlightWhite,
      textAlign: 'center',
  }
});
