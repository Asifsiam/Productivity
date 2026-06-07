import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, addDays, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks, addMonths, subMonths, parseISO } from 'date-fns';
import { Colors } from '@/constants/colors';
import { useHours } from '@/hooks/useHours';
import { FAB } from '@/components/FAB';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import type { HoursSettings } from '@/types';

function fmt12(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function HoursScreen() {
  const {
    entries, settings, loading,
    addEntry, removeEntry, updateSettings,
    getEntryForDate, getWeekEntries, getMonthEntries, getMonthStats, calcHoursWorked,
  } = useHours();

  const [tabIndex, setTabIndex] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [settingsSheetVisible, setSettingsSheetVisible] = useState(false);

  // Add entry form
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [lunchAllowance, setLunchAllowance] = useState('0');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);

  // Settings form
  const [rateInput, setRateInput] = useState(String(settings.hourlyRate));

  const timeFromDate = (date: Date) => {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const dateFromTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  };

  const previewHours = () => calcHoursWorked(clockIn, clockOut);
  const previewEarnings = () => previewHours() * settings.hourlyRate + (Number(lunchAllowance) || 0);

  const handleAddEntry = async () => {
    if (!entryDate) { Alert.alert('Validation', 'Please select a date.'); return; }
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    if (inH * 60 + inM >= outH * 60 + outM) {
      Alert.alert('Validation', 'Clock-out must be after clock-in.'); return;
    }
    await addEntry(entryDate, clockIn, clockOut, Number(lunchAllowance) || 0);
    setAddSheetVisible(false);
    setLunchAllowance('0');
  };

  const handleSaveSettings = async () => {
    const rate = Number(rateInput);
    if (isNaN(rate) || rate < 0) { Alert.alert('Validation', 'Please enter a valid hourly rate.'); return; }
    await updateSettings({ hourlyRate: rate });
    setSettingsSheetVisible(false);
  };

  const confirmDelete = (id: string) => Alert.alert('Delete Entry', 'Delete this entry?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => removeEntry(id) },
  ]);

  const monthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());

  const renderDailyView = () => {
    const entry = getEntryForDate(format(currentDate, 'yyyy-MM-dd'));
    return (
      <View style={styles.viewContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrentDate(subDays(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{format(currentDate, 'EEEE, MMM d')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addDays(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {entry ? (
          <View style={styles.entryCard}>
            <View style={styles.entryRow}>
              <View style={[styles.entryIcon, { backgroundColor: Colors.hours + '22' }]}>
                <Ionicons name="log-in-outline" size={18} color={Colors.hours} />
              </View>
              <Text style={styles.entryLabel}>Clock In</Text>
              <Text style={styles.entryValue}>{fmt12(entry.clockIn)}</Text>
            </View>
            <View style={styles.entryRow}>
              <View style={[styles.entryIcon, { backgroundColor: Colors.hours + '22' }]}>
                <Ionicons name="log-out-outline" size={18} color={Colors.hours} />
              </View>
              <Text style={styles.entryLabel}>Clock Out</Text>
              <Text style={styles.entryValue}>{fmt12(entry.clockOut)}</Text>
            </View>
            {entry.lunchAllowance > 0 && (
              <View style={styles.entryRow}>
                <View style={[styles.entryIcon, { backgroundColor: '#22C55E22' }]}>
                  <Ionicons name="restaurant-outline" size={18} color={Colors.success} />
                </View>
                <Text style={styles.entryLabel}>Lunch Allowance</Text>
                <Text style={[styles.entryValue, { color: Colors.success }]}>৳{entry.lunchAllowance}</Text>
              </View>
            )}
            <View style={[styles.entryRow, { borderBottomWidth: 0 }]}>
              <View style={[styles.entryIcon, { backgroundColor: Colors.hours + '22' }]}>
                <Ionicons name="time-outline" size={18} color={Colors.hours} />
              </View>
              <Text style={styles.entryLabel}>Hours Worked</Text>
              <Text style={[styles.entryValue, { color: Colors.hours, fontWeight: '700' }]}>
                {entry.hoursWorked.toFixed(2)}h
              </Text>
            </View>
            <View style={styles.earningsBanner}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.earningsValue}>৳{entry.earnings.toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => confirmDelete(entry.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={15} color={Colors.danger} />
              <Text style={styles.deleteBtnText}>Delete Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EmptyState icon="time" title="No entry" subtitle="Tap + to log hours for this day" accentColor={Colors.hours} />
        )}
      </View>
    );
  };

  const renderWeeklyView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEntries = getWeekEntries(currentDate);
    const totalHours = weekEntries.reduce((s, e) => s + e.hoursWorked, 0);
    const totalEarnings = weekEntries.reduce((s, e) => s + e.earnings, 0);

    return (
      <View style={styles.viewContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrentDate(subWeeks(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addWeeks(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: Colors.hours + '55' }]}>
            <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.success + '55' }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>৳{Math.round(totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>
        {weekEntries.length === 0 ? (
          <EmptyState icon="time" title="No entries this week" subtitle="Log hours to see stats" accentColor={Colors.hours} />
        ) : weekEntries.map(entry => (
          <View key={entry.id} style={styles.miniCard}>
            <View style={[styles.miniDot, { backgroundColor: Colors.hours }]} />
            <Text style={styles.miniDate}>{format(parseISO(entry.date), 'EEE, MMM d')}</Text>
            <Text style={styles.miniHours}>{entry.hoursWorked.toFixed(1)}h</Text>
            <Text style={styles.miniEarnings}>৳{entry.earnings.toFixed(0)}</Text>
            <TouchableOpacity onPress={() => confirmDelete(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderMonthlyView = () => {
    const monthEntries = getMonthEntries(currentDate.getFullYear(), currentDate.getMonth());
    return (
      <View style={styles.viewContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <View style={styles.statRow}>
          <View style={[styles.statCard, { borderColor: Colors.hours + '55' }]}>
            <Text style={styles.statValue}>{monthStats.totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={[styles.statCard, { borderColor: Colors.success + '55' }]}>
            <Text style={[styles.statValue, { color: Colors.success }]}>৳{Math.round(monthStats.totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>
        {monthEntries.length === 0 ? (
          <EmptyState icon="time" title="No entries this month" subtitle="Log hours to see stats" accentColor={Colors.hours} />
        ) : monthEntries.map(entry => (
          <View key={entry.id} style={styles.miniCard}>
            <View style={[styles.miniDot, { backgroundColor: Colors.hours }]} />
            <Text style={styles.miniDate}>{format(parseISO(entry.date), 'EEE, MMM d')}</Text>
            <Text style={styles.miniHours}>{entry.hoursWorked.toFixed(1)}h</Text>
            <Text style={styles.miniEarnings}>৳{entry.earnings.toFixed(0)}</Text>
            <TouchableOpacity onPress={() => confirmDelete(entry.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hours</Text>
          <Text style={styles.headerSub}>
            {monthStats.totalHours.toFixed(1)}h · ৳{Math.round(monthStats.totalEarnings)} this month
          </Text>
        </View>
        <TouchableOpacity onPress={() => { setRateInput(String(settings.hourlyRate)); setSettingsSheetVisible(true); }}
          style={styles.gearBtn}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <SegmentedControl segments={['Daily', 'Weekly', 'Monthly']} selectedIndex={tabIndex} onChange={setTabIndex} accentColor={Colors.hours} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabIndex === 0 && renderDailyView()}
        {tabIndex === 1 && renderWeeklyView()}
        {tabIndex === 2 && renderMonthlyView()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB color={Colors.hours} onPress={() => {
        setEntryDate(format(currentDate, 'yyyy-MM-dd'));
        setLunchAllowance('0');
        setAddSheetVisible(true);
      }} />

      {/* Add Entry Sheet */}
      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)} title="Log Hours">
        <Text style={styles.label}>DATE</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{format(parseISO(entryDate), 'MMM d, yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={parseISO(entryDate)} mode="date" display="default"
            onChange={(_, date) => { setShowDatePicker(false); if (date) setEntryDate(format(date, 'yyyy-MM-dd')); }} />
        )}

        <Text style={styles.label}>CLOCK IN</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowClockInPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{fmt12(clockIn)}</Text>
        </TouchableOpacity>
        {showClockInPicker && (
          <DateTimePicker value={dateFromTime(clockIn)} mode="time" is24Hour={false} display="default"
            onChange={(_, date) => { setShowClockInPicker(false); if (date) setClockIn(timeFromDate(date)); }} />
        )}

        <Text style={styles.label}>CLOCK OUT</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowClockOutPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{fmt12(clockOut)}</Text>
        </TouchableOpacity>
        {showClockOutPicker && (
          <DateTimePicker value={dateFromTime(clockOut)} mode="time" is24Hour={false} display="default"
            onChange={(_, date) => { setShowClockOutPicker(false); if (date) setClockOut(timeFromDate(date)); }} />
        )}

        <Text style={styles.label}>LUNCH ALLOWANCE (৳) — 0 IF NONE</Text>
        <TextInput style={styles.input} value={lunchAllowance} onChangeText={setLunchAllowance}
          keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="0" />

        <View style={styles.previewBanner}>
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Hours</Text>
            <Text style={styles.previewValue}>{previewHours().toFixed(2)}h</Text>
          </View>
          <View style={styles.previewDivider} />
          <View style={styles.previewItem}>
            <Text style={styles.previewLabel}>Earnings</Text>
            <Text style={[styles.previewValue, { color: Colors.success }]}>৳{previewEarnings().toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.hours }]} onPress={handleAddEntry}>
          <Text style={styles.saveBtnText}>Save Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setAddSheetVisible(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Settings Sheet */}
      <BottomSheet visible={settingsSheetVisible} onClose={() => setSettingsSheetVisible(false)} title="Settings">
        <Text style={styles.label}>HOURLY RATE (৳)</Text>
        <TextInput style={styles.input} value={rateInput} onChangeText={setRateInput}
          keyboardType="numeric" placeholderTextColor={Colors.textMuted} placeholder="100" />
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.hours }]} onPress={handleSaveSettings}>
          <Text style={styles.saveBtnText}>Save Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSettingsSheetVisible(false)} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  headerSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  gearBtn: { padding: 4 },
  scrollContent: { paddingBottom: 20 },
  viewContainer: { paddingHorizontal: 16, paddingTop: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8 },
  navLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  statValue: { color: Colors.hours, fontSize: 24, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  entryCard: { backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 12 },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 12 },
  entryIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  entryLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14 },
  entryValue: { color: Colors.textPrimary, fontSize: 15, fontWeight: '600' },
  earningsBanner: { backgroundColor: Colors.hours + '18', borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, borderWidth: 1, borderColor: Colors.hours + '33' },
  earningsLabel: { color: Colors.textSecondary, fontSize: 14 },
  earningsValue: { color: Colors.hours, fontSize: 24, fontWeight: '800' },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, paddingVertical: 8 },
  deleteBtnText: { color: Colors.danger, fontSize: 14 },
  miniCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderColor: Colors.border, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 8, gap: 10 },
  miniDot: { width: 8, height: 8, borderRadius: 4 },
  miniDate: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  miniHours: { color: Colors.hours, fontSize: 14, fontWeight: '700' },
  miniEarnings: { color: Colors.textSecondary, fontSize: 14, marginRight: 10 },
  label: { color: Colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6, marginTop: 14, letterSpacing: 0.8 },
  input: { backgroundColor: Colors.elevated, borderColor: Colors.border, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontSize: 15, justifyContent: 'center' },
  previewBanner: { backgroundColor: Colors.elevated, borderRadius: 12, padding: 16, flexDirection: 'row', marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  previewItem: { flex: 1, alignItems: 'center' },
  previewDivider: { width: 1, backgroundColor: Colors.border, marginVertical: 4 },
  previewLabel: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  previewValue: { color: Colors.hours, fontSize: 20, fontWeight: '800', marginTop: 4 },
  saveBtn: { paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginTop: 22 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { color: Colors.textSecondary, fontSize: 15 },
});
