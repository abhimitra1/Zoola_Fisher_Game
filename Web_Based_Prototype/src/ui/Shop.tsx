import React from 'react'
import upgrades from '../data/upgrades.json'
import { store } from '../utils/store'

export default function Shop({ onClose }: { onClose: () => void }) {
  const state = store.getState()

  function buy(upg: any) {
    const ok = store.purchaseUpgrade(upg.id, upg.cost)
    if (!ok) {
      alert('Not enough coins')
      return
    }
  }

  return (
    <div className="modal">
      <div className="box shop-modal shell shadow-lg" style={{ width: 380 }}>
        <h3 className="mb-3 shop-title">Shop</h3>
        <div className="d-flex flex-column gap-2">
          {upgrades.map((u: any) => (
            <div
              key={u.id}
              className="d-flex justify-content-between align-items-center p-3 rounded shop-item"
            >
              <div className="pe-2">
                <div className="fw-bold shop-item-title">{u.name}</div>
                <div className="small shop-item-desc">{u.description}</div>
              </div>
              <div className="d-flex gap-2 align-items-center">
                <span className="badge shop-cost">{u.cost}</span>
                {state.appliedUpgrades && state.appliedUpgrades.includes(u.id) ? (
                  <button className="btn btn-sm shop-btn-owned" disabled>Owned</button>
                ) : (
                  <button className="btn btn-sm shop-btn-buy" onClick={() => buy(u)}>Buy</button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 d-flex justify-content-end">
          <button className="btn btn-sm shop-btn-close" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
