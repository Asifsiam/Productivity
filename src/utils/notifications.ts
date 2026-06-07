import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Supplement } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('supplement-reminders', {
      name: 'Supplement Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Cancel all scheduled notifications for a supplement, then reschedule if it has a reminder time. */
export async function scheduleSupplementReminder(supplement: Supplement): Promise<void> {
  // Cancel existing notifications for this supplement
  await cancelSupplementReminder(supplement.id);

  if (!supplement.reminderTime) return;

  const [hour, minute] = supplement.reminderTime.split(':').map(Number);

  if (supplement.scheduleType === 'daily') {
    await Notifications.scheduleNotificationAsync({
      identifier: `supp-${supplement.id}`,
      content: {
        title: `Time for ${supplement.name}`,
        body: supplement.dose ? `Dose: ${supplement.dose}` : 'Mark as taken in the app.',
        data: { supplementId: supplement.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
    return;
  }

  if (supplement.scheduleType === 'specific_days' && supplement.scheduleDays?.length) {
    // Schedule one notification per selected weekday (1=Sun … 7=Sat in expo API)
    for (const day of supplement.scheduleDays) {
      await Notifications.scheduleNotificationAsync({
        identifier: `supp-${supplement.id}-day${day}`,
        content: {
          title: `Time for ${supplement.name}`,
          body: supplement.dose ? `Dose: ${supplement.dose}` : 'Mark as taken in the app.',
          data: { supplementId: supplement.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo uses 1=Sun, our data uses 0=Sun
          hour,
          minute,
        },
      });
    }
    return;
  }

  if (supplement.scheduleType === 'cycle') {
    // For cycle mode: schedule a daily notification — the app itself tracks
    // whether today is an "on" day and can show/suppress accordingly.
    // We schedule daily and rely on the user seeing the supplement card status.
    await Notifications.scheduleNotificationAsync({
      identifier: `supp-${supplement.id}`,
      content: {
        title: `Time for ${supplement.name}`,
        body: supplement.dose ? `Dose: ${supplement.dose}` : 'Check your cycle schedule.',
        data: { supplementId: supplement.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

export async function cancelSupplementReminder(supplementId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled
    .filter(n => n.identifier.startsWith(`supp-${supplementId}`))
    .map(n => n.identifier);

  await Promise.all(toCancel.map(id => Notifications.cancelScheduledNotificationAsync(id)));
}
