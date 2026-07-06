// ========== 游戏状态机 ==========
import type { GamePhase } from '../types';

/**
 * 合法转换规则映射
 * 定义了每个阶段可以合法转换到的下一个阶段
 */
const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  LOADING: ['MENU'],
  MENU: ['TALENT_SELECT'],
  TALENT_SELECT: ['ALLOCATE'],
  ALLOCATE: ['PLAYING'],
  PLAYING: ['DEATH', 'PLAYING'],
  DEATH: ['TALENT_SELECT'],
};

/**
 * 游戏状态机
 * 管理 GamePhase 的状态转换，确保转换合法性
 */
export class GameStateMachine {
  private currentPhase: GamePhase;

  constructor(initialPhase: GamePhase = 'LOADING') {
    this.currentPhase = initialPhase;
  }

  /**
   * 状态转换
   * @param newPhase 目标阶段
   * @throws 如果转换不合法则抛出错误
   */
  transition(newPhase: GamePhase): void {
    if (!this.canTransition(this.currentPhase, newPhase)) {
      throw new Error(
        `非法状态转换: 无法从 ${this.currentPhase} 转换到 ${newPhase}`
      );
    }
    this.currentPhase = newPhase;
  }

  /**
   * 检查从 from 到 to 的转换是否合法
   * @param from 当前阶段
   * @param to 目标阶段
   * @returns 是否允许转换
   */
  canTransition(from: GamePhase, to: GamePhase): boolean {
    const allowed = VALID_TRANSITIONS[from];
    if (!allowed) {
      return false;
    }
    return allowed.includes(to);
  }

  /**
   * 获取当前阶段
   * @returns 当前 GamePhase
   */
  getCurrentPhase(): GamePhase {
    return this.currentPhase;
  }
}
