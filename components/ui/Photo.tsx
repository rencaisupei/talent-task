import {
  Image,
  type DimensionValue,
  type ImageResizeMode,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

interface PhotoProps {
  uri: string;
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  resizeMode?: ImageResizeMode;
  className?: string;
  style?: StyleProp<ImageStyle>;
}

/**
 * Remote photo with explicit dimensions so Expo web never falls back to the
 * image's natural size.
 */
export function Photo({
  uri,
  width = '100%',
  height = '100%',
  radius,
  resizeMode = 'cover',
  className,
  style,
}: PhotoProps) {
  return (
    <Image
      source={{ uri }}
      style={[{ width, height, borderRadius: radius }, style]}
      resizeMode={resizeMode}
      className={className}
    />
  );
}
