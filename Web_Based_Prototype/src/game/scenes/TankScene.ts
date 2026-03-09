import Phaser from 'phaser'
import { store } from '../../utils/store'
import { playBeep } from '../../utils/audio'
import fish1Url from '../../public/assets/fish_icons/fish_1.png'
import fish2Url from '../../public/assets/fish_icons/fish_2.png'
import fish3Url from '../../public/assets/fish_icons/fish_3.png'
import fishTankBG from '../../public/assets/bg_images/fish_tank_bg.gif'
import kingfisherUrl from '../../public/assets/ui_icons/kingfisher_fish.png'

class TankScene extends Phaser.Scene {
  fishes: Phaser.GameObjects.GameObject[] = []
  fishMap: Map<string, Phaser.GameObjects.Image> = new Map()
  tankLayer?: Phaser.GameObjects.Layer
  effectLayer?: Phaser.GameObjects.Layer
  background?: Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle
  oxygenBar?: Phaser.GameObjects.Graphics
  cleanlinessBar?: Phaser.GameObjects.Graphics
  storeUpdateListener?: EventListenerOrEventListenerObject
  storeEventListener?: EventListenerOrEventListenerObject
  kingfisherCooldownUntil = 0
  kingfisherBusy = false

  constructor() {
    super('TankScene')
  }

  preload() {
    // load fish icons and background using Vite-resolved imports
    this.load.image('fish1', fish1Url)
    this.load.image('fish2', fish2Url)
    this.load.image('fish3', fish3Url)
    // optional background - use imported bgUrl
    this.load.image('bg', fishTankBG)
    this.load.image('kingfisher', kingfisherUrl)
  }

  create() {
    const { width, height } = this.scale
    // create ordered layers: tank (background + fish), effects, UI sits in React above canvas
    this.tankLayer = this.add.layer()
    this.effectLayer = this.add.layer()
    // background: use loaded image if available, otherwise fallback to gradient rect
    if (this.textures.exists('bg')) {
      const bg = this.add.image(width / 2, height / 2, 'bg')
      bg.setOrigin(0.5, 0.5)
      bg.setDepth(0)
      this.background = bg
      this.resizeBackground(width, height)
      this.tankLayer!.add(bg)
    } else {
      const rect = this.add.rectangle(width / 2, height / 2, width, height, 0x052034)
      this.background = rect
      this.tankLayer!.add(rect)
    }

    // ensure store has at least 2 fishes (initialize if empty)
    const state = store.getState()
    if (!state.fishes || state.fishes.length < 1) {
      const starter = [
        { id: 'f1', name: 'Goldie', hunger: 80, health: 100, growth: 0.2, value: 10 },
        { id: 'f2', name: 'Bubbles', hunger: 90, health: 100, growth: 0.1, value: 8 },
        { id: 'f3', name: 'Sunny', hunger: 95, health: 100, growth: 0.05, value: 6 }
      ].slice(0, 2 + Math.floor(Math.random() * 2))
      store.setState({ fishes: starter })
    }

    // create fish objects from store using persisted sprite properties
    const current = store.getState()
    // if fish entries are missing texture/position, add deterministic defaults and persist
    let needsPersist = false
    const updated = current.fishes.map((f, idx) => {
      const copy = { ...f } as any
      if (!copy.texture) {
        // deterministic texture selection by index
        copy.texture = `fish${(idx % 3) + 1}`
        needsPersist = true
      }
      if (typeof copy.x !== 'number' || typeof copy.y !== 'number') {
        // deterministic but varied positions based on index
        copy.x = 90 + (idx * 64) % Math.max(1, (width - 180))
        copy.y = 180 + ((idx * 97) % Math.max(1, (height - 260)))
        needsPersist = true
      }
      return copy
    })
    if (needsPersist) {
      store.setState({ fishes: updated })
    }

    const finalState = store.getState()
    finalState.fishes.forEach((f, idx) => this.spawnFishSprite(f, idx))

    // HUD now renders oxygen/cleanliness bars in React — Phaser-side graphics removed

    // reduce oxygen/cleanliness over time
    this.time.addEvent({ delay: 5000, loop: true, callback: this.decay.bind(this) })

    // listen to store for updates/actions with removable listeners
    this.storeUpdateListener = () => {
      this.syncFishes()
      this.updateMeters()
    }
    store.addEventListener('update', this.storeUpdateListener)

    this.storeEventListener = (e: any) => {
      const ge = e.detail
      if (ge.type === 'feed') this.onFeed()
      if (ge.type === 'clean') this.onClean()
      if (ge.type === 'kingfisher_warning') this.onKingfisherWarning()
      if (ge.type === 'repel_success') this.onRepelSuccess()
      if (ge.type === 'repel_fail') this.onRepelFail()
    }
    store.addEventListener('event', this.storeEventListener)

    // remove listeners on scene shutdown to avoid leaks
    this.events.on('shutdown', () => {
      if (this.storeUpdateListener) store.removeEventListener('update', this.storeUpdateListener)
      if (this.storeEventListener) store.removeEventListener('event', this.storeEventListener)
      this.scale.off('resize', this.onResize, this)
    })

    this.scale.on('resize', this.onResize, this)
  }

