import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Organization {
  id: string;
  name: string;
  contract_end_date?: string | null;
}

interface StoreState {
  currentStoreId: string | null;
  userRole: 'STORE_OWNER' | 'HQ_ADMIN' | 'SUPER_ADMIN' | null;
  organizationId: string | null;
  organization: Organization | null;
  accessibleStores: Array<{ id: string; name: string; place_url?: string | null }>;
  userEmail: string | null;

  setCurrentStoreId: (id: string) => void;
  setUserInfo: (info: { role: any, orgId: string | null, organization?: Organization | null, stores: any[], email?: string | null }) => void;
  reset: () => void;
}

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      // 초기값
      currentStoreId: null,
      userRole: null,
      organizationId: null,
      organization: null,
      accessibleStores: [],
      userEmail: null,

      setCurrentStoreId: (id) => set({ currentStoreId: id }),

      setUserInfo: (info) =>
        set((state) => {
          const isCurrentStoreValid = info.stores.some(
            (s) => s.id === state.currentStoreId
          );
          return {
            userRole: info.role,
            organizationId: info.orgId,
            organization: info.organization || null,
            accessibleStores: info.stores,
            userEmail: info.email || state.userEmail,
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
          organization: null,
          accessibleStores: [],
          userEmail: null,
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
