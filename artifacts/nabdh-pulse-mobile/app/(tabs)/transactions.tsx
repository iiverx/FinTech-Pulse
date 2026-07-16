import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSavingsWallet } from '@/context/SavingsWalletContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface IncomeTx {
  id: string;
  label: string;
  amount: number;
  date: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}

const SAMPLE_TRANSACTIONS: IncomeTx[] = [
  { id: 't1', label: 'راتب شهر يوليو', amount: 7500, date: '2026-07-01', iconName: 'briefcase', iconColor: '#1D4ED8' },
  { id: 't2', label: 'عمولة مبيعات', amount: 1200, date: '2026-07-10', iconName: 'trending-up', iconColor: '#16A34A' },
  { id: 't3', label: 'مكافأة أداء', amount: 800, date: '2026-07-15', iconName: 'star', iconColor: '#D97706' },
  { id: 't4', label: 'دخل إضافي', amount: 500, date: '2026-07-20', iconName: 'cash', iconColor: '#7C3AED' },
];

const QUICK_AMOUNTS = [100, 250, 500];

export default function TransactionsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addSaving, state } = useSavingsWallet();

  const [selectedTx, setSelectedTx] = useState<IncomeTx | null>(null);
  const [inputAmt, setInputAmt] = useState('');
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  const fmt = (n: number) =>
    new Intl.NumberFormat('ar-SA', { maximumFractionDigits: 0 }).format(n);

  const openModal = (tx: IncomeTx) => {
    setSelectedTx(tx);
    setInputAmt(String(tx.amount));
  };

  const confirmAdd = () => {
    const amt = parseFloat(inputAmt);
    if (!amt || amt <= 0 || !selectedTx) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSaving(amt, selectedTx.label);
    setLastAdded(selectedTx.id);
    setSelectedTx(null);
    setTimeout(() => setLastAdded(null), 2000);
  };

  const renderIncomeTx = ({ item }: { item: IncomeTx }) => {
    const isAdded = lastAdded === item.id;
    return (
      <View
        style={[
          styles.txRow,
          {
            backgroundColor: isAdded ? '#F0FDF4' : colors.card,
            borderColor: isAdded ? '#16A34A' : colors.border,
          },
        ]}
      >
        {/* Right: icon + info */}
        <View style={styles.txLeft}>
          <View style={[styles.txIcon, { backgroundColor: item.iconColor + '18' }]}>
            <Ionicons name={item.iconName} size={20} color={item.iconColor} />
          </View>
          <View style={styles.txInfo}>
            <Text style={[styles.txLabel, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
              {item.label}
            </Text>
            <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              {new Date(item.date).toLocaleDateString('ar-SA')}
            </Text>
          </View>
        </View>

        {/* Left: amount + button */}
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: colors.secondary, fontFamily: 'Tajawal_800ExtraBold' }]}>
            {fmt(item.amount)} ر.س
          </Text>
          {isAdded ? (
            <View style={[styles.addedBadge, { backgroundColor: '#16A34A' }]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
              <Text style={[styles.addedText, { fontFamily: 'Tajawal_700Bold' }]}>تمت</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openModal(item); }}
              style={[styles.addBtn, { backgroundColor: colors.primary }]}
              testID={`add-btn-${item.id}`}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={[styles.addBtnText, { fontFamily: 'Tajawal_700Bold' }]}>أضف</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderSavedTx = ({ item }: { item: typeof state.transactions[0] }) => (
    <View style={[styles.savedRow, { borderBottomColor: colors.border }]}>
      <View style={styles.savedLeft}>
        <Ionicons name="wallet-outline" size={16} color={colors.secondary} />
        <View>
          <Text style={[styles.savedLabel, { color: colors.foreground, fontFamily: 'Tajawal_500Medium' }]}>
            {item.note || 'توفير'}
          </Text>
          <Text style={[styles.savedDate, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
            {new Date(item.date).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' })}
          </Text>
        </View>
      </View>
      <Text style={[styles.savedAmount, { color: colors.secondary, fontFamily: 'Tajawal_800ExtraBold' }]}>
        +{fmt(item.amount)} ر.س
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={SAMPLE_TRANSACTIONS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: topPad + 16,
          paddingHorizontal: 16,
          paddingBottom: botPad + 100,
        }}
        ListHeaderComponent={
          <View>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="arrow-down-circle" size={22} color={colors.secondary} />
              <Text style={[styles.screenTitle, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
                معاملات الدخل
              </Text>
            </View>
            <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              اختر معاملة وأضف جزءاً منها إلى محفظتك
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={
          state.transactions.length > 0 ? (
            <View>
              {/* Saved history */}
              <View style={[styles.historyCard, { backgroundColor: colors.card }]}>
                <View style={styles.historyHeader}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <Text style={[styles.historyTitle, { color: colors.foreground, fontFamily: 'Tajawal_700Bold' }]}>
                    سجل التوفيرات
                  </Text>
                </View>
                {state.transactions.slice(0, 10).map((tx) => (
                  <View key={tx.id}>{renderSavedTx({ item: tx })}</View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Ionicons name="leaf-outline" size={32} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium' }]}>
                لا توجد توفيرات بعد
              </Text>
              <Text style={[styles.emptyHint, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
                اضغط "أضف" في أي معاملة للبدء
              </Text>
            </View>
          )
        }
        renderItem={renderIncomeTx}
      />

      {/* Add to wallet modal */}
      <Modal
        visible={!!selectedTx}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTx(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setSelectedTx(null)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, paddingBottom: botPad + 20 }]}>
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: colors.border }]} />

            {/* Title */}
            <View style={[styles.modalIconWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="wallet" size={28} color="#fff" />
            </View>
            <Text style={[styles.modalTitle, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}>
              إضافة إلى المحفظة
            </Text>
            <Text style={[styles.modalSubtitle, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              {selectedTx?.label}
            </Text>

            {/* Amount input */}
            <View style={[styles.inputWrap, { borderColor: colors.primary }]}>
              <TextInput
                ref={inputRef}
                style={[styles.amtInput, { color: colors.foreground, fontFamily: 'Tajawal_800ExtraBold' }]}
                value={inputAmt}
                onChangeText={setInputAmt}
                keyboardType="numeric"
                textAlign="center"
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                autoFocus
              />
              <Text style={[styles.amtSuffix, { color: colors.mutedForeground, fontFamily: 'Tajawal_500Medium' }]}>
                ر.س
              </Text>
            </View>

            <Text style={[styles.maxText, { color: colors.mutedForeground, fontFamily: 'Tajawal_400Regular' }]}>
              الحد الأقصى: {selectedTx ? fmt(selectedTx.amount) : ''} ر.س
            </Text>

            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {[...QUICK_AMOUNTS, selectedTx?.amount ?? 0]
                .filter((q) => q > 0)
                .map((q) => (
                  <TouchableOpacity
                    key={q}
                    onPress={() => setInputAmt(String(q))}
                    style={[styles.quickBtn, { borderColor: colors.primary + '66' }]}
                  >
                    <Text style={[styles.quickBtnText, { color: colors.primary, fontFamily: 'Tajawal_700Bold' }]}>
                      {fmt(q)}
                    </Text>
                  </TouchableOpacity>
                ))}
            </View>

            {/* Confirm */}
            <TouchableOpacity
              onPress={confirmAdd}
              disabled={!inputAmt || parseFloat(inputAmt) <= 0}
              style={[
                styles.confirmBtn,
                {
                  backgroundColor:
                    !inputAmt || parseFloat(inputAmt) <= 0 ? colors.muted : colors.primary,
                },
              ]}
              testID="confirm-add-btn"
            >
              <Text style={[styles.confirmBtnText, { color: !inputAmt || parseFloat(inputAmt) <= 0 ? colors.mutedForeground : '#fff', fontFamily: 'Tajawal_800ExtraBold' }]}>
                أضف{inputAmt && parseFloat(inputAmt) > 0 ? ` ${fmt(parseFloat(inputAmt))} ر.س` : ''} إلى المحفظة
              </Text>
            </TouchableOpacity>
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
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  screenTitle: { fontSize: 22, textAlign: 'right' },
  screenSubtitle: { fontSize: 13, textAlign: 'right', marginBottom: 16 },
  txRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  txLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 },
  txIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1 },
  txLabel: { fontSize: 14, textAlign: 'right' },
  txDate: { fontSize: 11, textAlign: 'right', marginTop: 2 },
  txRight: { alignItems: 'flex-start', gap: 8 },
  txAmount: { fontSize: 15 },
  addBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: { color: '#fff', fontSize: 13 },
  addedBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  addedText: { color: '#fff', fontSize: 13 },
  historyCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  historyTitle: { fontSize: 16 },
  savedRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  savedLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flex: 1 },
  savedLabel: { fontSize: 13, textAlign: 'right' },
  savedDate: { fontSize: 10, textAlign: 'right', marginTop: 1 },
  savedAmount: { fontSize: 14 },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
    marginTop: 20,
  },
  emptyText: { fontSize: 15 },
  emptyHint: { fontSize: 12 },
  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 20,
  },
  modalIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  modalTitle: { fontSize: 22, textAlign: 'center', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, textAlign: 'center', marginBottom: 20 },
  inputWrap: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    width: '100%',
    marginBottom: 6,
  },
  amtInput: { flex: 1, fontSize: 32, textAlign: 'center' },
  amtSuffix: { fontSize: 16 },
  maxText: { fontSize: 11, marginBottom: 16 },
  quickRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 20, flexWrap: 'wrap', justifyContent: 'center' },
  quickBtn: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quickBtnText: { fontSize: 13 },
  confirmBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnText: { fontSize: 16 },
});
