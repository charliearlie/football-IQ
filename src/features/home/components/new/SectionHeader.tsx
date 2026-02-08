import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Clock } from 'lucide-react-native';
import { HOME_COLORS, HOME_FONTS } from '@/theme/home-design';

export function SectionHeader() {
  const [timeString, setTimeString] = useState('');
  const [hoursLeft, setHoursLeft] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setHoursLeft(hours);
      setTimeString(`${hours}H ${minutes}M`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  const timerColor = hoursLeft >= 6 ? '#FFFFFF' : HOME_COLORS.redCard;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>TODAY'S CHALLENGES</Text>
      <View style={styles.timerBadge}>
        <Clock size={16} color={timerColor} />
        <Text style={[styles.timerText, { color: timerColor }]}>{timeString}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Fixed alignment
    paddingHorizontal: 24,
    paddingBottom: 12, 
    marginTop: 24,
  },
  title: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timerText: {
    fontFamily: HOME_FONTS.heading,
    fontSize: 18, // Bigger
    marginTop: 2,
  }
});
