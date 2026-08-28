import { Canvas, Circle, Fill, Group, Line, RoundedRect } from '@shopify/react-native-skia';
import { StyleSheet, Text, View } from 'react-native';

import type {
  BoardDefinition,
  Point,
  PredictionOption,
} from '../../../../packages/lesson-schema/src';
import { pointKey } from '../../../../packages/learning-engine/src';
import { colours, radius, shadow } from '../theme';

type Props = {
  board: BoardDefinition;
  position: Point;
  trail: Point[];
  predictionOptions?: PredictionOption[];
  size: number;
};

const markerColours = [colours.purple, '#3B9FE8', colours.coral];

export function MissionCanvas({
  board,
  position,
  trail,
  predictionOptions,
  size,
}: Props) {
  const cell = size / board.columns;
  const inset = Math.max(4, cell * 0.08);
  const collected = new Set(trail.map(pointKey));
  const center = (point: Point) => ({
    x: point.x * cell + cell / 2,
    y: point.y * cell + cell / 2,
  });
  const robotCenter = center(position);

  return (
    <View
      style={[styles.shell, { width: size, height: size }]}
      accessibilityLabel={`Mission board. Byte is at column ${position.x + 1}, row ${position.y + 1}.`}
    >
      <Canvas style={{ width: size, height: size }}>
        <Fill color="#F1EEFF" />
        {Array.from({ length: board.rows }).flatMap((_, row) =>
          Array.from({ length: board.columns }).map((__, column) => (
            <RoundedRect
              key={`cell-${column}-${row}`}
              x={column * cell + inset / 2}
              y={row * cell + inset / 2}
              width={cell - inset}
              height={cell - inset}
              r={Math.max(7, cell * 0.12)}
              color={(column + row) % 2 === 0 ? '#FFFFFF' : '#F8F6FF'}
            />
          )),
        )}

        {trail.slice(0, -1).map((point, index) => {
          const value = center(point);
          return (
            <Circle
              key={`trail-${index}-${pointKey(point)}`}
              cx={value.x}
              cy={value.y}
              r={Math.max(3, cell * 0.055)}
              color="#C8BFFF"
            />
          );
        })}

        {board.walls.map((wall) => (
          <Group key={`wall-${pointKey(wall)}`}>
            <RoundedRect
              x={wall.x * cell + inset}
              y={wall.y * cell + inset}
              width={cell - inset * 2}
              height={cell - inset * 2}
              r={Math.max(6, cell * 0.13)}
              color={colours.purpleDark}
            />
            <Circle
              cx={wall.x * cell + cell * 0.35}
              cy={wall.y * cell + cell * 0.35}
              r={Math.max(2, cell * 0.05)}
              color="#9F8DDF"
            />
            <Circle
              cx={wall.x * cell + cell * 0.66}
              cy={wall.y * cell + cell * 0.66}
              r={Math.max(2, cell * 0.05)}
              color="#9F8DDF"
            />
          </Group>
        ))}

        <Group>
          <Circle
            cx={center(board.goal).x}
            cy={center(board.goal).y}
            r={cell * 0.31}
            color={colours.lime}
          />
          <Circle
            cx={center(board.goal).x}
            cy={center(board.goal).y}
            r={cell * 0.17}
            color={colours.success}
          />
          <Circle
            cx={center(board.goal).x}
            cy={center(board.goal).y}
            r={cell * 0.07}
            color={colours.surface}
          />
        </Group>

        {board.gems.map((gem) => {
          const value = center(gem);
          const isCollected = collected.has(pointKey(gem));
          return (
            <Group key={`gem-${pointKey(gem)}`} opacity={isCollected ? 0.22 : 1}>
              <Circle cx={value.x} cy={value.y} r={cell * 0.19} color={colours.gold} />
              <Circle cx={value.x} cy={value.y} r={cell * 0.1} color="#FFF4B8" />
            </Group>
          );
        })}

        <Group transform={[{ translateX: robotCenter.x }, { translateY: robotCenter.y }]}>
          <Line
            p1={{ x: 0, y: -cell * 0.24 }}
            p2={{ x: 0, y: -cell * 0.35 }}
            color={colours.ink}
            strokeWidth={3}
          />
          <Circle cx={0} cy={-cell * 0.39} r={cell * 0.055} color={colours.lime} />
          <RoundedRect
            x={-cell * 0.26}
            y={-cell * 0.24}
            width={cell * 0.52}
            height={cell * 0.48}
            r={cell * 0.14}
            color={colours.purple}
          />
          <Circle cx={-cell * 0.1} cy={-cell * 0.04} r={cell * 0.045} color={colours.lime} />
          <Circle cx={cell * 0.1} cy={-cell * 0.04} r={cell * 0.045} color={colours.lime} />
          <RoundedRect
            x={-cell * 0.1}
            y={cell * 0.09}
            width={cell * 0.2}
            height={cell * 0.04}
            r={cell * 0.02}
            color={colours.surface}
          />
        </Group>
      </Canvas>

      {predictionOptions?.map((option, index) => {
        const point = center(option.point);
        return (
          <View
            key={option.id}
            pointerEvents="none"
            style={[
              styles.marker,
              {
                left: point.x + cell * 0.2,
                top: point.y - cell * 0.43,
                backgroundColor: markerColours[index % markerColours.length],
              },
            ]}
          >
            <Text style={styles.markerText}>{option.id.toUpperCase()}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: 'center',
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 3,
    borderColor: colours.surface,
    backgroundColor: colours.lilac,
    ...shadow,
  },
  marker: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colours.surface,
  },
  markerText: {
    color: colours.surface,
    fontSize: 12,
    fontWeight: '900',
  },
});

