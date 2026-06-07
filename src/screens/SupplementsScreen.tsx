import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, Alert, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, subDays, addDays, isToday, isYesterday } from 'date-fns';
import { Colors } from '@/constants/colors';
import { useSupplements } from '@/hooks/useSupplements';
import { FAB } from '@/components/FAB';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import type { Supplement } from '@/types';

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const SCHEDULE_COLORS: Record<string, string> = {
  daily: '#3B82F6',
  specific_days: '#22C55E',
  cycle: '#7C6EFA',
};

function dateLabel(d: Date) {
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEE, MMM d');
}

export function SupplementsScreen() {
  const { supplements, loading, addSupplement, removeSupplement, recordAction, getStatusForDate, takenTodayCount, globalStreak } = useSupplements();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  const viewDateStr = format(viewDate, 'yyyy-MM-dd');
  const isFuture = viewDate > new Date() && !isToday(viewDate);

  // Form state
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [notes, setNotes] = useState('');
  const [scheduleType, setScheduleType] = useState<'daily' | 'specific_days' | 'cycle'>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([]);
  const [cycleOn, setCycleOn] = useState('');
  const [cycleOff, setCycleOff] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerTime, setPickerTime] = useState(new Date());

  const resetForm = () => {
    setName(''); setDose(''); setNotes('');
    setScheduleType('daily'); setScheduleDays([]);
    setCycleOn(''); setCycleOff(''); setReminderTime('');
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Please enter a supplement name.'); return; }
    if (!dose.trim()) { Alert.alert('Validation', 'Please enter a dose.'); return; }
    if (scheduleType === 'specific_days' && scheduleDays.length === 0) {
      Alert.alert('Validation', 'Please select at least one day.'); return;
    }
    if (scheduleType === 'cycle' && (!cycleOn || !cycleOff || isNaN(Number(cycleOn)) || isNaN(Number(cycleOff)))) {
      Alert.alert('Validation', 'Please enter valid cycle on/off days.'); return;
    }

    const supplement: Supplement = {
      id: Date.now().toString(),
      name: name.trim(), dose: dose.trim(), notes: notes.trim(),
      scheduleType,
      scheduleDays: scheduleType === 'specific_days' ? scheduleDays : undefined,
      cycleOn: scheduleType === 'cycle' ? Number(cycleOn) : undefined,
      cycleOff: scheduleType === 'cycle' ? Number(cycleOff) : undefined,
      cycleStartDate: scheduleType === 'cycle' ? new Date().toISOString().split('T')[0] : undefined,
      reminderTime: reminderTime || undefined,
      history: [],
      createdAt: new Date().toISOString(),
    };
    await addSupplement(supplement);
    resetForm();
    setSheetVisible(false);
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleDelete = (item: Supplement) => {
    Alert.alert('Delete Supplement', `Delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeSupplement(item.id) },
    ]);
  };

  const takenCount = supplements.filter(s =>
    s.history.some(h => h.date === viewDateStr && h.status === 'taken')
  ).length;

  const renderSupplement = ({ item }: { item: Supplement }) => {
    const status = getStatusForDate(item, viewDateStr);
    const dot = SCHEDULE_COLORS[item.scheduleType];

    return (
      <View style={styles.card}>
        <View style={[styles.cardAccent, { backgroundColor: dot }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <View style={styles.cardInfo}>
              <Text style={styles.suppName}>{item.name}</Text>
              <Text style={styles.suppSub}>
                {item.dose}{item.notes ? ` · ${item.notes}` : ''}
                {item.reminderTime ? `  ⏰ ${item.reminderTime}` : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={17} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {status && (
            <View style={[styles.statusBadge, status === 'taken' ? styles.takenBadge : styles.skippedBadge]}>
              <Ionicons
                name={status === 'taken' ? 'checkmark-circle' : 'close-circle'}
                size={14}
                color={status === 'taken' ? Colors.success : Colors.danger}
              />
              <Text style={[styles.statusBadgeText, { color: status === 'taken' ? Colors.success : Colors.danger }]}>
                {status === 'taken' ? 'Taken' : 'Skipped'}
              </Text>
            </View>
          )}

          {!isFuture && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.takenBtn, status === 'taken' && styles.takenActive]}
                onPress={() => recordAction(item.id, 'taken', viewDateStr)}
              >
                <Ionicons name="checkmark" size={15} color={status === 'taken' ? '#fff' : Colors.success} />
                <Text style={[styles.actionText, { color: status === 'taken' ? '#fff' : Colors.success }]}>Taken</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.skipBtn, status === 'skipped' && styles.skipActive]}
                onPress={() => recordAction(item.id, 'skipped', viewDateStr)}
              >
                <Ionicons name="close" size={15} color={status === 'skipped' ? '#fff' : Colors.danger} />
                <Text style={[styles.actionText, { color: status === 'skipped' ? '#fff' : Colors.danger }]}>Skip</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Supplements</Text>
          <Text style={styles.headerSub}>{takenTodayCount}/{supplements.length} taken today</Text>
        </View>
        {globalStreak > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakFire}>🔥</Text>
            <View>
              <Text style={styles.streakNumber}>{globalStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>
        )}
      </View>

      {/* Date navigator */}
      <View style={styles.dateNav}>
        <TouchableOpacity onPress={() => setViewDate(subDays(viewDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.dateLabelWrap}>
          <Text style={styles.dateLabel}>{dateLabel(viewDate)}</Text>
          {!isToday(viewDate) && (
            <TouchableOpacity onPress={() => setViewDate(new Date())} style={styles.todayBtn}>
              <Text style={styles.todayBtnText}>Go to Today</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => setViewDate(addDays(viewDate, 1))} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      {supplements.length > 0 && (
        <View style={styles.progressWrap}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${(takenCount / supplements.length) * 100}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{takenCount}/{supplements.length}</Text>
        </View>
      )}

      {!loading && supplements.length === 0 ? (
        <EmptyState
          icon="medical"
          title="No supplements yet"
          subtitle="Tap + to add your first supplement"
          accentColor={Colors.supplements}
        />
      ) : (
        <FlatList
          data={supplements}
          keyExtractor={item => item.id}
          renderItem={renderSupplement}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB color={Colors.supplements} onPress={() => setSheetVisible(true)} />

      <BottomSheet visible={sheetVisible} onClose={() => { resetForm(); setSheetVisible(false); }} title="Add Supplement">
        <Text style={styles.label}>NAME *</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName}
          placeholder="e.g. Vitamin D3" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>DOSE *</Text>
        <TextInput style={styles.input} value={dose} onChangeText={setDose}
          placeholder="e.g. 2000 IU" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>NOTES</Text>
        <TextInput style={styles.input} value={notes} onChangeText={setNotes}
          placeholder="e.g. With food" placeholderTextColor={Colors.textMuted} />

        <Text style={styles.label}>SCHEDULE</Text>
        <View style={styles.segRow}>
          {(['daily', 'specific_days', 'cycle'] as const).map(t => (
            <TouchableOpacity key={t}
              style={[styles.segBtn, scheduleType === t && { backgroundColor: Colors.supplements }]}
              onPress={() => setScheduleType(t)}>
              <Text style={[styles.segBtnText, scheduleType === t && { color: '#fff' }]}>
                {t === 'daily' ? 'Daily' : t === 'specific_days' ? 'Days' : 'Cycle'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {scheduleType === 'specific_days' && (
          <>
            <Text style={styles.label}>SELECT DAYS</Text>
            <View style={styles.daysRow}>
              {DAYS_SHORT.map((d, i) => (
                <TouchableOpacity key={i}
                  style={[styles.dayBtn, scheduleDays.includes(i) && { backgroundColor: Colors.supplements }]}
                  onPress={() => toggleDay(i)}>
                  <Text style={[styles.dayBtnText, scheduleDays.includes(i) && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {scheduleType === 'cycle' && (
          <>
            <Text style={styles.label}>DAYS ON</Text>
            <TextInput style={styles.input} value={cycleOn} onChangeText={setCycleOn}
              placeholder="e.g. 5" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
            <Text style={styles.label}>DAYS OFF</Text>
            <TextInput style={styles.input} value={cycleOff} onChangeText={setCycleOff}
              placeholder="e.g. 2" placeholderTextColor={Colors.textMuted} keyboardType="numeric" />
          </>
        )}

        <Text style={styles.label}>REMINDER TIME (OPTIONAL)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={{ color: reminderTime ? Colors.textPrimary : Colors.textMuted }}>
            {reminderTime || 'Tap to set time'}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker value={pickerTime} mode="time" display="default"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) {
                setPickerTime(date);
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setReminderTime(`${h}:${m}`);
              }
            }} />
        )}

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.supplements }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Supplement</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { resetForm(); setSheetVisible(false); }} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F59E0B18', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, gap: 8, borderWidth: 1, borderColor: '#F59E0B33' },
  streakFire: { fontSize: 24 },
  streakNumber: { color: '#F59E0B', fontSize: 20, fontWeight: '800', lineHeight: 22 },
  streakLabel: { color: '#F59E0B99', fontSize: 11, fontWeight: '600' },
  dateNav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 8 },
  navBtn: { padding: 8 },
  dateLabelWrap: { flex: 1, alignItems: 'center' },
  dateLabel: { color: Colors.textPrimary, fontSize: 15, fontWeight: '700' },
  todayBtn: { marginTop: 2 },
  todayBtnText: { color: Colors.supplements, fontSize: 12, fontWeight: '600' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8, gap: 10 },
  progressBg: { flex: 1, height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: Colors.supplements, borderRadius: 2 },
  progressText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600', width: 32, textAlign: 'right' },
  listContent: { padding: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 14, marginBottom: 10, overflow: 'hidden' },
  cardAccent: { width: 4 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardInfo: { flex: 1 },
  suppName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  suppSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 3 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginTop: 8, borderWidth: 1 },
  takenBadge: { backgroundColor: Colors.success + '18', borderColor: Colors.success + '44' },
  skippedBadge: { backgroundColor: Colors.danger + '18', borderColor: Colors.danger + '44' },
  statusBadgeText: { fontSize: 12, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  takenBtn: { borderColor: Colors.success },
  takenActive: { backgroundColor: Colors.success },
  skipBtn: { borderColor: Colors.danger },
  skipActive: { backgroundColor: Colors.danger },
  actionText: { fontSize: 13, fontWeight: '600' },
  label: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 14, letterSpacing: 0.8 },
  input: { backgroundColor: Colors.elevated, borderColor: Colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontSize: 15 },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  segBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '600' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.border },
  dayBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 22 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: 15 },
});
