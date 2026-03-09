export const grid = reactive({
  xs: true,
  sm: true,
  md: true,
  lg: true,
  xl: false,
  '2xl': false,
})

export const useScreen = () => {
  const width = ref(0)
  const height = ref(0)

  const isMobile = computed(() => width.value < 768)
  const isTablet = computed(() => width.value >= 768 && width.value < 1024)
  const isDesktop = computed(() => width.value >= 1024)

  const update = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => {
    update()
    window.addEventListener('resize', update)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', update)
  })

  return { width, height, isMobile, isTablet, isDesktop }
}
