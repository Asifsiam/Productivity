import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '@/constants/colors';
import { useRoutine } from '@/hooks/useRoutine';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import type { RoutineBlock } from '@/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6–23
const BLOCK_COLORS = ['#7C6EFA', '#22C55E', '#F59E0B', '#F97316', '#3B82F6', '#EC4899', '#14B8A6'];

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hh = h % 12 || 12;
  return `${hh}:${m.toString().padStart(2, '0')} ${ampm}`;
}

const TIMELINE_HEIGHT = 60; // px per hour

export function RoutineScreen() {
  const { getBlocksForDay, addBlock, removeBlock } = useRoutine();
  const today = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState(today);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Form state
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [colorIndex, setColorIndex] = useState(0);

  const blocks = getBlocksForDay(selectedDay);

  const resetForm = () => {
    setLabel('');
    setStartTime('08:00');
    setEndTime('09:00');
    setColorIndex(0);
    setShowStartPicker(false);
    setShowEndPicker(false);
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Validation', 'Please enter a label.');
      return;
    }
    if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
      Alert.alert('Validation', 'End time must be after start time.');
      return;
    }

    const block: RoutineBlock = {
      id: Date.now().toString(),
      label: label.trim(),
      startTime,
      endTime,
      color: BLOCK_COLORS[colorIndex],
    };

    const success = await addBlock(selectedDay, block);
    if (!success) {
      Alert.alert('Overlap', 'This block overlaps with an existing block. Please choose a different time.');
      return;
    }
    resetForm();
    setSheetVisible(false);
  };

  const handleDeleteBlock = (block: RoutineBlock) => {
    Alert.alert('Delete Block', `Delete "${block.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeBlock(selectedDay, block.id) },
    ]);
  };

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

  const durationLabel = () => {
    const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
    if (diff <= 0) return '';
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routine</Text>
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dayScroll}
      >
        {DAYS.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dayPill, selectedDay === i && styles.dayPillActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayPillText, selectedDay === i && styles.dayPillTextActive]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeline */}
      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent}>
        <View style={styles.timelineInner}>
          {/* Hour labels */}
          <View style={styles.hourLabels}>
            {HOURS.map(h => (
              <View key={h} style={{ height: TIMELINE_HEIGHT, justifyContent: 'flex-start' }}>
                <Text style={styles.hourLabel}>
                  {h.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          {/* Blocks area */}
          <View style={styles.blocksArea}>
            {/* Grid lines */}
            {HOURS.map(h => (
              <View key={h} style={[styles.gridLine, { top: (h - 6) * TIMELINE_HEIGHT }]} />
            ))}

            {blocks.map(block => {
              const startMin = timeToMinutes(block.startTime);
              const endMin = timeToMinutes(block.endTime);
              const top = (startMin / 60 - 6) * TIMELINE_HEIGHT;
              const height = ((endMin - startMin) / 60) * TIMELINE_HEIGHT;
              const dur = endMin - startMin;
              const dh = Math.floor(dur / 60);
              const dm = dur % 60;
              const durStr = dh > 0 ? `${dh}h${dm > 0 ? ` ${dm}m` : ''}` : `${dm}m`;

              return (
                <View
                  key={block.id}
                  style={[
                    styles.block,
                    { top, height, backgroundColor: block.color + 'CC', borderLeftColor: block.color },
                  ]}
                >
                  <View style={styles.blockContent}>
                    <Text style={styles.blockLabel} numberOfLines={1}>{block.label}</Text>
                    <Text style={styles.blockDur}>{durStr}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteBlock(block)} style={styles.blockDelete} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
                    <Text style={{ fontSize: 13 }}>🗑</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {blocks.length === 0 && (
          <View style={styles.emptyTimeline}>
            <Text style={styles.emptyTimelineText}>No blocks for {DAYS[selectedDay]}</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add Block button */}
      <TouchableOpacity
        style={styles.addBlockBtn}
        onPress={() => setSheetVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.addBlockText}>+ Add Block</Text>
      </TouchableOpacity>

      <BottomSheet visible={sheetVisible} onClose={() => { resetForm(); setSheetVisible(false); }} title="Add Routine Block">
        <Text style={styles.label}>Label *</Text>
        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Morning Workout"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Start Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowStartPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{formatTime(startTime)}</Text>
        </TouchableOpacity>

        {showStartPicker && (
          <DateTimePicker
            value={dateFromTime(startTime)}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartTime(timeFromDate(date));
            }}
          />
        )}

        <Text style={styles.label}>End Time</Text>
        <TouchableOpacity style={styles.input} onPress={() => setShowEndPicker(true)}>
          <Text style={{ color: Colors.textPrimary }}>{formatTime(endTime)}</Text>
        </TouchableOpacity>

        {showEndPicker && (
          <DateTimePicker
            value={dateFromTime(endTime)}
            mode="time"
            display="default"
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndTime(timeFromDate(date));
            }}
          />
        )}

        {durationLabel() !== '' && (
          <Text style={styles.durationPreview}>Duration: {durationLabel()}</Text>
        )}

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorRow}>
          {BLOCK_COLORS.map((c, i) => (
            <TouchableOpacity
              key={c}
              style={[styles.colorDot, { backgroundColor: c }, colorIndex === i && styles.colorDotSelected]}
              onPress={() => setColorIndex(i)}
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.routine }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Block</Text>
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { color: Colors.textPrimary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  dayScroll: { paddingHorizontal: 12, paddingBottom: 12, gap: 8, flexDirection: 'row' },
  dayPill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayPillActive: { backgroundColor: Colors.routine, borderColor: Colors.routine },
  dayPillText: { color: Colors.textMuted, fontSize: 14, fontWeight: '600' },
  dayPillTextActive: { color: '#fff', fontWeight: '700' },
  timeline: { flex: 1 },
  timelineContent: { paddingBottom: 20 },
  timelineInner: { flexDirection: 'row', paddingHorizontal: 8 },
  hourLabels: { width: 52 },
  hourLabel: { color: Colors.textMuted, fontSize: 11, lineHeight: 16 },
  blocksArea: {
    flex: 1,
    position: 'relative',
    minHeight: 18 * 60,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Colors.border,
  },
  block: {
    position: 'absolute',
    left: 4,
    right: 4,
    borderRadius: 6,
    borderLeftWidth: 3,
    padding: 4,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  blockContent: { flex: 1 },
  blockDelete: { padding: 2, alignSelf: 'flex-start' },
  blockLabel: { color: '#fff', fontSize: 12, fontWeight: '600' },
  blockDur: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  emptyTimeline: { alignItems: 'center', paddingTop: 40 },
  emptyTimelineText: { color: Colors.textMuted, fontSize: 14 },
  addBlockBtn: {
    margin: 16,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.routine,
    alignItems: 'center',
  },
  addBlockText: { color: Colors.routine, fontSize: 15, fontWeight: '600' },
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
  durationPreview: { color: Colors.routine, fontSize: 13, marginTop: 8, fontWeight: '500' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginTop: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 2.5, borderColor: '#fff' },
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
