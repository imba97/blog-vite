// 复制代码功能
export interface CopyCodeOptions {
  timeout?: number
}

export function useCopyCode(options: CopyCodeOptions = {}) {
  const { timeout = 2000 } = options

  if (typeof window === 'undefined')
    return

  const timeoutIdMap: WeakMap<HTMLElement, ReturnType<typeof setTimeout>> = new WeakMap()

  function copyToClipboard(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(resolve).catch(fallback)
      }
      else {
        fallback()
      }

      function fallback() {
        try {
          const element = document.createElement('textarea')
          element.value = text
          element.style.position = 'fixed'
          element.style.left = '-9999px'
          element.style.top = '-9999px'

          document.body.appendChild(element)
          element.select()

          const success = document.execCommand('copy')
          document.body.removeChild(element)

          if (success) {
            resolve()
          }
          else {
            reject(new Error('Copy command failed'))
          }
        }
        catch (error) {
          reject(error)
        }
      }
    })
  }

  function handleCopy(button: HTMLElement) {
    const codeContainer = button.closest('[class*="language-"]')
    if (!codeContainer)
      return

    const preElement = codeContainer.querySelector('pre')
    if (!preElement)
      return

    // 获取代码文本内容
    const text = preElement.textContent || ''

    copyToClipboard(text)
      .then(() => {
        // 设置复制成功状态
        button.classList.add('copied')

        // 清除之前的定时器
        const existingTimeout = timeoutIdMap.get(button)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

        // 设置新的定时器来重置状态
        const timeoutId = setTimeout(() => {
          button.classList.remove('copied')
          timeoutIdMap.delete(button)
        }, timeout)

        timeoutIdMap.set(button, timeoutId)
      })
      .catch((error) => {
        console.error('复制失败:', error)
      })
  }

  // 事件委托处理点击
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement

    // 检查是否点击的是复制按钮或其子元素
    const copyButton = target.closest('button.copy') as HTMLElement
    if (!copyButton)
      return

    event.preventDefault()
    handleCopy(copyButton)
  })
}

// 初始化复制功能
if (typeof window !== 'undefined') {
  // 在 DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => useCopyCode())
  }
  else {
    useCopyCode()
  }
}
