import { describe, expect, it } from 'vitest';
import {
  applyRotation,
  getLeafletBounds,
  getSvgOverlayBounds,
  getMapSvgCdnUrl,
  getMapSvgFallbackUrl,
  isValidMapSvgConfig,
} from '@/utils/mapCoordinates';
describe('mapCoordinates', () => {
  it('rotates coordinates when rotation is applied', () => {
    const rotated = applyRotation({ lat: 10, lng: 0 }, 90);
    expect(rotated.lat).toBeCloseTo(0, 4);
    expect(rotated.lng).toBeCloseTo(10, 4);
  });
  it('uses bounds when provided', () => {
    const bounds = getLeafletBounds({
      file: 'customs.svg',
      floors: ['Ground'],
      defaultFloor: 'Ground',
      coordinateRotation: 0,
      bounds: [
        [10, 20],
        [30, 40],
      ],
    });
    expect(bounds).toEqual([
      [20, 10],
      [40, 30],
    ]);
  });
  it('uses svgBounds when available', () => {
    const bounds = getSvgOverlayBounds({
      file: 'reserve.svg',
      floors: ['Ground'],
      defaultFloor: 'Ground',
      coordinateRotation: 0,
      bounds: [
        [0, 0],
        [100, 100],
      ],
      svgBounds: [
        [5, 10],
        [20, 30],
      ],
    });
    expect(bounds).toEqual([
      [10, 5],
      [30, 20],
    ]);
  });
  it('validates map svg config shape', () => {
    expect(
      isValidMapSvgConfig({
        file: 'factory.svg',
        floors: ['Basement'],
        defaultFloor: 'Basement',
        coordinateRotation: 0,
        bounds: [
          [0, 0],
          [100, 100],
        ],
      })
    ).toBe(true);
    expect(isValidMapSvgConfig({ file: 'missing.svg' })).toBe(false);
  });
  it('builds map svg URLs', () => {
    expect(getMapSvgCdnUrl('Customs', 'Ground')).toBe(
      'https://assets.tarkov.dev/maps/svg/Customs-Ground.svg'
    );
    expect(getMapSvgFallbackUrl('customs.svg')).toBe(
      'https://tarkovtracker.github.io/tarkovdata/maps/customs.svg'
    );
  });
});