  resizeBackground(width: number, height: number) {
    if (!this.background) return
    this.background.setPosition(width / 2, height / 2)
    if (this.background instanceof Phaser.GameObjects.Image) {
      const scale = Math.max(width / this.background.width, height / this.background.height)
      this.background.setDisplaySize(this.background.width * scale, this.background.height * scale)
      return
    }
    if (this.background instanceof Phaser.GameObjects.Rectangle) {
      this.background.setSize(width, height)
    }
  }

  onResize(gameSize: Phaser.Structs.Size) {
    this.resizeBackground(gameSize.width, gameSize.height)
  }

  getFishScaleFromGrowth(growth: number) {
    // Real-world style progression: tiny juveniles, then gradual visible growth.
    const eased = Math.pow(Phaser.Math.Clamp(growth, 0, 1), 0.72)
    return Phaser.Math.Clamp(0.1 + eased * 0.38, 0.1, 0.48)
  }

  getTankBounds(height: number) {
    // Keep gameplay clear of HUD (top) and menu bar (bottom).
    return {
      top: 110,
      bottom: Math.max(130, height - 120)
    }
  }

  getTankZones(height: number) {
    const bounds = this.getTankBounds(height)
    const tankHeight = Math.max(1, bounds.bottom - bounds.top)
    const topCut = bounds.top + tankHeight * 0.2
    const bottomCut = bounds.top + tankHeight * 0.8
    return {
      top: { min: bounds.top, max: topCut },
      middle: { min: topCut, max: bottomCut },
      bottom: { min: bottomCut, max: bounds.bottom }
    }
  }

  isHungryFish(fish: any) {
    return typeof fish?.hunger === 'number' && fish.hunger < 40
  }

  isHappyFish(fish: any) {
    return typeof fish?.hunger === 'number' && typeof fish?.health === 'number' && fish.hunger > 75 && fish.health > 80
  }

  getPreferredZone(fish: any): 'top' | 'middle' | 'bottom' {
    if (this.isHungryFish(fish)) return 'top'
    if (this.isHappyFish(fish)) return 'bottom'
    return 'middle'
  }

  spawnFish(data: any, idx = 0) {
    // kept for compatibility; spawn sprite-based fish instead
    this.spawnFishSprite(data, idx)
  }

  removeFishSpriteById(id: string) {
    const sprite = this.fishMap.get(id)
    if (!sprite) return
    this.tweens.killTweensOf(sprite)
    this.fishMap.delete(id)
    this.fishes = this.fishes.filter(f => f !== sprite)
    sprite.destroy()
  }

  spawnFishSprite(data: any, idx = 0) {
    // use persisted position/texture when available
    const targetX = typeof data.x === 'number' ? data.x : 80 + Math.random() * (this.scale.width - 160)
    const targetY = typeof data.y === 'number' ? data.y : 160 + Math.random() * (this.scale.height - 260)
    const shouldDrop = !!data.dropIn
    const startX = targetX
    const startY = shouldDrop ? -80 - Math.random() * 90 : targetY
    const tex = data.texture || 'fish1'
    const img = this.add.image(startX, startY, tex)
    // scale relative to growth for visual size; clamp to reasonable range
    const growth = typeof data.growth === 'number' ? data.growth : 0.2
    const baseScale = this.getFishScaleFromGrowth(growth)
    img.setScale(baseScale)
    img.setDepth(10)
    // add to tank layer so background stays below
    this.tankLayer!.add(img)
    // assign a unique movement profile so fish follow different paths
    const pathKind = idx % 3
    const zones = this.getTankZones(this.scale.height)
    const laneY = Phaser.Math.Clamp(targetY, zones.middle.min, zones.middle.max)
    const path = {
      kind: pathKind, // 0=sine, 1=zigzag, 2=drift
      heading: Math.random() < 0.5 ? -1 : 1,
      speed: 32 + Math.random() * 28,
      laneY,
      phase: Math.random() * Math.PI * 2,
      amp: 14 + Math.random() * 22,
      freq: 0.7 + Math.random() * 0.9,
      driftY: (Math.random() - 0.5) * 12
    }

    // store id and motion data on the image
    img.setData('id', data.id)
    img.setData('path', path)
    img.setData('visualScale', baseScale)
    img.setData('dropping', shouldDrop)
    this.fishMap.set(data.id, img)
    this.fishes.push(img)

    if (shouldDrop) {
      this.tweens.add({
        targets: img,
        y: targetY,
        duration: 650 + idx * 120,
        ease: 'Quad.out',
        onComplete: () => {
          img.setData('dropping', false)
        }
      })
    }
  }

