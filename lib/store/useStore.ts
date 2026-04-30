import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreState {
  currentStoreId: string | null;
  userRole: 'STORE_OWNER' | 'HQ_ADMIN' | 'SUPER_ADMIN' | null;
  organizationId: string | null;
  accessibleStores: Array<{ id: string; name: string; place_url?: string | null }>;

  setCurrentStoreId: (id: string) => void;
  setUserInfo: (info: { role: any, orgId: string | null, stores: any[] }) => void;
  reset: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 초기값
      currentStoreId: null,
      userRole: null,
      organizationId: null,
      accessibleStores: [],

      setCurrentStoreId: (id) => set({ currentStoreId: id }),

      setUserInfo: (info) =>
        set((state) => {
          const isCurrentStoreValid = info.stores.some(
            (s) => s.id === state.currentStoreId
          );
          return {
            userRole: info.role,
            organizationId: info.orgId,
            accessibleStores: info.stores,
            currentStoreId: isCurrentStoreValid
              ? state.currentStoreId
              : info.stores.length > 0
                ? info.stores[0].id
                : null,
          };
        }),

      reset: () =>
        set({
          currentStoreId: null,
          userRole: null,
          organizationId: null,
          accessibleStores: [],
        }),
    }),
    {
      name: 'review-guard-storage',
      // ★ 핵심 수술: 로컬 스토리지에는 '선택한 매장 ID'만 저장하고, 권한(userRole)은 절대 저장하지 않음!
      partialize: (state) => ({
        currentStoreId: state.currentStoreId,
      }),
    }
  )
);
