import React from 'react'
import { TankState } from '../types'
import coinIcon from '../public/assets/ui_icons/coin_icon.png'
import xpIcon from '../public/assets/ui_icons/xp_icon.png'
import pearlIcon from '../public/assets/ui_icons/pearl_icon.png'
import o2Icon from '../public/assets/ui_icons/o2_icon.png'
import cleanIcon from '../public/assets/ui_icons/clean_icon.png'
import fishFeed from '../public/assets/ui_icons/fish_feed_icon.png'

export default function HUD({ state }: { state: TankState }) {
  const avgHunger = state.fishes.length
    ? state.fishes.reduce((sum, fish) => sum + fish.hunger, 0) / state.fishes.length
    : 0

  return (
    <>
      <div className="left-stats">
        <div className="stat"><img src={xpIcon} alt="xp"/><div className="count">35</div></div>
        <div className="stat"><img src={coinIcon} alt="coins"/><div className="count">{state.coins}</div></div>
        <div className="stat"><img src={pearlIcon} alt="pearls"/><div className="count">0</div></div>
      </div>

      <div className="top-bars">
        <div className="top-bar">
          <img src={o2Icon} alt="o2"/>
          <div className="progress"><i style={{ width: `${Math.round(state.oxygen)}%` }}></i></div>
        </div>
        <div className="top-bar">
          <img src={cleanIcon} alt="clean"/>
          <div className="progress warn"><i style={{ width: `${Math.round(state.cleanliness)}%` }}></i></div>
        </div>
        <div className="top-bar">
          <img src={fishFeed} alt="feed"/>
          <div className="progress clean"><i style={{ width: `${Math.round(avgHunger)}%` }}></i></div>
        </div>
      </div>
    </>
  )
}
