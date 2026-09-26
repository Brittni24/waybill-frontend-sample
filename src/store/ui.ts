import { create } from 'zustand'
import type { Depot } from '@/domain/types'
import { useStore } from './useStore'

interface Ui {
  depot?: Depot
  setDepot: (d: Depot) => void
}

export const useUi = create<Ui>((set) => ({ setDepot: (depot) => set({ depot }) }))

export function useDepot(): Depot {
  const chosen = useUi((s) => s.depot)
  const session = useStore((s) => s.session)
  return chosen ?? session?.depot ?? 'Peliyagoda'
}
