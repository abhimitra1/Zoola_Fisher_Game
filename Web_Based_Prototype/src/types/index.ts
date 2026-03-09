export interface FishData {
  id: string
  name: string
  hunger: number
  health: number
  growth: number
  value: number
}

export interface TankState {
  coins: number
  oxygen: number
  cleanliness: number
  fishes: FishData[]
  appliedUpgrades?: string[]
  ownerName?: string
  started?: boolean
}

export interface Upgrade {
  id: string
  name: string
  cost: number
  description?: string
}

export interface GameEvent {
  id: string
  type: string
  timestamp: number
  payload?: any
}
