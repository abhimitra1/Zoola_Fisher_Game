import Phaser from 'phaser'
import TankScene from './scenes/TankScene'

export default class GameStarter {
  game?: Phaser.Game

  start(containerId: string) {
    if (this.game) return
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerId,
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: '#052034',
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
      },
      scene: [TankScene],
      physics: {
        default: 'arcade',
        arcade: { debug: false }
      }
    }

    this.game = new Phaser.Game(config)
    window.addEventListener('resize', () => {
      this.resize()
    })
    this.resize()
  }

  resize() {
    if (!this.game) return
    const parent = this.game.canvas.parentElement
    if (!parent) return
    this.game.scale.resize(parent.clientWidth, parent.clientHeight)
  }
}