  update(time: number, delta: number) {
    const dt = delta / 1000
    const sprites = Array.from(this.fishMap.values())
    const width = this.scale.width
    const height = this.scale.height
    const swimTime = time * 0.001
    const leftBound = 30
    const rightBound = width - 30
    const tankBounds = this.getTankBounds(height)
    const zones = this.getTankZones(height)

    // get fresh store map for per-fish growth (visual size)
    const state = store.getState()
    const fishDataMap = new Map(state.fishes.map((f: any) => [f.id, f]))

    for (let i = 0; i < sprites.length; i++) {
      const a = sprites[i] as Phaser.GameObjects.Image
      if (a.getData('captured')) continue
      if (a.getData('dropping')) continue
      const aid = a.getData('id')
      const path = a.getData('path') as {
        kind: number
        heading: number
        speed: number
        laneY: number
        phase: number
        amp: number
        freq: number
        driftY: number
      }
      const fishState = fishDataMap.get(aid) || { hunger: 80, health: 100, growth: 0.2 }
      const zoneName = this.getPreferredZone(fishState)
      const zone = zones[zoneName]
      const zoneCenter = (zone.min + zone.max) * 0.5
      const zoneSpan = Math.max(8, zone.max - zone.min)
      const laneWobble = Math.sin(swimTime * (0.35 + path.freq * 0.15) + path.phase * 0.5) * zoneSpan * 0.16
      path.laneY = Phaser.Math.Linear(path.laneY, zoneCenter + laneWobble, 0.9 * dt)
      path.laneY = Phaser.Math.Clamp(path.laneY, zone.min + 6, zone.max - 6)

      // keep fish moving only in their facing direction
      let desiredY = path.laneY
      if (path.kind === 0) {
        desiredY = path.laneY + Math.sin(swimTime * path.freq + path.phase) * Math.min(path.amp, zoneSpan * 0.22)
      } else if (path.kind === 1) {
        const zig = (2 / Math.PI) * Math.asin(Math.sin(swimTime * path.freq * 1.8 + path.phase))
        desiredY = path.laneY + zig * Math.min(path.amp, zoneSpan * 0.2)
      } else {
        path.laneY += path.driftY * dt
        if (path.laneY < zone.min + 10 || path.laneY > zone.max - 10) {
          path.driftY *= -1
        }
        desiredY = path.laneY + Math.sin(swimTime * path.freq + path.phase) * Math.min(path.amp, zoneSpan * 0.18) * 0.35
      }

      desiredY = Phaser.Math.Clamp(desiredY, zone.min, zone.max)
      const vx = path.heading * path.speed
      const vy = Phaser.Math.Clamp((desiredY - a.y) * 2, -48, 48)
      a.x += vx * dt
      a.y += vy * dt

      if (a.x <= leftBound) {
        a.x = leftBound
        path.heading = 1
      } else if (a.x >= rightBound) {
        a.x = rightBound
        path.heading = -1
      }

      if (a.y < tankBounds.top) a.y = tankBounds.top
      if (a.y > tankBounds.bottom) a.y = tankBounds.bottom

      a.setData('path', path)
      const facing = path.heading < 0 ? -1 : 1
      // update visual scale based on store growth
      const fd2 = fishDataMap.get(aid)
      if (fd2 && typeof fd2.growth === 'number') {
        const targetScale = this.getFishScaleFromGrowth(fd2.growth)
        const prevScale = a.getData('visualScale') as number | undefined
        const visualScale = Math.max(prevScale ?? targetScale, targetScale)
        a.setData('visualScale', visualScale)
        a.setScale(visualScale * facing, visualScale)
      } else {
        a.scaleX = Math.abs(a.scaleX) * facing
      }
    }
  }

  syncFishes() {
    const state = store.getState()
    // if more fishes in state than scene, spawn
    if (state.fishes.length > this.fishes.length) {
      for (let i = this.fishes.length; i < state.fishes.length; i++) {
        this.spawnFish(state.fishes[i], i)
      }
    }
    // if fewer, remove
    if (state.fishes.length < this.fishes.length) {
      while (this.fishes.length > state.fishes.length) {
        const c = this.fishes.pop()!
        // kill any tweens targeting this container to avoid orphaned tweens
        this.tweens.killTweensOf(c)
        c.destroy(true)
      }
    }
  }

  onFeed() {
    // restore small hunger/health boost; premium feed upgrade gives more
    const bonus = store.hasUpgrade('upg_feed_quality') ? 32 : 20
    store.updateFish(f => ({
      ...f,
      hunger: Math.min(100, f.hunger + bonus),
      health: Math.min(100, f.health + 6),
      growth: Math.min(1, f.growth + 0.008)
    }))
    playBeep('feed')
  }

