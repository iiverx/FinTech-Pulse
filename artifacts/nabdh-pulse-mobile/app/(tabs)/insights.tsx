import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSavingsWallet } from '@/context/SavingsWalletContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function InsightIcon({ type }: { type: 'trending-up' | 'target' | 'star' }) {
  if (type === 'trending-up') return <Ionicons name="trending-up" size={20} color="#16A34A" />;
  if (type === 'target') return <Ionicons name="flag" size={20} color="#1D4ED8" />;
  return <Ionicons name="star" size={20} color="#D97706" />;
}

const REPORT_ICONS = ['briefcase', 'wallet', 'stats-chart', 'layers', 'card', 'flag'] as const;
const REPORT_COLORS = ['#1D4ED8', '#16A34A', '#7C3AED', '#D97706', '#0891B2', '#DC2626'] as const;
const REPORT_BGS = ['#EFF6FF', '#F0FDF4', '#F5F3FF', '#FFFBEB', '#ECFEFF', '#FEF2F2'] as const;

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, getMonthlyReport, getInsights, level, progressPct } = useSavingsWallet();

  const report = getMonthlyReport();
  const insights = getInsights();

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n);

  const reportItems = [
    { label: 'إجمالي الدخل', value: fmt(report.totalIncome) + ' ر.س' },
    { label: 'إجمالي الادخار', value: fmt(report.totalSaved) + ' ر.س' },
    { label: 'نسبة الادخار', value: report.savingPercent + '%' },
    { label: 'عدد العمليات', value: String(report.actionCount) },
    { label: 'الرصيد المتبقي', value: fmt(report.remainingBalance) + ' ر.س' },
    { label: 'نسبة الهدف', value: report.goalProgress + '%' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingHorizontal: 16,
          paddingBottom: botPad + 100,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="sparkles" size={22} color="#D97706" />
          <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
            رؤى ذكية
          </Text>
        </View>

        {/* Monthly report card */}
        <View style={[styles.reportCard, { backgroundColor: colors.dark ?? '#0F172A' }]}>
          <View style={styles.reportHeader}>
            <Ionicons name="calendar-outline" size={18} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.reportTitle, { fontFamily: 'Tajawal_700Bold' }]}>
              التقرير الشهري
            </Text>
          </View>
          <View style={styles.reportGrid}>
            {reportItems.map((item, i) => (
              <View
                key={i}
                style={[styles.reportCell, { backgroundColor: REPORT_BGS[i] + '18' }]}
              >
                <View style={[styles.reportCellIcon, { backgroundColor: REPORT_COLORS[i] + '28' }]}>
                  <Ionicons name={REPORT_ICONS[i]} size={16} color={REPORT_COLORS[i]} />
                </View>
                <Text style={[styles.reportValue, { color: REPORT_COLORS[i], fontFamily: 'Tajawal_800ExtraBold' }]}>
                  {item.value}
                </Text>
                <Text style={[styles.reportLabel, { fontFamily: 'Tajawal_400Regular' }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Saving rate visual */}
        {report.savingPercent > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
                معدل الادخار
              </Text>
            </View>
            <View style={styles.rateRow}>
              <View style={[styles.rateBar, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.rateBarFill,
                    {
                      width: `${report.savingPercent}%` as any,
                      backgroundColor: report.savingPercent >= 20 ? colors.secondary : '#D97706',
                    },
                  ]}
                />
              </View>
              <Text style={[styles.ratePct, { color: report.savingPercent >= 20 ? colors.secondary : '#D97706', fontFamily: 'Tajawal_800ExtraBold' }]}>
                {report.savingPercent}%
              </Text>
            </View>
            <Text style={[styles.rateHint, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              {report.savingPercent >= 20
                ? 'ممتاز! تدخر أكثر من 20% من دخلك'
                : 'استهدف 20% من دخلك لنتائج أفضل'}
            </Text>
          </View>
        )}

        {/* Smart insights */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
          توصيات شخصية
        </Text>
        <View style={styles.insightsList}>
          {insights.map((ins) => (
            <View
              key={ins.id}
              style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <View style={[styles.insightIconWrap, { backgroundColor: colors.muted }]}>
                <InsightIcon type={ins.icon} />
              </View>
              <Text style={[styles.insightText, { color: colors.foreground, fontFamily: 'Tajawal_500Medium' }]}>
                {ins.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Goal projection card */}
        {state.goal > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="flag-outline" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
                تقدم الهدف
              </Text>
            </View>

            {/* Circular-ish progress */}
            <View style={styles.goalCenter}>
              <View style={[styles.goalCircle, { borderColor: colors.primary + '22' }]}>
                <View
                  style={[
                    styles.goalCircleInner,
                    {
                      backgroundColor:
                        progressPct >= 100 ? colors.secondary : colors.primary,
                    },
                  ]}
                >
                  <Text style={[styles.goalPct, { fontFamily: 'Tajawal_800ExtraBold' }]}>
                    {progressPct}%
                  </Text>
                </View>
              </View>
              <View style={styles.goalDetails}>
                <Text style={[styles.goalDetailLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
                  المبلغ المحفوظ
                </Text>
                <Text style={[styles.goalDetailValue, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
                  {fmt(state.balance)} ر.س
                </Text>
                <Text style={[styles.goalDetailLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular', marginTop: 8 }]}>
                  المبلغ المستهدف
                </Text>
                <Text style={[styles.goalDetailValue, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
                  {fmt(state.goal)} ر.س
                </Text>
              </View>
            </View>

            {progressPct >= 100 && (
              <View style={[styles.goalComplete, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="trophy" size={18} color="#16A34A" />
                <Text style={[styles.goalCompleteText, { color: '#166534', fontFamily: 'Tajawal_700Bold' }]}>
                  تهانينا! حققت هدفك!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tips */}
        <View style={[styles.card, { backgroundColor: '#1D4ED8' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="bulb-outline" size={18} color="rgba(255,255,255,0.8)" />
            <Text style={[styles.cardTitle, { color: '#fff', fontFamily: 'Tajawal_700Bold' }]}>
              نصيحة اليوم
            </Text>
          </View>
          <Text style={[styles.tipText, { fontFamily: 'Tajawal_400Regular' }]}>
            "أفضل وقت لبدء الادخار كان أمس. ثاني أفضل وقت هو الآن."
          </Text>
          <Text style={[styles.tipAuthor, { fontFamily: 'Tajawal_400Regular' }]}>
            — وارن بافيت
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  screenTitle: { fontSize: 22, textAlign: 'right' },
  sectionTitle: { fontSize: 16, textAlign: 'right', marginBottom: 12, marginTop: 4 },

  // Report card (dark)
  reportCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  reportHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reportTitle: { color: '#fff', fontSize: 16 },
  reportGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
  },
  reportCell: {
    width: (SCREEN_WIDTH - 72) / 3,
    borderRadius: 12,
    padding: 10,
    alignItems: 'flex-end',
  },
  reportCellIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  reportValue: { fontSize: 14, textAlign: 'right' },
  reportLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 10, textAlign: 'right', marginTop: 2 },

  // Generic card
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 15 },

  // Rate bar
  rateRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginBottom: 8 },
  rateBar: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  rateBarFill: { height: 12, borderRadius: 6 },
  ratePct: { fontSize: 20, minWidth: 52, textAlign: 'left' },
  rateHint: { fontSize: 12, textAlign: 'right' },

  // Insights
  insightsList: { gap: 10, marginBottom: 16 },
  insightCard: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  insightIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  insightText: { flex: 1, fontSize: 13, lineHeight: 20, textAlign: 'right' },

  // Goal section
  goalCenter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 20,
    marginBottom: 12,
  },
  goalCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalCircleInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPct: { color: '#fff', fontSize: 20 },
  goalDetails: { flex: 1, alignItems: 'flex-end' },
  goalDetailLabel: { fontSize: 11, textAlign: 'right' },
  goalDetailValue: { fontSize: 18, textAlign: 'right' },
  goalComplete: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
  },
  goalCompleteText: { fontSize: 14 },

  // Tip
  tipText: { color: 'rgba(255,255,255,0.9)', fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: 8 },
  tipAuthor: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'right' },
});
