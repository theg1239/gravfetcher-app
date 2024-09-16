import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';

interface EventCardProps {
  logoSrc: any;
  eventName: string;
  apiEndpoint: string;
  totalSeats: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

export default function EventCard({
  logoSrc,
  eventName,
  apiEndpoint,
  totalSeats,
}: EventCardProps) {
  const [filledSeats, setFilledSeats] = useState<number>(0);
  const [availableSeats, setAvailableSeats] = useState<number>(totalSeats);
  const [confettiVisible, setConfettiVisible] = useState(false);
  const previousFilledSeatsRef = useRef<number>(0); // To track the previous filled seat count
  const isInitialLoad = useRef(true); // To detect the initial load

  // Shared values for water level and wave animation
  const waterLevel = useSharedValue(0);
  const waveOffset = useSharedValue(0);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats || totalSeats;
        const newFilledSeats = totalSeats - availableSeats;

        setFilledSeats(newFilledSeats);
        setAvailableSeats(availableSeats);

        // Animate water level based on filled seats
        waterLevel.value = withTiming(newFilledSeats / totalSeats, {
          duration: 1000,
        });

        // If it's not the initial load, check for milestones
        if (!isInitialLoad.current) {
          const previousHundreds = Math.floor(previousFilledSeatsRef.current / 100);
          const currentHundreds = Math.floor(newFilledSeats / 100);

          // Check if newFilledSeats has crossed into a new hundred
          if (
            newFilledSeats > previousFilledSeatsRef.current &&
            currentHundreds > previousHundreds
          ) {
            // Trigger confetti
            setConfettiVisible(true);
            setTimeout(() => setConfettiVisible(false), 5000); // Hide confetti after 5 seconds
          }
        } else {
          // Set the initial load flag to false after the first data fetch
          isInitialLoad.current = false;
        }

        // Update the previous filledSeats value
        previousFilledSeatsRef.current = newFilledSeats;
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, eventName]);

  // Animate the wave offset
  useEffect(() => {
    waveOffset.value = withRepeat(
      withTiming(-Math.PI * 2, {
        duration: 5000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [waveOffset]);

  // Animated props for the wave path
  const animatedProps = useAnimatedProps(() => {
    const width = 260; // Card width
    const height = 300; // Card height
    const waterHeight = waterLevel.value * height; // Water level based on filled seats

    // Wave parameters
    const amplitude = 10; // Wave amplitude
    const frequency = (2 * Math.PI) / width;

    // Wave offset for animation
    const offset = waveOffset.value;

    // Generate the wave path
    let path = `M0 ${height}`;
    path += ` L0 ${height - waterHeight}`;

    const step = 5; // Increase or decrease for smoother or coarser waves

    for (let x = 0; x <= width; x += step) {
      const theta = frequency * x + offset;
      const y = amplitude * Math.sin(theta) + (height - waterHeight);
      path += ` L${x} ${y}`;
    }

    path += ` L${width} ${height}`;
    path += ' Z';

    return {
      d: path,
    };
  });

  return (
    <View style={styles.card}>
      {/* Water Effect */}
      <Svg
        style={StyleSheet.absoluteFill}
        width="100%"
        height="100%"
        viewBox={`0 0 260 300`}
      >
        <Defs>
          <ClipPath id="clip">
            <Rect x="0" y="0" width="260" height="300" rx="12" ry="12" />
          </ClipPath>
        </Defs>
        <AnimatedPath
          animatedProps={animatedProps}
          fill="rgba(50, 150, 255, 0.6)"
          clipPath="url(#clip)"
        />
      </Svg>

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

      {/* Confetti Cannon */}
      {confettiVisible && (
        <View style={styles.confettiContainer}>
          <ConfettiCannon
            count={100}
            origin={{ x: 130, y: 0 }} // Center the confetti at the top of the card
            fadeOut={true}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    position: 'relative',
  },
  contentContainer: {
    zIndex: 1, // Keep content below confetti
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  logo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    marginBottom: 10,
  },
  counter: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
  },
  seatsInfoContainer: {
    zIndex: 1, // Keep content below confetti
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3, // Make sure confetti is above everything else
    pointerEvents: 'none', // Prevent blocking interactions
  },
});
