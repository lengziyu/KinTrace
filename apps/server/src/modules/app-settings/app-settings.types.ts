export type PointMarkerPresetKey = 'star' | 'lotus' | 'mountain' | 'leaf';

export interface AppSettings {
  appNameZh: string;
  appNameEn: string;
  logoUrl: string;
  iconUrl: string;
  pointMarkerPreset: PointMarkerPresetKey;
  pointMarkerIconUrl: string;
}
