import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { Card, ProgressBar } from 'react-native-paper';

interface EventCardProps {
  logoSrc: any;
  eventName: string;
  apiEndpoint: string;
  totalSeats: number;
}

const { height } = Dimensions.get('window'); 

export default function EventCard({ logoSrc, eventName, apiEndpoint, totalSeats }: EventCardProps) {
  const [filledSeats, setFilledSeats] = useState<number>(0);
  const [availableSeats, setAvailableSeats] = useState<number>(totalSeats);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const newAvailableSeats = data.availableSeats ?? totalSeats;
        const newFilledSeats = totalSeats - newAvailableSeats;

        setFilledSeats(newFilledSeats);
        setAvailableSeats(newAvailableSeats);
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, eventName]);

  const progress = filledSeats / totalSeats;

  return (
    <Card style={[styles.card, { height: height * 0.40 }]}>
      <View style={styles.contentContainer}>
        <View style={styles.header}>
          <Image source={logoSrc} style={styles.logo} />
          <Text style={styles.eventName}>{eventName}</Text>
        </View>

        <View style={styles.centerContent}>
          <Text style={styles.counter}>{filledSeats}</Text>
          <ProgressBar progress={progress} color={'#3b82f6'} style={styles.progressBar} />
        </View>

        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <Text style={styles.text}>Total Seats:</Text>
            <Text style={styles.textValue}>{totalSeats}</Text>
          </View>
          <View style={styles.footerItem}>
            <Text style={styles.text}>Seats Left:</Text>
            <Text style={styles.textValue}>{availableSeats}</Text>
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#1e1e1e',
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  footerItem: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    color: '#a9a9a9',
    marginRight: 5,
  },
  textValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
