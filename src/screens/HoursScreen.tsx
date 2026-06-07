import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Switch,
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

export function HoursScreen() {
  const {
    entries,
    settings,
    loading,
    addEntry,
    removeEntry,
    updateSettings,
    getEntryForDate,
    getWeekEntries,
    getMonthEntries,
    getMonthStats,
    calcHoursWorked,
  } = useHours();

  const [tabIndex, setTabIndex] = useState(0); // 0=daily 1=weekly 2=monthly
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addSheetVisible, setAddSheetVisible] = useState(false);
  const [settingsSheetVisible, setSettingsSheetVisible] = useState(false);

  // Add entry form
  const [entryDate, setEntryDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [clockIn, setClockIn] = useState('09:00');
  const [clockOut, setClockOut] = useState('17:00');
  const [lunchEnabled, setLunchEnabled] = useState(true);
  const [lunchMinutes, setLunchMinutes] = useState(String(settings.defaultLunchMinutes));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClockInPicker, setShowClockInPicker] = useState(false);
  const [showClockOutPicker, setShowClockOutPicker] = useState(false);

  // Settings form
  const [rateInput, setRateInput] = useState(String(settings.hourlyRate));
  const [lunchSettingEnabled, setLunchSettingEnabled] = useState(settings.lunchEnabled);
  const [lunchMinsInput, setLunchMinsInput] = useState(String(settings.defaultLunchMinutes));

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

  const previewHours = () => {
    const lunch = lunchEnabled ? Number(lunchMinutes) || 0 : 0;
    return calcHoursWorked(clockIn, clockOut, lunch);
  };

  const previewEarnings = () => previewHours() * settings.hourlyRate;

  const handleAddEntry = async () => {
    if (!entryDate) { Alert.alert('Validation', 'Please select a date.'); return; }
    const [inH, inM] = clockIn.split(':').map(Number);
    const [outH, outM] = clockOut.split(':').map(Number);
    if (inH * 60 + inM >= outH * 60 + outM) {
      Alert.alert('Validation', 'Clock-out must be after clock-in.');
      return;
    }
    const lunch = lunchEnabled ? (Number(lunchMinutes) || 0) : 0;
    await addEntry(entryDate, clockIn, clockOut, lunch);
    setAddSheetVisible(false);
  };

  const handleSaveSettings = async () => {
    const rate = Number(rateInput);
    if (isNaN(rate) || rate < 0) { Alert.alert('Validation', 'Please enter a valid hourly rate.'); return; }
    const s: HoursSettings = {
      hourlyRate: rate,
      defaultLunchMinutes: Number(lunchMinsInput) || 30,
      lunchEnabled: lunchSettingEnabled,
    };
    await updateSettings(s);
    setSettingsSheetVisible(false);
  };

  // Month stats
  const monthStats = getMonthStats(currentDate.getFullYear(), currentDate.getMonth());

  // Header subtitle
  const monthHours = monthStats.totalHours.toFixed(1);
  const monthEarnings = Math.round(monthStats.totalEarnings);

  const formatTime12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const renderDailyView = () => {
    const entry = getEntryForDate(format(currentDate, 'yyyy-MM-dd'));
    return (
      <View style={styles.viewContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrentDate(subDays(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{format(currentDate, 'EEEE, MMM d')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addDays(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {entry ? (
          <View style={styles.entryCard}>
            <View style={styles.entryRow}>
              <Ionicons name="log-in-outline" size={18} color={Colors.hours} />
              <Text style={styles.entryLabel}>Clock In</Text>
              <Text style={styles.entryValue}>{formatTime12(entry.clockIn)}</Text>
            </View>
            <View style={styles.entryRow}>
              <Ionicons name="log-out-outline" size={18} color={Colors.hours} />
              <Text style={styles.entryLabel}>Clock Out</Text>
              <Text style={styles.entryValue}>{formatTime12(entry.clockOut)}</Text>
            </View>
            {entry.lunchMinutes > 0 && (
              <View style={styles.entryRow}>
                <Ionicons name="restaurant-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.entryLabel}>Lunch</Text>
                <Text style={styles.entryValue}>{entry.lunchMinutes} min</Text>
              </View>
            )}
            <View style={[styles.entryRow, styles.entryRowLast]}>
              <Ionicons name="time-outline" size={18} color={Colors.hours} />
              <Text style={styles.entryLabel}>Hours</Text>
              <Text style={[styles.entryValue, { color: Colors.hours, fontWeight: '700' }]}>
                {entry.hoursWorked.toFixed(2)}h
              </Text>
            </View>
            <View style={styles.earningsBanner}>
              <Text style={styles.earningsLabel}>Earnings</Text>
              <Text style={styles.earningsValue}>৳{entry.earnings.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              onPress={() => Alert.alert('Delete Entry', 'Delete this entry?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => removeEntry(entry.id) },
              ])}
              style={styles.deleteBtn}
            >
              <Text style={styles.deleteBtnText}>Delete Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EmptyState
            icon="time"
            title="No entry"
            subtitle="Tap + to log hours for this day"
            accentColor={Colors.hours}
          />
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
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>
            {format(weekStart, 'MMM d')} – {format(weekEnd, 'MMM d')}
          </Text>
          <TouchableOpacity onPress={() => setCurrentDate(addWeeks(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>৳{Math.round(totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {weekEntries.length === 0 ? (
          <EmptyState icon="time" title="No entries this week" subtitle="Log hours to see stats" accentColor={Colors.hours} />
        ) : (
          weekEntries.map(entry => (
            <View key={entry.id} style={styles.miniCard}>
              <Text style={styles.miniDate}>{format(parseISO(entry.date), 'EEE, MMM d')}</Text>
              <Text style={styles.miniHours}>{entry.hoursWorked.toFixed(2)}h</Text>
              <Text style={styles.miniEarnings}>৳{entry.earnings.toFixed(0)}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  const renderMonthlyView = () => {
    const monthEntries = getMonthEntries(currentDate.getFullYear(), currentDate.getMonth());

    return (
      <View style={styles.viewContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setCurrentDate(subMonths(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.navLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={() => setCurrentDate(addMonths(currentDate, 1))} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{monthStats.totalHours.toFixed(1)}h</Text>
            <Text style={styles.statLabel}>Total Hours</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>৳{Math.round(monthStats.totalEarnings)}</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
        </View>

        {monthEntries.length === 0 ? (
          <EmptyState icon="time" title="No entries this month" subtitle="Log hours to see stats" accentColor={Colors.hours} />
        ) : (
          monthEntries.map(entry => (
            <View key={entry.id} style={styles.miniCard}>
              <Text style={styles.miniDate}>{format(parseISO(entry.date), 'EEE, MMM d')}</Text>
              <Text style={styles.miniHours}>{entry.hoursWorked.toFixed(2)}h</Text>
              <Text style={styles.miniEarnings}>৳{entry.earnings.toFixed(0)}</Text>
            </View>
          ))
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Hours</Text>
          <Text style={styles.headerSub}>{monthHours}h · ৳{monthEarnings} this month</Text>
        </View>
        <TouchableOpacity onPress={() => {
          setRateInput(String(settings.hourlyRate));
          setLunchSettingEnabled(settings.lunchEnabled);
          setLunchMinsInput(String(settings.defaultLunchMinutes));
          setSettingsSheetVisible(true);
        }}>
          <Ionicons name="settings-outline" size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <SegmentedControl
        segments={['Daily', 'Weekly', 'Monthly']}
        selectedIndex={tabIndex}
        onChange={setTabIndex}
        accentColor={Colors.hours}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {tabIndex === 0 && renderDailyView()}
        {tabIndex === 1 && renderWeeklyView()}
        {tabIndex === 2 && renderMonthlyView()}
        <View style={{ height: 100 }} />
      </ScrollView>

      <FAB color={Colors.hours} onPress={() => {
        setEntryDate(format(currentDate, 'yyyy-MM-dd'));
        setLunchMinutes(String(settings.defaultLunchMinutes));
        setLunchEnabled(settings.lunchEnabled);
        setAddSheetVisible(true);
      }} />

      {/* Add Entry Sheet */}
      <BottomSheet visible={addSheetVisible} onClose={() => setAddSheetVisible(false)} title="Log Hours">
        <Text style={styles.label}>Date</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{format(parseISO(entryDate), 'MMM d, yyyy')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={parseISO(entryDate)}
            mode="date"
            display="default"
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setEntryDate(format(date, 'yyyy-MM-dd'));
            }}
          />
        )}

        <Text style={styles.label}>Clock In</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowClockInPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{formatTime12(clockIn)}</Text>
        </TouchableOpacity>
        {showClockInPicker && (
          <DateTimePicker
            value={dateFromTime(clockIn)}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowClockInPicker(false);
              if (date) setClockIn(timeFromDate(date));
            }}
          />
        )}

        <Text style={styles.label}>Clock Out</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowClockOutPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{formatTime12(clockOut)}</Text>
        </TouchableOpacity>
        {showClockOutPicker && (
          <DateTimePicker
            value={dateFromTime(clockOut)}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowClockOutPicker(false);
              if (date) setClockOut(timeFromDate(date));
            }}
          />
        )}

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Lunch Break</Text>
          <Switch
            value={lunchEnabled}
            onValueChange={setLunchEnabled}
            trackColor={{ true: Colors.hours }}
            thumbColor="#fff"
          />
        </View>

        {lunchEnabled && (
          <>
            <Text style={styles.label}>Lunch Duration (minutes)</Text>
            <TextInput
              style={styles.input}
              value={lunchMinutes}
              onChangeText={setLunchMinutes}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              placeholder="30"
            />
          </>
        )}

        <View style={styles.previewBanner}>
          <View>
            <Text style={styles.previewLabel}>Hours</Text>
            <Text style={styles.previewValue}>{previewHours().toFixed(2)}h</Text>
          </View>
          <View>
            <Text style={styles.previewLabel}>Earnings</Text>
            <Text style={styles.previewValue}>৳{previewEarnings().toFixed(2)}</Text>
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
        <Text style={styles.label}>Hourly Rate (৳)</Text>
        <TextInput
          style={styles.input}
          value={rateInput}
          onChangeText={setRateInput}
          keyboardType="numeric"
          placeholderTextColor={Colors.textMuted}
          placeholder="100"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Lunch Break by Default</Text>
          <Switch
            value={lunchSettingEnabled}
            onValueChange={setLunchSettingEnabled}
            trackColor={{ true: Colors.hours }}
            thumbColor="#fff"
          />
        </View>

        {lunchSettingEnabled && (
          <>
            <Text style={styles.label}>Default Lunch (minutes)</Text>
            <TextInput
              style={styles.input}
              value={lunchMinsInput}
              onChangeText={setLunchMinsInput}
              keyboardType="numeric"
              placeholderTextColor={Colors.textMuted}
              placeholder="30"
            />
          </>
        )}

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
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: { color: Colors.textPrimary, fontSize: 26, fontWeight: '700' },
  headerSub: { color: Colors.textSecondary, fontSize: 14, marginTop: 2 },
  scrollContent: { paddingBottom: 20 },
  viewContainer: { paddingHorizontal: 16, paddingTop: 8 },
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  navBtn: { padding: 8 },
  navLabel: { color: Colors.textPrimary, fontSize: 16, fontWeight: '600' },
  statRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { color: Colors.hours, fontSize: 22, fontWeight: '700' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  entryCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
  },
  entryRowLast: { borderBottomWidth: 0 },
  entryLabel: { flex: 1, color: Colors.textSecondary, fontSize: 14 },
  entryValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '500' },
  earningsBanner: {
    backgroundColor: Colors.hours + '20',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  earningsLabel: { color: Colors.textSecondary, fontSize: 14 },
  earningsValue: { color: Colors.hours, fontSize: 20, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', marginTop: 12 },
  deleteBtnText: { color: Colors.danger, fontSize: 14 },
  miniCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    alignItems: 'center',
  },
  miniDate: { flex: 1, color: Colors.textPrimary, fontSize: 14 },
  miniHours: { color: Colors.hours, fontSize: 14, fontWeight: '600', marginRight: 16 },
  miniEarnings: { color: Colors.textSecondary, fontSize: 14 },
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
    justifyContent: 'center',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: { color: Colors.textPrimary, fontSize: 15 },
  previewBanner: {
    backgroundColor: Colors.elevated,
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  previewLabel: { color: Colors.textMuted, fontSize: 12, textAlign: 'center' },
  previewValue: { color: Colors.hours, fontSize: 18, fontWeight: '700', textAlign: 'center', marginTop: 2 },
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
