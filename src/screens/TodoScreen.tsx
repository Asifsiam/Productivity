import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Colors } from '@/constants/colors';
import { useTodos } from '@/hooks/useTodos';
import { FAB } from '@/components/FAB';
import { BottomSheet } from '@/components/BottomSheet';
import { EmptyState } from '@/components/EmptyState';
import type { Todo } from '@/types';

export function TodoScreen() {
  const { todos, loading, pending, completed, skipped, addTodo, updateStatus, deleteTodo } = useTodos();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [text, setText] = useState('');

  const handleSave = async () => {
    if (!text.trim()) {
      Alert.alert('Validation', 'Please enter a task.');
      return;
    }
    await addTodo(text.trim());
    setText('');
    setSheetVisible(false);
  };

  const handleDelete = (todo: Todo) => {
    Alert.alert('Delete Task', `Delete "${todo.text}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteTodo(todo.id) },
    ]);
  };

  const renderTodo = ({ item }: { item: Todo }) => {
    const isPending = item.status === 'pending';
    const isDone = item.status === 'completed';
    const isSkipped = item.status === 'skipped';

    return (
      <TouchableOpacity
        style={[styles.card, isPending && styles.cardPending]}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardInner}>
          {isDone && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.statusIcon} />
          )}
          {isSkipped && (
            <Ionicons name="close-circle" size={20} color={Colors.textMuted} style={styles.statusIcon} />
          )}
          <View style={styles.todoText}>
            <Text style={[
              styles.todoLabel,
              (isDone || isSkipped) && styles.todoLabelDone,
            ]}>
              {item.text}
            </Text>
            <Text style={styles.todoDate}>
              {format(new Date(item.createdAt), 'MMM d, h:mm a')}
            </Text>
          </View>
        </View>
        {isPending && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.doneBtn]}
              onPress={() => updateStatus(item.id, 'completed')}
            >
              <Text style={styles.doneBtnText}>Complete</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.skipBtn]}
              onPress={() => updateStatus(item.id, 'skipped')}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  type Section = { title: string; data: Todo[] };

  const sections: Section[] = [
    { title: 'Pending', data: pending },
    { title: 'Completed', data: completed },
    { title: 'Skipped', data: skipped },
  ].filter(s => s.data.length > 0);

  const allEmpty = todos.length === 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>To-Do</Text>
        <Text style={styles.headerSub}>
          {completed.length}/{todos.length} completed
        </Text>
      </View>

      {!loading && allEmpty ? (
        <EmptyState
          icon="checkmark-circle"
          title="No tasks yet"
          subtitle="Tap + to add your first task"
          accentColor={Colors.todo}
        />
      ) : (
        <FlatList
          data={sections}
          keyExtractor={item => item.title}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: section }) => (
            <View>
              <Text style={styles.sectionHeader}>{section.title}</Text>
              {section.data.map(todo => (
                <View key={todo.id}>{renderTodo({ item: todo })}</View>
              ))}
            </View>
          )}
        />
      )}

      <FAB color={Colors.todo} onPress={() => setSheetVisible(true)} />

      <BottomSheet
        visible={sheetVisible}
        onClose={() => { setText(''); setSheetVisible(false); }}
        title="Add Task"
      >
        <Text style={styles.label}>Task *</Text>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="What do you need to do?"
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.todo }]} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Task</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setText(''); setSheetVisible(false); }} style={styles.cancelBtn}>
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
  sectionHeader: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  cardPending: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.todo,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  statusIcon: { marginRight: 8, marginTop: 2 },
  todoText: { flex: 1 },
  todoLabel: { color: Colors.textPrimary, fontSize: 15, lineHeight: 22 },
  todoLabelDone: {
    color: Colors.textMuted,
    textDecorationLine: 'line-through',
  },
  todoDate: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
    borderWidth: 1,
  },
  doneBtn: { borderColor: Colors.success },
  doneBtnText: { color: Colors.success, fontSize: 13, fontWeight: '500' },
  skipBtn: { borderColor: Colors.textMuted },
  skipBtnText: { color: Colors.textMuted, fontSize: 13, fontWeight: '500' },
  label: { color: Colors.textSecondary, fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 4 },
  input: {
    backgroundColor: Colors.elevated,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 15,
    minHeight: 80,
  },
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
