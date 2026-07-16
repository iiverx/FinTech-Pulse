import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSavingsWallet, walletLevel } from '@/context/SavingsWalletContext';
import { WalletGraphic } from '@/components/WalletGraphic';
import { CoinAnimation } from '@/components/CoinAnimation';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const WALLET_W = SCREEN_WIDTH - 32;
const WALLET_H = Math.round(WALLET_W * 0.6);

const LEVEL_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'محفظة مبتدئة',
  2: 'محفظة نشطة',
  3: 'محفظة ذهبية',
  4: 'محفظة فاخرة ✦',
};

const LEVEL_COLORS: Record<1 | 2 | 3 | 4, [string, string]> = {
  1: ['#92400E', '#78350F'],
  2: ['#B45309', '#92400E'],
  3: ['#D97706', '#B45309'],
  4: ['#F59E0B', '#D97706'],
};

function useAnimatedNumber(target: number) {
  const [display, setDisplay] = useState(target);
  const prev = useRef(target);

  useEffect(() => {
    if (prev.current === target) return;
    const start = prev.current;
    const end = target;
    const diff = end - start;
    const duration = 600;
    const t0 = performance?.now?.() ?? Date.now();

    const step = () => {
      const elapsed = (performance?.now?.() ?? Date.now()) - t0;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) requestAnimationFrame(step);
      else prev.current = end;
    };
    requestAnimationFrame(step);
  }, [target]);

  return display;
}

