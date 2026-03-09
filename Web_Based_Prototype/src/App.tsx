import React, { useEffect, useRef, useState } from 'react'
import GameStarter from './game/Game'
import { store } from './utils/store'
import HUD from './ui/HUD'
import shopIcon from './public/assets/ui_icons/shop_icon.png'
import villageIcon from './public/assets/ui_icons/village_icon.png'
import feedIcon from './public/assets/ui_icons/fish_feed_icon.png'
import cleanIcon from './public/assets/ui_icons/clean_tank_icon.png'
import fish1Icon from './public/assets/fish_icons/fish_1.png'
import fish2Icon from './public/assets/fish_icons/fish_2.png'
import fish3Icon from './public/assets/fish_icons/fish_3.png'

const game = new GameStarter()
const availableFish = [
  { texture: 'fish1', name: 'Goldie', icon: fish1Icon, value: 10 },
  { texture: 'fish2', name: 'Bubbles', icon: fish2Icon, value: 8 },
  { texture: 'fish3', name: 'Sunny', icon: fish3Icon, value: 6 }
]

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [state, setState] = useState(store.getState())
  const [modal, setModal] = useState<{ type: string; payload?: any } | null>(null)
  const [started, setStarted] = useState<boolean>(store.getState().started || false)
  const [ownerName, setOwnerName] = useState<string>(store.getState().ownerName || '')
  const [pledgeSigned, setPledgeSigned] = useState(false)
  const [bucket, setBucket] = useState<string[]>([])

  useEffect(() => {
    const onUpdate = (e: any) => setState(e.detail)
    const onEvent = (e: any) => {
      const ge = e.detail
      if (ge.type === 'kingfisher_warning') setModal({ type: 'kingfisher', payload: ge })
    }
    store.addEventListener('update', onUpdate as EventListener)
    store.addEventListener('event', onEvent as EventListener)
    return () => {
      store.removeEventListener('update', onUpdate as EventListener)
      store.removeEventListener('event', onEvent as EventListener)
    }
  }, [])

  useEffect(() => {
    if (!started) return
    game.start('phaser-container')
  }, [started])

  // react to state changes: show game over if no fish remain
  useEffect(() => {
    if (started && state.fishes && state.fishes.length === 0) {
      setModal({ type: 'gameover' })
    }
  }, [state.fishes, started])

  function handleFeed() {
    store.emitEvent({ id: 'ev1', type: 'feed', timestamp: Date.now() })
    const s = store.getState()
    store.setState({ coins: Math.max(0, s.coins - 2) })
  }

  function handleClean() {
    store.emitEvent({ id: 'ev2', type: 'clean', timestamp: Date.now() })
    const s = store.getState()
    store.setState({ coins: Math.max(0, s.coins - 5) })
  }

  function openShop() {
    setModal({ type: 'shop' })
  }

  function addFishToBucket(texture: string) {
    setBucket(prev => [...prev, texture])
  }

  function startTank() {
    const trimmed = ownerName.trim()
    if (!trimmed || !pledgeSigned || bucket.length === 0) return

    // persist ownerName and started flag in store
    store.setState({ ownerName: trimmed, started: true })

    const now = Date.now()
    const fishes = bucket.map((texture, idx) => {
      const template = availableFish.find(f => f.texture === texture) || availableFish[0]
      return {
        id: `f_${now}_${idx}`,
        name: `${template.name} ${idx + 1}`,
        hunger: 70 + Math.floor(Math.random() * 20),
        health: 100,
        growth: 0.02 + Math.random() * 0.03,
        value: template.value,
        texture,
        dropIn: true
      }
    })

    store.setState({ fishes })
    setStarted(true)
  }

  // load persisted start/owner from store on mount
  useEffect(() => {
    const s = store.getState()
    if (s.ownerName) setOwnerName(s.ownerName)
    if (s.started) setStarted(true)
  }, [])

  return (
    <div className="app-shell">
      <div className="game-frame" ref={containerRef}>
        {started ? (
          <>
            <div id="phaser-container" />
            <div className="hud">
                <HUD state={state} />
              <div className="panel owner-panel">{ownerName.trim()}'s Tank</div>
            </div>

            <div className="bottom-bar">
              <button className="small-btn" onClick={openShop}>
                <img src={shopIcon} alt="shop"/>
                <div style={{fontSize:12}}>Shop</div>
              </button>

              <button className="small-btn" onClick={handleFeed}>
                <img src={feedIcon} alt="feed"/>
                <div style={{fontSize:12}}>Feed</div>
              </button>

              <button className="small-btn" onClick={handleClean}>
                <img src={cleanIcon} alt="clean"/>
                <div style={{fontSize:12}}>Clean</div>
              </button>

              <button className="small-btn" onClick={() => alert('Village (todo)')}>
                <img src={villageIcon} alt="village"/>
                <div style={{fontSize:12}}>Village</div>
              </button>
            </div>
          </>
        ) : (
          <div className="start-screen d-flex align-items-center justify-content-center">
            <div className="card bg-dark text-light border-info shadow-lg text-center p-4 start-card" style={{ width: 'min(640px,92%)' }}>
              <h1 className="mb-1 text-info start-title">Fisher</h1>
              <h6 className="mb-3 start-subtitle">Guardian of the Blue Tank</h6>

              <div className="mb-3">
                <input
                  className="form-control"
                  value={ownerName}
                  onChange={e => setOwnerName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="form-check mb-3 start-pledge">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="pledge"
                  checked={pledgeSigned}
                  onChange={e => setPledgeSigned(e.target.checked)}
                />
                <label className="form-check-label" htmlFor="pledge">I pledge to care for and protect my fish tank.</label>
              </div>

              <div className="mb-3">
                <h6 className="start-section-title">Available Fish</h6>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  {availableFish.map(fish => (
                    <div className="card bg-secondary bg-opacity-25 border-info text-light p-2 text-center start-fish-card" style={{ width: 120 }} key={fish.texture}>
                      <img src={fish.icon} alt={fish.name} style={{ width:64, height:64, objectFit:'contain', margin:'0 auto' }} />
                      <div className="mt-1">{fish.name}</div>
                      <button className="btn btn-sm btn-outline-primary mt-2" onClick={() => addFishToBucket(fish.texture)}>Add</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3 fw-semibold text-info start-bucket">Bucket: {bucket.length} fish</div>

              <button
                className="btn btn-primary start-cta"
                disabled={!ownerName.trim() || !pledgeSigned || bucket.length === 0}
                onClick={startTank}
              >
                Start and Drop Fish in Tank
              </button>
            </div>
          </div>
        )}

        {modal?.type === 'kingfisher' && (
          <div className="modal">
            <div className="box">
              <h3>Kingfisher Attack!</h3>
              <p>Tap REPel quickly to save your fish.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="game-btn"
                  onClick={() => {
                    store.emitEvent({ id: 'repel_success', type: 'repel_success', timestamp: Date.now() })
                    setModal(null)
                  }}
                >
                  Repel
                </button>
                <button
                  className="game-btn"
                  onClick={() => {
                    store.emitEvent({ id: 'repel_fail', type: 'repel_fail', timestamp: Date.now() })
                    setModal(null)
                  }}
                >
                  Fail
                </button>
              </div>
            </div>
          </div>
        )}
        {modal?.type === 'gameover' && (
          <div className="modal">
            <div className="box">
              <h3>Game Over</h3>
              <p>You have failed to protect the fish.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="game-btn"
                  onClick={() => {
                    // reset to default state and return to start screen
                    store.reset()
                    setStarted(false)
                    setOwnerName('')
                    setModal(null)
                  }}
                >
                  Restart
                </button>
              </div>
            </div>
          </div>
        )}
        {modal?.type === 'shop' && (
          <React.Suspense fallback={<div className="modal"><div className="box">Loading...</div></div>}>
            <Shop onClose={() => setModal(null)} />
          </React.Suspense>
        )}
      </div>
    </div>
  )
}

const Shop = React.lazy(() => import('./ui/Shop'))
