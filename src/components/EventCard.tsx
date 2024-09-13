import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import Svg, { Path, Defs, ClipPath, Rect } from 'react-native-svg';
import Animated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';

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

  // Shared values for water level and wave animation
  const waterLevel = useSharedValue(0);
  const wavePhase = useSharedValue(0);

  // Use AnimatedSensor for gyroscope data
  const animatedSensor = useAnimatedSensor(SensorType.GYROSCOPE);

  useEffect(() => {
    // Start the wave animation
    wavePhase.value = withRepeat(
      withTiming(2 * Math.PI, { duration: 5000, easing: Easing.linear }),
      -1,
      false
    );
  }, [wavePhase]);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        const response = await fetch(apiEndpoint);
        const data = await response.json();
        const availableSeats = data.availableSeats || totalSeats;
        const filledSeats = totalSeats - availableSeats;

        setFilledSeats(filledSeats);
        setAvailableSeats(availableSeats);

        // Animate water level based on filled seats
        waterLevel.value = withTiming(filledSeats / totalSeats, {
          duration: 1000,
        });
      } catch (error) {
        console.error(`Error fetching seat data for ${eventName}:`, error);
      }
    };

    fetchSeatData();
    const interval = setInterval(fetchSeatData, 10000);

    return () => clearInterval(interval);
  }, [apiEndpoint, totalSeats, eventName, waterLevel]);

  // Animated props for the wave path
  const animatedProps = useAnimatedProps(() => {
    const width = 260; // Card width
    const height = 300; // Card height
    const waterHeight = waterLevel.value * height; // Water level based on filled seats

    // Wave parameters
    const amplitude = 10; // Wave amplitude
    const frequency = (2 * Math.PI) / width;

    // Gyroscope data
    const { x, y } = animatedSensor.sensor.value;
    const tiltX = x * 5; // Adjust sensitivity as needed
    const tiltY = y * 5;

    // Generate the wave path
    let path = `M0 ${height}`;
    path += ` L0 ${height - waterHeight}`;

    const step = 5; // Increase or decrease for smoother or coarser waves

    for (let i = 0; i <= width; i += step) {
      const theta = frequency * i + wavePhase.value + tiltX;
      const yValue =
        amplitude * Math.sin(theta) +
        (height - waterHeight) +
        amplitude * Math.sin(tiltY);
      path += ` L${i} ${yValue}`;
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
    zIndex: 2,
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
    zIndex: 2,
    position: 'absolute',
    bottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  text: {
    fontSize: 14,
    color: 'white',
  },
});