  onClean() {
    // boost cleanliness and health; filter upgrade increases effect
    const bonus = store.hasUpgrade('upg_filter') ? 50 : 30
    store.setState({ cleanliness: Math.min(100, store.getState().cleanliness + bonus) })
    store.updateFish(f => ({ ...f, health: Math.min(100, f.health + 12) }))
    playBeep('clean')
  }

  onKingfisherWarning() {
    // visual warning and sound
    this.cameras.main.flash(350, 255, 200, 160)
    playBeep('warn')
  }

  onRepelSuccess() {
    this.cameras.main.shake(220, 0.02)
    playBeep('success')
  }

  onRepelFail() {
    if (this.kingfisherBusy) return
    const candidates = Array.from(this.fishMap.values()).filter(f => !f.getData('captured'))
    if (candidates.length === 0) return

    this.kingfisherBusy = true
    playBeep('fail')

    const victim = Phaser.Utils.Array.GetRandom(candidates)
    const victimId = victim.getData('id') as string
    victim.setData('captured', true)

    const { width } = this.scale
    const fromLeft = Math.random() < 0.5
    const startX = fromLeft ? -140 : width + 140
    const startY = 80 + Math.random() * 70
    const kingfisher = this.add.image(startX, startY, 'kingfisher')
    kingfisher.setDepth(120)
    kingfisher.setScale(0.45)
    kingfisher.setFlipX(!fromLeft)
    this.effectLayer?.add(kingfisher)

    const grabOffsetX = fromLeft ? 24 : -24
    const grabOffsetY = 18

    this.tweens.add({
      targets: kingfisher,
      x: victim.x,
      y: victim.y - 26,
      duration: 420,
      ease: 'Sine.out',
      onComplete: () => {
        victim.setDepth(119)
        victim.setPosition(kingfisher.x + grabOffsetX, kingfisher.y + grabOffsetY)

        const exitX = fromLeft ? width + 220 : -220
        const exitY = -120
        this.tweens.add({
          targets: kingfisher,
          x: exitX,
          y: exitY,
          duration: 900,
          ease: 'Cubic.in'
        })
        this.tweens.add({
          targets: victim,
          x: exitX + grabOffsetX,
          y: exitY + grabOffsetY,
          duration: 900,
          ease: 'Cubic.in',
          onComplete: () => {
            kingfisher.destroy()
            this.removeFishSpriteById(victimId)
            store.removeFishById(victimId)
            this.kingfisherBusy = false
          }
        })
      }
    })
  }

  decay() {
    const s = store.getState()
    // apply upgrades to decay rates
    const oxygenDecayBase = 2
    const cleanlinessDecayBase = 1
    const oxygenDecay = store.hasUpgrade('upg_oxygen_pump') ? oxygenDecayBase * 0.5 : oxygenDecayBase
    const cleanlinessDecay = store.hasUpgrade('upg_filter') ? cleanlinessDecayBase * 0.6 : cleanlinessDecayBase

    const newO = Math.max(0, s.oxygen - oxygenDecay)
    const newC = Math.max(0, s.cleanliness - cleanlinessDecay)
    store.setState({ oxygen: newO, cleanliness: newC })
    // fishes get hungrier and may lose health
    store.updateFish(f => {
      const hungerBase = 6
      const hunger = Math.max(0, f.hunger - hungerBase)
      let health = f.health
      if (hunger < 20) health = Math.max(0, health - 5)
      // fish grow faster when fed and healthy, slower otherwise.
      const fedGrowth = hunger > 70 && health > 75 ? 0.0028 : hunger > 45 && health > 55 ? 0.0012 : 0.00035
      const upgradeBoost = store.hasUpgrade('upg_feed_quality') ? 1.2 : 1
      const growth = Math.min(1, f.growth + fedGrowth * upgradeBoost)
      return { ...f, hunger, health, growth }
    })

    // Kingfisher risk: fish near the top 20% surface zone are more vulnerable.
    const now = Date.now()
    if (now > this.kingfisherCooldownUntil) {
      const topRiskFish = store.getState().fishes.filter(f => this.isHungryFish(f)).length
      if (topRiskFish > 0) {
        const riskChance = Math.min(0.4, 0.12 + topRiskFish * 0.06)
        if (Math.random() < riskChance) {
          store.emitEvent({ id: `kf_${now}`, type: 'kingfisher_warning', timestamp: now })
          this.kingfisherCooldownUntil = now + 15000
        }
      }
    }
  }

  updateMeters() {
    // no-op: HUD handles oxygen/cleanliness display in React
  }
}

export default TankScene
