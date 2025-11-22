export type CheckInMethod = 'qr' | 'gps' | 'manual'

export interface GeoPoint {
  lat: number
  lng: number
  accuracy?: number
}

export interface SubmitPayload {
  user_id: string
  method: CheckInMethod
  ts_client: string
  tz_offset_minutes: number
  geo?: GeoPoint
  device_fp: string
  qr_session_id?: string
}

export interface SubmitResult {
  id: string
  status: 'verified' | 'pending' | 'rejected'
  risk_score: number
  ts_server: string
}