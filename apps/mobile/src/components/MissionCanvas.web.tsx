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

export function MissionCanvas({ board, position, trail, predictionOptions, size }: Props) {
  const cell = size / board.columns;
  const collected = new Set(trail.map(pointKey));
  const place = (point: Point) => ({
    left: point.x * cell + 5,
    top: point.y * cell + 5,
    width: cell - 10,
    height: cell - 10,
  });

  return (
    <View style={[styles.shell, { width: size, height: size }]}>
      {Array.from({ length: board.rows }).flatMap((_, row) =>
        Array.from({ length: board.columns }).map((__, column) => (
          <View
            key={`cell-${column}-${row}`}
            style={[
              styles.cell,
              place({ x: column, y: row }),
              (column + row) % 2 === 0 && styles.cellAlternate,
            ]}
          />
        )),
      )}
      {trail.slice(0, -1).map((point, index) => (
        <View
          key={`trail-${index}`}
          style={[
            styles.trail,
            {
              left: point.x * cell + cell / 2 - 4,
              top: point.y * cell + cell / 2 - 4,
            },
          ]}
        />
      ))}
      <View style={[styles.portal, place(board.goal)]}><Text style={styles.portalText}>◎</Text></View>
      {board.walls.map((wall) => (
        <View key={pointKey(wall)} style={[styles.wall, place(wall)]}>
          <Text style={styles.wallText}>••</Text>
        </View>
      ))}
      {board.gems.map((gem) => (
        <View key={pointKey(gem)} style={[styles.gem, place(gem), collected.has(pointKey(gem)) && styles.collected]}>
          <Text style={styles.gemText}>◆</Text>
        </View>
      ))}
      {predictionOptions?.map((option) => (
        <View key={option.id} style={[styles.marker, { left: option.point.x * cell + cell * 0.66, top: option.point.y * cell + 5 }]}>
          <Text style={styles.markerText}>{option.id.toUpperCase()}</Text>
        </View>
      ))}
      <View style={[styles.robot, place(position)]}>
        <Text style={styles.robotText}>🤖</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { alignSelf: 'center', overflow: 'hidden', borderRadius: radius.lg, borderWidth: 3, borderColor: colours.surface, backgroundColor: '#F1EEFF', ...shadow },
  cell: { position: 'absolute', borderRadius: 12, backgroundColor: '#F8F6FF' },
  cellAlternate: { backgroundColor: colours.surface },
  trail: { position: 'absolute', width: 8, height: 8, borderRadius: 4, backgroundColor: '#C8BFFF' },
  portal: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: colours.lime },
  portalText: { color: colours.success, fontSize: 38, lineHeight: 46, fontWeight: '900' },
  wall: { position: 'absolute', alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colours.purpleDark },
  wallText: { color: '#9F8DDF', fontSize: 22, letterSpacing: 5, fontWeight: '900' },
  gem: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  gemText: { color: colours.gold, fontSize: 31, fontWeight: '900' },
  collected: { opacity: 0.2 },
  marker: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: colours.purple, borderWidth: 2, borderColor: colours.surface, alignItems: 'center', justifyContent: 'center', zIndex: 6 },
  markerText: { color: colours.surface, fontSize: 11, fontWeight: '900' },
  robot: { position: 'absolute', alignItems: 'center', justifyContent: 'center', zIndex: 5 },
  robotText: { fontSize: 38 },
});

