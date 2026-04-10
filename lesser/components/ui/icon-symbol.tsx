// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<SymbolViewProps['name'], ComponentProps<typeof MaterialIcons>['name']>;
export type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping.
 * See https://icons.expo.fyi for all available Material Icons.
 */
const MAPPING = {
  // Navigation & tabs
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'person.2.fill': 'group',
  'gearshape.fill': 'settings',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'chevron.left': 'chevron-left',
  'plus': 'add',

  // Status & feedback
  'flame.fill': 'local-fire-department',
  'clock.fill': 'schedule',
  'star.fill': 'star',
  'checkmark.circle.fill': 'check-circle',
  'xmark.circle.fill': 'cancel',
  'exclamationmark.triangle.fill': 'warning',
  'bell.fill': 'notifications',
  'lock.fill': 'lock',
  'lock.shield.fill': 'security',
  'bolt.fill': 'bolt',
  'calendar': 'calendar-month',
  'timer': 'timer',

  // Media & social
  'camera.fill': 'photo-camera',
  'music.note': 'music-note',
  'message.fill': 'message',
  'tv.fill': 'tv',
  'bubble.right.fill': 'chat',
  'app.fill': 'apps',
  'square.and.arrow.up': 'share',
  'person.crop.circle.badge.exclamationmark': 'person-remove',

  // Charts & stats
  'chart.bar.fill': 'bar-chart',
  'chart.bar.xaxis': 'bar-chart',
  'chart.line.uptrend.xyaxis': 'trending-up',

  // Settings / profile
  'person.fill': 'person',
  'person.2.fill.alt': 'group',
  'map.fill': 'map',
  'play.circle.fill': 'play-circle',
  'building.columns.fill': 'account-balance',
  'arrow.right.square': 'logout',
  'key.fill': 'key',
  'pencil': 'edit',
  'photo': 'image',
  'leaf.fill': 'eco',
  'shield.fill': 'shield',
  'figure.walk': 'directions-walk',
  'brain.head.profile': 'psychology',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name] ?? 'help-outline'} style={style} />;
}
