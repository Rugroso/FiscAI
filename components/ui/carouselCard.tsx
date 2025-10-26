import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';

const { width } = Dimensions.get('window');

interface CarouselItem {
  id: string;
  title1: string;
  title2: string;
}

interface CarouselCardProps {
  data: CarouselItem[];
  interval?: number; // tiempo en ms entre slides (opcional)
}

export default function CarouselCard({ data, interval = 3000 }: CarouselCardProps) {
  const flatListRef = useRef<FlatList<CarouselItem>>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (index + 1) % data.length;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setIndex(nextIndex);
    }, interval);

    return () => clearInterval(timer);
  }, [index, data.length, interval]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title1}</Text>
            <Text style={styles.subtitle}>{item.title2}</Text>
          </View>
        )}
      />

      {/* Paginación */}
      <View style={styles.pagination}>
        {data.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i === index ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  card: {
    width: width * 0.8,
    height: 120,
    backgroundColor: 'white',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
title: {
  fontSize: 20,
  fontWeight: '800',
  marginVertical: 2,
  color: '#E80000',
  textTransform: 'uppercase',
},
subtitle: {
  fontSize: 16,
  fontWeight: '500',
  color: '#333',
},
  pagination: {
    flexDirection: 'row',
    marginTop: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#d32f2f',
  },
  dotInactive: {
    backgroundColor: '#cccccc',
  },
});
