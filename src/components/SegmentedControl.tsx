import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface SegmentedControlProps {
  segments: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  accentColor: string;
}

export function SegmentedControl({ segments, selectedIndex, onChange, accentColor }: SegmentedControlProps) {
  return (
    <View style={styles.container}>
      {segments.map((segment, index) => {
        const isActive = index === selectedIndex;
        return (
          <TouchableOpacity
            key={segment}
            onPress={() => onChange(index)}
            style={[
              styles.segment,
              isActive && { backgroundColor: accentColor },
            ]}
            activeOpacity={0.7}
          >
            <Text style={[styles.segmentText, isActive && styles.activeText]}>
              {segment}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.elevated,
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  segmentText: {
    color: Colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
