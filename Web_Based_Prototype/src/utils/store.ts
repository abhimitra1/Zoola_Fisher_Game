import { TankState, FishData, GameEvent } from '../types'

const STORAGE_KEY = 'fisher_v1'

type Listener = (s: TankState) => void

class GameStore extends EventTarget {
  state: TankState

  constructor() {
    super()
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        this.state = JSON.parse(saved)
      } catch {
        this.state = this.defaultState()
      }
    } else {
      this.state = this.defaultState()
    }
  }

  defaultState(): TankState {
    return {
      coins: 50,
      oxygen: 100,
      cleanliness: 100,
      fishes: [
        { id: 'f1', name: 'Goldie', hunger: 80, health: 100, growth: 0.2, value: 10 },
        { id: 'f2', name: 'Bubbles', hunger: 90, health: 100, growth: 0.1, value: 8 }
      ]
      ,
      appliedUpgrades: [],
      ownerName: '',
      started: false
    }
  }

  save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
    this.dispatchEvent(new CustomEvent('save', { detail: this.state }))
  }

  getState() {
    return this.state
  }

  setState(patch: Partial<TankState>) {
    this.state = { ...this.state, ...patch }
    this.save()
    this.dispatchEvent(new CustomEvent('update', { detail: this.state }))
  }

  updateFish(fn: (f: FishData) => FishData) {
    this.state.fishes = this.state.fishes.map(fn)
    this.save()
    this.dispatchEvent(new CustomEvent('update', { detail: this.state }))
  }

  removeFishById(id: string) {
    this.state.fishes = this.state.fishes.filter(f => f.id !== id)
    this.save()
    this.dispatchEvent(new CustomEvent('update', { detail: this.state }))
  }

  purchaseUpgrade(upgId: string, cost: number) {
    if (this.state.coins < cost) return false
    this.state.coins -= cost
    this.state.appliedUpgrades = Array.from(new Set([...(this.state.appliedUpgrades || []), upgId]))
    this.save()
    this.dispatchEvent(new CustomEvent('update', { detail: this.state }))
    return true
  }

  hasUpgrade(id: string) {
    return (this.state.appliedUpgrades || []).includes(id)
  }

  emitEvent(e: GameEvent) {
    this.dispatchEvent(new CustomEvent('event', { detail: e }))
  }

  reset() {
    this.state = this.defaultState()
    this.save()
    this.dispatchEvent(new CustomEvent('update', { detail: this.state }))
  }
}

export const store = new GameStore()