export default function WalletScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { state, level, progressPct, reset, depositCount, setGoal, addSaving } = useSavingsWallet();

  const [animActive, setAnimActive] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositInput, setDepositInput] = useState('');
  const [depositNote, setDepositNote] = useState('');
  const prevPct = useRef(progressPct);
  const prevDepositCount = useRef(depositCount);

  const displayBalance = useAnimatedNumber(state.balance);

  // Trigger coin animation when a new deposit arrives from any tab
  useEffect(() => {
    if (depositCount > 0 && depositCount !== prevDepositCount.current) {
      prevDepositCount.current = depositCount;
      setAnimActive(true);
    }
  }, [depositCount]);

  // Detect goal completion
  useEffect(() => {
    if (prevPct.current < 100 && progressPct >= 100) {
      setShowCelebration(true);
      const t = setTimeout(() => setShowCelebration(false), 4000);
      return () => clearTimeout(t);
    }
    prevPct.current = progressPct;
  }, [progressPct]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingHorizontal: 16,
          paddingBottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 100,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.appName, { color: colors.primary, fontFamily: 'Tajawal_800ExtraBold' }]}>
              نبض
            </Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              المحفظة الذكية
            </Text>
          </View>
          <View style={[styles.levelBadge, { backgroundColor: LEVEL_COLORS[level][0] }]}>
            <Text style={[styles.levelBadgeText, { fontFamily: 'Tajawal_700Bold' }]}>
              {LEVEL_LABELS[level]}
            </Text>
          </View>
        </View>

        {/* Wallet Card */}
        <View
          style={[
            styles.walletCard,
            { backgroundColor: colors.dark ?? '#0F172A' },
          ]}
        >
          {/* Wallet Graphic */}
          <View style={{ alignItems: 'center', paddingTop: 8 }}>
            <WalletGraphic level={level} pulse width={WALLET_W - 32} height={WALLET_H - 40} />
            <CoinAnimation active={animActive} onDone={() => setAnimActive(false)} />
          </View>

          {/* Balance Overlay */}
          <View style={styles.balanceArea}>
            <Text style={[styles.balanceLabel, { fontFamily: 'Tajawal_400Regular' }]}>
              رصيد المحفظة
            </Text>
            <Text style={[styles.balanceAmount, { fontFamily: 'Tajawal_800ExtraBold' }]}>
              {fmt(displayBalance)} ر.س
            </Text>
          </View>

          {/* Level indicator */}
          <View style={[styles.levelTag, { backgroundColor: LEVEL_COLORS[level][0] + 'dd' }]}>
            <Text style={[styles.levelTagText, { fontFamily: 'Tajawal_700Bold' }]}>
              المستوى {level}
            </Text>
          </View>

          {/* Celebration overlay */}
          {showCelebration && (
            <View style={styles.celebration}>
              <Ionicons name="trophy" size={48} color="#FFD700" />
              <Text style={[styles.celebrationText, { fontFamily: 'Tajawal_800ExtraBold' }]}>
                مبروك! وصلت إلى هدف الادخار!
              </Text>
            </View>
          )}
        </View>

        {/* Goal Progress */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.goalHeader}>
            <View style={styles.row}>
              <Ionicons name="flag" size={18} color={colors.primary} />
              <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
                هدف الادخار
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={[styles.pctText, { color: colors.primary, fontFamily: 'Tajawal_800ExtraBold' }]}>
                {progressPct}%
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setGoalInput(String(state.goal));
                  setShowGoalModal(true);
                }}
                style={[styles.editBtn, { backgroundColor: colors.muted }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.mutedForeground} />
                <Text style={[styles.editBtnText, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
                  تعديل
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct}%` as any,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </View>
          <View style={styles.goalFooter}>
            <Text style={[styles.goalText, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              {fmt(state.balance)} ر.س محفوظ
            </Text>
            <Text style={[styles.goalText, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              الهدف {fmt(state.goal)} ر.س
            </Text>
          </View>
          {progressPct >= 100 && (
            <View style={[styles.goalComplete, { backgroundColor: '#FEF9C3' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#CA8A04" />
              <Text style={[styles.goalCompleteText, { color: '#92400E', fontFamily: 'Tajawal_700Bold' }]}>
                تهانينا! وصلت إلى هدفك!
              </Text>
            </View>
          )}
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'الرصيد المتاح', value: fmt(state.availableBalance) + ' ر.س', icon: 'card-outline' as const, bg: '#EFF6FF', fg: '#1D4ED8' },
            { label: 'إجمالي الادخار', value: fmt(state.balance) + ' ر.س', icon: 'wallet-outline' as const, bg: '#F0FDF4', fg: '#16A34A' },
            { label: 'الهدف', value: fmt(state.goal) + ' ر.س', icon: 'flag-outline' as const, bg: '#FFFBEB', fg: '#D97706' },
            { label: 'عدد التوفيرات', value: String(state.transactions.length), icon: 'layers-outline' as const, bg: '#F5F3FF', fg: '#7C3AED' },
          ].map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: s.bg }]}>
              <View style={[styles.statIcon, { backgroundColor: s.fg + '20' }]}>
                <Ionicons name={s.icon} size={18} color={s.fg} />
              </View>
              <Text style={[styles.statValue, { color: s.fg, fontFamily: 'Tajawal_800ExtraBold' }]}>
                {s.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Reset button */}
        <TouchableOpacity onPress={reset} style={styles.resetBtn}>
          <Ionicons name="refresh-outline" size={14} color={colors.mutedForeground} />
          <Text style={[styles.resetText, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
            إعادة ضبط المحفظة
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── FAB ───────────────────────────────────────────────────────── */}
      <TouchableOpacity
        onPress={() => { setDepositInput(''); setDepositNote(''); setShowDepositModal(true); }}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            bottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 80,
          },
        ]}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* ── Deposit bottom sheet ───────────────────────────────────────── */}
      <Modal
        visible={showDepositModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowDepositModal(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={() => setShowDepositModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
                أضف توفيرًا
              </Text>
              <View style={styles.sheetTrophy}>
                <Ionicons name="wallet-outline" size={22} color={colors.primary} />
              </View>
            </View>

            {/* Amount input */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              المبلغ (ر.س)
            </Text>
            <TextInput
              value={depositInput}
              onChangeText={setDepositInput}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.amountInput,
                {
                  color: colors.foreground,
                  borderColor: colors.primary + '66',
                  backgroundColor: colors.background,
                  fontFamily: 'Tajawal_800ExtraBold',
                },
              ]}
              textAlign="center"
              autoFocus
            />

            {/* Quick-amount chips */}
            <Text style={[styles.presetsLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              مبالغ سريعة
            </Text>
            <View style={styles.presetsRow}>
              {[100, 250, 500, 1000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setDepositInput(String(preset))}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: depositInput === String(preset) ? colors.primary : colors.muted,
                      backgroundColor: depositInput === String(preset) ? colors.primary + '18' : colors.background,
                    },
                  ]}
                >
                  <Text style={[
                    styles.presetText,
                    { color: depositInput === String(preset) ? colors.primary : colors.mutedForeground, fontFamily: 'Tajawal_700Bold' },
                  ]}>
                    {fmt(preset)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Optional note */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              ملاحظة (اختياري)
            </Text>
            <TextInput
              value={depositNote}
              onChangeText={setDepositNote}
              placeholder="مثال: توفير أسبوعي"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.noteInput,
                {
                  color: colors.foreground,
                  borderColor: colors.muted,
                  backgroundColor: colors.background,
                  fontFamily: 'Tajawal_400Regular',
                },
              ]}
              textAlign="right"
              returnKeyType="done"
            />

            {/* Confirm */}
            <TouchableOpacity
              onPress={() => {
                const amt = parseFloat(depositInput);
                if (amt > 0) { addSaving(amt, depositNote.trim() || undefined); }
                setShowDepositModal(false);
              }}
              disabled={!depositInput || parseFloat(depositInput) <= 0}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: colors.secondary ?? colors.primary,
                  opacity: (!depositInput || parseFloat(depositInput) <= 0) ? 0.4 : 1,
                },
              ]}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" style={{ marginLeft: 6 }} />
              <Text style={[styles.confirmBtnText, { fontFamily: 'Tajawal_800ExtraBold' }]}>
                أضف إلى المحفظة
              </Text>
            </TouchableOpacity>

            <View style={{ height: Platform.OS === 'web' ? 16 : insets.bottom + 8 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Goal-setting bottom sheet ──────────────────────────────────── */}
      <Modal
        visible={showGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowGoalModal(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={[styles.sheet, { backgroundColor: colors.card }]}>
            {/* Handle bar */}
            <View style={[styles.sheetHandle, { backgroundColor: colors.muted }]} />

            {/* Header */}
            <View style={styles.sheetHeader}>
              <TouchableOpacity
                onPress={() => setShowGoalModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={22} color={colors.mutedForeground} />
              </TouchableOpacity>
              <Text style={[styles.sheetTitle, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
                حدد هدفك
              </Text>
              <View style={styles.sheetTrophy}>
                <Ionicons name="trophy" size={22} color="#F59E0B" />
              </View>
            </View>

            {/* Amount input */}
            <Text style={[styles.inputLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              مبلغ الهدف (ر.س)
            </Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="numeric"
              placeholder="أدخل مبلغ الهدف"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.amountInput,
                {
                  color: colors.foreground,
                  borderColor: colors.primary + '66',
                  backgroundColor: colors.background,
                  fontFamily: 'Tajawal_800ExtraBold',
                },
              ]}
              textAlign="center"
              autoFocus
            />

            {/* Quick presets */}
            <Text style={[styles.presetsLabel, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              اختر مبلغًا سريعًا
            </Text>
            <View style={styles.presetsRow}>
              {[1000, 5000, 10000].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => setGoalInput(String(preset))}
                  style={[
                    styles.presetChip,
                    {
                      borderColor: goalInput === String(preset) ? colors.primary : colors.muted,
                      backgroundColor: goalInput === String(preset) ? colors.primary + '18' : colors.background,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color: goalInput === String(preset) ? colors.primary : colors.mutedForeground,
                        fontFamily: 'Tajawal_700Bold',
                      },
                    ]}
                  >
                    {fmt(preset)}
                  </Text>
                  <Text style={[styles.presetSar, { color: goalInput === String(preset) ? colors.primary : colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
                    {' '}ر.س
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Confirm button */}
            <TouchableOpacity
              onPress={() => {
                const g = parseFloat(goalInput);
                if (g > 0) { setGoal(g); }
                setShowGoalModal(false);
              }}
              disabled={!goalInput || parseFloat(goalInput) <= 0}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: (!goalInput || parseFloat(goalInput) <= 0) ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[styles.confirmBtnText, { fontFamily: 'Tajawal_800ExtraBold' }]}>
                حفظ الهدف
              </Text>
            </TouchableOpacity>

            {/* Bottom safe area spacer */}
            <View style={{ height: Platform.OS === 'web' ? 16 : insets.bottom + 8 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: { fontSize: 28, textAlign: 'right' },
  subtitle: { fontSize: 13, textAlign: 'right', marginTop: -2 },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  levelBadgeText: { color: '#fff', fontSize: 12 },
  walletCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    paddingBottom: 16,
    position: 'relative',
  },
  balanceArea: {
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  balanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  balanceAmount: { color: '#fff', fontSize: 36, marginTop: 2 },
  levelTag: {
    position: 'absolute',
    top: 14,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelTagText: { color: '#fff', fontSize: 12 },
  celebration: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  celebrationText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
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
  goalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6 },
  cardTitle: { fontSize: 15 },
  pctText: { fontSize: 22 },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 10,
    borderRadius: 5,
  },
  goalFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  goalText: { fontSize: 12 },
  goalComplete: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
  },
  goalCompleteText: { fontSize: 13 },
  statsGrid: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    borderRadius: 14,
    padding: 14,
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  statValue: { fontSize: 18, textAlign: 'right' },
  statLabel: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  resetBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    marginBottom: 8,
  },
  resetText: { fontSize: 12 },
  // ── Goal edit button ───────────────────────────────────────────────────
  editBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editBtnText: { fontSize: 12 },
  // ── Goal modal / bottom sheet ─────────────────────────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalWrapper: {
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: { fontSize: 20, textAlign: 'center', flex: 1 },
  sheetTrophy: { width: 30, alignItems: 'flex-end' },
  inputLabel: {
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 32,
    marginBottom: 20,
    textAlign: 'center',
  },
  presetsLabel: {
    fontSize: 13,
    textAlign: 'right',
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row-reverse',
    gap: 10,
    marginBottom: 20,
  },
  presetChip: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 12,
  },
  presetText: { fontSize: 16 },
  presetSar: { fontSize: 12 },
  confirmBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row-reverse',
    gap: 6,
    marginBottom: 8,
  },
  confirmBtnText: { color: '#fff', fontSize: 18 },
  // ── Note input ────────────────────────────────────────────────────────
  noteInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  // ── FAB ───────────────────────────────────────────────────────────────
  fab: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 10,
  },
});
