import React, { useState, useEffect } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';

interface EventCardProps {
  logoSrc: any;
  eventName: string;
  apiEndpoint: string;
  totalSeats: number;
}

export default function EventCard({ logoSrc, eventName, apiEndpoint, totalSeats }: EventCardProps) {
  const [filledSeats, setFilledSeats] = useState<number>(0);
  const [availableSeats, setAvailableSeats] = useState<number>(totalSeats);
  const [waterLevel, setWaterLevel] = useState(new Animated.Value(0)); // For water animation

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats || totalSeats; // Ensure it's defined
        const filledSeats = totalSeats - availableSeats;

        setFilledSeats(filledSeats);
        setAvailableSeats(availableSeats);

        // Animate the water level
        Animated.timing(waterLevel, {
          toValue: (filledSeats / totalSeats) * 100,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats]);

  return (
    <View style={styles.card}>
      {/* Water Effect */}
      <View style={styles.waterContainer}>
        <Animated.View
          style={[
            styles.water,
            {
              height: waterLevel.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>

      {/* Logo and Counter */}
      <View style={styles.contentContainer}>
        <Image source={logoSrc} style={styles.logo} />
        <Text style={styles.counter}>{filledSeats || 0}</Text>
      </View>

      {/* Total Seats and Seats Left */}
      <View style={styles.seatsInfoContainer}>
        <Text style={styles.text}>Total Seats: {totalSeats || 0}</Text>
        <Text style={styles.text}>Seats Left: {availableSeats || 0}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260, // Adjust the width for better alignment
    height: 300, // Adjust the height to make the card shorter
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d', // Lighter black background for the card
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Lighter border to differentiate from background
    position: 'relative', // For overlaying text on water
  },
  waterContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#1a1a1a', // Lighter black for the water container
    overflow: 'hidden', // Make sure water stays inside the container
    zIndex: 1, // Water container is below content
  },
  water: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '200%', // Simulating a wave effect
    backgroundColor: 'rgba(50, 150, 255, 0.6)', // Water color
  },
  contentContainer: {
    zIndex: 2, // Ensures the content stays on top of the water
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30, // Lower margin to move the logo down
  },
  logo: {
    width: 70, // Make logo bigger
    height: 70, // Make logo bigger
    resizeMode: 'contain',
    marginBottom: 10, // Space below the logo
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20, // Lower the counter to be more centered
  },
  seatsInfoContainer: {
    zIndex: 2,
    position: 'absolute', // Absolute positioning to align under the counter
    bottom: 20, // Adjust based on your illustration
    alignItems: 'center',
    width: '100%',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
});
