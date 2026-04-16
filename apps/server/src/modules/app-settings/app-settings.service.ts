import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { AppSettings } from './app-settings.types';
import { UpdateAppSettingsDto } from './dto/update-app-settings.dto';

const defaultSettings: AppSettings = {
  appNameZh: '宗迹',
  appNameEn: 'KinTrace Admin',
  logoUrl: '',
  iconUrl: '/kintrace-logo.svg',
  pointMarkerPreset: 'star',
  pointMarkerIconUrl: '',
};

@Injectable()
export class AppSettingsService {
  private readonly settingsDir = join(process.cwd(), 'uploads', 'settings');

  private readonly settingsFile = join(this.settingsDir, 'app-settings.json');

  private ensureDir() {
    mkdirSync(this.settingsDir, { recursive: true });
  }

  private readSettings(): AppSettings {
    this.ensureDir();

    if (!existsSync(this.settingsFile)) {
      this.writeSettings(defaultSettings);
      return { ...defaultSettings };
    }

    try {
      const raw = readFileSync(this.settingsFile, 'utf8');
      const parsed = this.parseSettings(raw);
      return {
        ...defaultSettings,
        ...parsed,
      };
    } catch {
      this.writeSettings(defaultSettings);
      return { ...defaultSettings };
    }
  }

  private writeSettings(settings: AppSettings) {
    this.ensureDir();
    writeFileSync(this.settingsFile, JSON.stringify(settings, null, 2), 'utf8');
  }

  private parseSettings(raw: string): Partial<AppSettings> {
    const parsed: unknown = JSON.parse(raw);

    if (!parsed || typeof parsed !== 'object') {
      return {};
    }

    return parsed as Partial<AppSettings>;
  }

  getSettings() {
    return this.readSettings();
  }

  updateSettings(dto: UpdateAppSettingsDto) {
    const nextSettings: AppSettings = {
      ...this.readSettings(),
      ...dto,
    };
    this.writeSettings(nextSettings);
    return nextSettings;
  }
}
