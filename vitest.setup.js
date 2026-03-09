import { vi } from 'vitest'

vi.stubGlobal('useRuntimeConfig', () => ({
  public: {
    apiPort: '5051',
  },
}))
