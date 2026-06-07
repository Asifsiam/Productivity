import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
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

function ScheduleChip({ type }: { type: string }) {
  const label = type === 'daily' ? 'Daily' : type === 'specific_days' ? 'Specific Days' : 'Cycle';
  return (
    <View style={[styles.chip, { backgroundColor: SCHEDULE_COLORS[type] + '22' }]}>
      <Text style={[styles.chipText, { color: SCHEDULE_COLORS[type] }]}>{label}</Text>
    </View>
  );
}

export function SupplementsScreen() {
  const { supplements, loading, addSupplement, recordAction, getTodayStatus, takenTodayCount } = useSupplements();
  const [sheetVisible, setSheetVisible] = useState(false);

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
    setName('');
    setDose('');
    setNotes('');
    setScheduleType('daily');
    setScheduleDays([]);
    setCycleOn('');
    setCycleOff('');
    setReminderTime('');
    setShowTimePicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Please enter a supplement name.');
      return;
    }
    if (!dose.trim()) {
      Alert.alert('Validation', 'Please enter a dose.');
      return;
    }
    if (scheduleType === 'specific_days' && scheduleDays.length === 0) {
      Alert.alert('Validation', 'Please select at least one day.');
      return;
    }
    if (scheduleType === 'cycle') {
      if (!cycleOn || !cycleOff || isNaN(Number(cycleOn)) || isNaN(Number(cycleOff))) {
        Alert.alert('Validation', 'Please enter valid cycle on/off days.');
        return;
      }
    }

    const supplement: Supplement = {
      id: Date.now().toString(),
      name: name.trim(),
      dose: dose.trim(),
      notes: notes.trim(),
      scheduleType,
      scheduleDays: scheduleType === 'specific_days' ? scheduleDays : undefined,
      cycleOn: scheduleType === 'cycle' ? Number(cycleOn) : undefined,
      cycleOff: scheduleType === 'cycle' ? Number(cycleOff) : undefined,
      cycleStartDate: scheduleType === 'cycle' ? new Date().toISOString().split('T')[0] : undefined,
      reminderTime: reminderTime || undefined,
      history: [],
      streak: 0,
      createdAt: new Date().toISOString(),
    };

    await addSupplement(supplement);
    resetForm();
    setSheetVisible(false);
  };

  const toggleDay = (day: number) => {
    setScheduleDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const renderSupplement = ({ item }: { item: Supplement }) => {
    const todayStatus = getTodayStatus(item);
    const dot = SCHEDULE_COLORS[item.scheduleType];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.dot, { backgroundColor: dot }]} />
          <View style={styles.cardInfo}>
            <Text style={styles.suppName}>{item.name}</Text>
            <Text style={styles.suppSub}>{item.dose}{item.notes ? ` · ${item.notes}` : ''}</Text>
          </View>
          <ScheduleChip type={item.scheduleType} />
        </View>
        {item.streak > 0 && (
          <Text style={styles.streak}>🔥 {item.streak} day streak</Text>
        )}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.takenBtn, todayStatus === 'taken' && styles.takenActive]}
            onPress={() => recordAction(item.id, 'taken')}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, todayStatus === 'taken' && { color: '#fff' }]}>
              {todayStatus === 'taken' ? '✓ Taken' : 'Taken'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.skipBtn, todayStatus === 'skipped' && styles.skipActive]}
            onPress={() => recordAction(item.id, 'skipped')}
            activeOpacity={0.7}
          >
            <Text style={[styles.actionText, todayStatus === 'skipped' && { color: '#fff' }]}>
              {todayStatus === 'skipped' ? '✕ Skipped' : 'Skip'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supplements</Text>
        <Text style={styles.headerSub}>{takenTodayCount}/{supplements.length} taken today</Text>
      </View>

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
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Vitamin D3"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Dose *</Text>
        <TextInput
          style={styles.input}
          value={dose}
          onChangeText={setDose}
          placeholder="e.g. 2000 IU"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          style={styles.input}
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. With food"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Schedule</Text>
        <View style={styles.segRow}>
          {(['daily', 'specific_days', 'cycle'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.segBtn, scheduleType === t && { backgroundColor: Colors.supplements }]}
              onPress={() => setScheduleType(t)}
            >
              <Text style={[styles.segBtnText, scheduleType === t && { color: '#fff' }]}>
                {t === 'daily' ? 'Daily' : t === 'specific_days' ? 'Days' : 'Cycle'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {scheduleType === 'specific_days' && (
          <>
            <Text style={styles.label}>Select Days</Text>
            <View style={styles.daysRow}>
              {DAYS_SHORT.map((d, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.dayBtn, scheduleDays.includes(i) && { backgroundColor: Colors.supplements }]}
                  onPress={() => toggleDay(i)}
                >
                  <Text style={[styles.dayBtnText, scheduleDays.includes(i) && { color: '#fff' }]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {scheduleType === 'cycle' && (
          <>
            <Text style={styles.label}>Cycle On (days)</Text>
            <TextInput
              style={styles.input}
              value={cycleOn}
              onChangeText={setCycleOn}
              placeholder="e.g. 5"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
            <Text style={styles.label}>Cycle Off (days)</Text>
            <TextInput
              style={styles.input}
              value={cycleOff}
              onChangeText={setCycleOff}
              placeholder="e.g. 2"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={styles.label}>Reminder Time (optional)</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowTimePicker(true)}>
          <Text style={{ color: reminderTime ? Colors.textPrimary : Colors.textMuted }}>
            {reminderTime || 'Tap to set time'}
          </Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={pickerTime}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) {
                setPickerTime(date);
                const h = date.getHours().toString().padStart(2, '0');
                const m = date.getMinutes().toString().padStart(2, '0');
                setReminderTime(`${h}:${m}`);
              }
            }}
          />
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTitle: { color: Colors.textPrimary, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10, marginTop: 2 },
  cardInfo: { flex: 1 },
  suppName: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  suppSub: { color: Colors.textSecondary, fontSize: 13, marginTop: 2 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  chipText: { fontSize: 11, fontWeight: '600' },
  streak: { color: '#F59E0B', fontSize: 13, marginTop: 8 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  takenBtn: { borderColor: Colors.success },
  takenActive: { backgroundColor: Colors.success },
  skipBtn: { borderColor: Colors.danger },
  skipActive: { backgroundColor: Colors.danger },
  actionText: { fontSize: 14, fontWeight: '500', color: Colors.textSecondary },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  segRow: { flexDirection: 'row', gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  segBtnText: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500' },
  daysRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  dayBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayBtnText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '600' },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: 15 },
});
