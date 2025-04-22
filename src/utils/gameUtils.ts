import { GameKey } from '../constants/games';

export const getGameKey = (index: number): GameKey => {
  const GAME_KEYS: GameKey[] = ['technicalQuiz', 'towerOfHanoi', 'wordScramble'];
  return GAME_KEYS[index];
}; 