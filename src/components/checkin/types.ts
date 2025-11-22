/**
 * @file Check-in component types
 */
export type ThemeName = 'default' | 'green' | 'dark';

export interface CheckInNote {
  userId: string;
  date: string;
  text: string;
}

export interface SubmitResult {
  success: boolean;
  error?: string;
}

export interface CheckInControllerOptions {
  theme?: ThemeName;
}