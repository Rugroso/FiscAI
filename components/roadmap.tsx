import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export type RoadmapStep = {
  key: string;
  title: string;
  subtitle?: string;
  status?: 'locked' | 'active' | 'done';
};

type Props = {
  steps: RoadmapStep[];
  currentIndex?: number;
  onStepPress?: (key: string, index: number) => void;
  title?: string;
  goalTitle?: string;
  goalSubtitle?: string;
  showPercent?: boolean;
  onGoalPress?: () => void;
  variant?: 'full' | 'summary';
  onOpenFull?: () => void; // used in summary variant
  orientation?: 'horizontal' | 'vertical';
  progressTitle?: string; // label shown near percentage
};

export function Roadmap({ steps, currentIndex = 0, onStepPress, title = 'Roadmap fiscal', goalTitle = 'Meta: Empresa formal y al día', goalSubtitle = 'Cumplimiento completo', showPercent = true, onGoalPress, variant = 'full', onOpenFull, orientation = 'horizontal', progressTitle = 'Avance' }: Props) {
  const scheme = useColorScheme();
  const theme = Colors[scheme ?? 'light'] as any;
  const progressPct = steps.length > 1 ? (currentIndex / (steps.length - 1)) : 0;
  const anim = React.useRef(new Animated.Value(progressPct)).current;
  React.useEffect(() => {
    Animated.timing(anim, { toValue: progressPct, duration: 300, useNativeDriver: false }).start();
  }, [progressPct]);

  const handlePress = (s: RoadmapStep, i: number) => {
    if (s.status === 'locked') return;
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch {}
    onStepPress?.(s.key, i);
  };

  if (variant === 'summary') {
    return (
      <View style={[styles.container]}> 
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: theme.surface, borderColor: theme.text }]}>
            <MaterialCommunityIcons name="office-building" size={20} color={theme.text} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.summaryRow}>
          {showPercent && (
            <View style={{ flexDirection: 'column' }}>
              <Text style={[styles.progressLabel, { color: theme.muted || '#6B6B6B' }]}>{progressTitle}</Text>
              <Text style={[styles.summaryPercent, { color: theme.progressPrimary }]}>{Math.round(Math.max(0, Math.min(1, progressPct)) * 100)}%</Text>
            </View>
          )}
          <TouchableOpacity onPress={onOpenFull} accessibilityRole="button" style={styles.summaryMoreButton}>
            <Feather name="external-link" size={22} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (orientation === 'vertical') {
    return (
      <View style={[styles.container]}>
        <View style={styles.header}>
          <View style={[styles.iconBadge, { backgroundColor: theme.surface, borderColor: theme.text }]}>
            <MaterialCommunityIcons name="office-building" size={20} color={theme.text} />
          </View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
        </View>
        <View style={styles.progressHeader}>
          <View>
            {showPercent && (
              <>
                <Text style={[styles.progressLabel, { color: theme.muted || '#6B6B6B' }]}>{progressTitle}</Text>
                <Text style={[styles.percentBig, { color: theme.progressPrimary }]}>{Math.round(Math.max(0, Math.min(1, progressPct)) * 100)}%</Text>
              </>
            )}
          </View>
          <Text style={[styles.subtitle, { color: theme.muted || '#6B6B6B' }]}>Tu avance hacia la formalización</Text>
        </View>
        <View style={styles.progressWrap}>
          <View style={[styles.progressTrack, { backgroundColor: theme.progressTrack }]} />
          <Animated.View style={[styles.progressFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: theme.progressPrimary }]} />
        </View>

        <View style={styles.verticalList}>
          {steps.map((s, i) => {
            const isDone = s.status === 'done' || i < currentIndex;
            const isActive = s.status === 'active' || i === currentIndex;
            const isLocked = s.status === 'locked';

            const indicatorStyle = [
              styles.indicator,
              { borderColor: isLocked ? (theme.border || '#C7C7C7') : theme.progressPrimary },
              isDone && { backgroundColor: theme.progressPrimary, borderColor: theme.progressPrimary },
              isActive && !isDone && { borderColor: theme.progressPrimary },
            ];

            return (
              <TouchableOpacity key={s.key} style={styles.verticalItem} onPress={() => !isLocked && onStepPress?.(s.key, i)} activeOpacity={isLocked ? 1 : 0.7}>
                <View style={indicatorStyle}>
                  {isDone ? (
                    <MaterialCommunityIcons name="check" size={14} color={theme.surface || theme.background} />
                  ) : isLocked ? (
                    <MaterialCommunityIcons name="lock" size={14} color={theme.muted || '#9B9B9B'} />
                  ) : (
                    <MaterialCommunityIcons name="target" size={14} color={theme.progressPrimary} />
                  )}
                </View>
                <View style={styles.verticalTextWrap}>
                  <Text style={[styles.stepTitleRow, { color: isLocked ? (theme.muted || '#9B9B9B') : theme.text }]}>{s.title}</Text>
                  {!!s.subtitle && <Text style={[styles.stepSubtitleRow, { color: theme.muted || '#6B6B6B' }]}>{s.subtitle}</Text>}
                </View>
                <TouchableOpacity style={styles.moreLink} onPress={() => onStepPress?.(s.key, i)} disabled={isLocked}>
                  <Feather name="external-link" size={20} color="#FF0000" />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {/* Goal row */}
          <TouchableOpacity style={styles.verticalItem} onPress={onGoalPress}>
            <View style={[styles.indicator, { borderColor: theme.progressPrimary, backgroundColor: theme.surface }] }>
              <MaterialCommunityIcons name="office-building-outline" size={14} color={theme.progressPrimary} />
            </View>
            <View style={styles.verticalTextWrap}>
              <Text style={[styles.stepTitleRow, { color: theme.text }]}>{goalTitle}</Text>
              <Text style={[styles.stepSubtitleRow, { color: theme.muted || '#6B6B6B' }]}>{goalSubtitle}</Text>
            </View>
            <Feather name="external-link" size={20} color="#FF0000" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container]}> 
      <View style={styles.header}>
        <View style={[styles.iconBadge, { backgroundColor: theme.surface, borderColor: theme.text }]}>
          <MaterialCommunityIcons name="office-building" size={20} color={theme.text} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{title}</Text>
      </View>

      <View style={styles.progressHeader}>
        {showPercent && (
          <Text style={[styles.percent, { color: theme.accent }]}>{Math.round(Math.max(0, Math.min(1, progressPct)) * 100)}%</Text>
        )}
        <Text style={[styles.subtitle, { color: theme.muted || '#6B6B6B' }]}>Tu avance hacia la formalización</Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: theme.progressTrack }]} />
        <Animated.View style={[styles.progressFill, { width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }), backgroundColor: theme.progressPrimary }]} />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepsRow}
      >
        {steps.map((s, i) => {
          const isDone = s.status === 'done' || i < currentIndex;
          const isActive = s.status === 'active' || i === currentIndex;
          const isLocked = s.status === 'locked';

          const circleStyle = [
            styles.circle,
            { borderColor: isLocked ? (theme.border || '#C7C7C7') : (theme.text) },
            isDone && { backgroundColor: theme.progressPrimary, borderColor: theme.progressPrimary },
            isActive && !isDone && { borderColor: theme.progressPrimary },
          ];

          const titleColor = isLocked ? (theme.muted || '#9B9B9B') : theme.text;
          const subtitleColor = isLocked ? (theme.muted || '#B0B0B0') : (theme.muted || '#6B6B6B');

          return (
            <TouchableOpacity
              key={s.key}
              style={styles.step}
              onPress={() => handlePress(s, i)}
              activeOpacity={isLocked ? 1 : 0.7}
            >
              <View style={circleStyle}>
                {isDone ? (
                  <MaterialCommunityIcons name="check" size={16} color={theme.surface || theme.background} />
                ) : isLocked ? (
                  <MaterialCommunityIcons name="lock" size={16} color="#9B9B9B" />
                ) : isActive ? (
                  <MaterialCommunityIcons name="target" size={16} color={theme.progressPrimary} />
                ) : (
                  <MaterialCommunityIcons name="dots-horizontal" size={16} color={theme.text} />
                )}
              </View>
              <Text style={[styles.stepTitle, { color: titleColor }]} numberOfLines={1}>
                {s.title}
              </Text>
              {!!s.subtitle && (
                <Text style={[styles.stepSubtitle, { color: subtitleColor }]} numberOfLines={1}>
                  {s.subtitle}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}

        {/* Goal Tile */}
        <TouchableOpacity style={[styles.goalTile, { borderColor: theme.progressPrimary }]} onPress={onGoalPress} activeOpacity={0.8}>
          <View style={[styles.goalIcon, { backgroundColor: theme.surface || theme.background, borderColor: theme.progressPrimary }]}>
            <MaterialCommunityIcons name="office-building-outline" size={20} color={theme.progressPrimary} />
          </View>
          <Text style={[styles.goalTitle, { color: theme.text }]} numberOfLines={1}>{goalTitle}</Text>
          <Text style={[styles.goalSubtitle, { color: theme.muted || '#6B6B6B' }]} numberOfLines={1}>{goalSubtitle}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryPercent: {
    fontSize: 34,
    fontWeight: '800',
  },
  summaryButton: {
    padding: 4,
  },
  summaryMoreButton: {
    padding: 6,
  },
  percentBig: {
    fontSize: 36,
    fontWeight: '900',
  },
  verticalList: {
    marginTop: 8,
    gap: 8,
  },
  verticalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
  },
  indicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  verticalTextWrap: {
    flex: 1,
  },
  stepTitleRow: {
    fontSize: 15,
    fontWeight: '700',
  },
  stepSubtitleRow: {
    fontSize: 12,
  },
  moreLink: {
    padding: 6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  percent: {
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  progressLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  progressWrap: {
    position: 'relative',
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    borderRadius: 6,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 6,
  },
  stepsRow: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    alignItems: 'flex-start',
  },
  step: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
  goalTile: {
    width: 160,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginLeft: 8,
    alignItems: 'center',
  },
  goalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  goalSubtitle: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default Roadmap;
