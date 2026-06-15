// 复制代码功能
export interface CopyCodeOptions {
  timeout?: number
}

export function setupCopyCodeDelegation(options: CopyCodeOptions = {}): () => void {
  const { timeout = 2000 } = options

  if (typeof window === 'undefined')
    return () => {}

  const timeoutIdMap: WeakMap<HTMLElement, ReturnType<typeof setTimeout>> = new WeakMap()

  async function copyToClipboard(text: string): Promise<void> {
    // 优先使用现代 Clipboard API（需安全上下文）
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text)
        return
      }
      catch {
        // Clipboard API 失败（权限被拒等），回退到旧方案
      }
    }

    // 安全上下文不可用或 API 失败时的兼容回退
    const element = document.createElement('textarea')
    element.value = text
    element.style.position = 'fixed'
    element.style.left = '-9999px'
    element.style.top = '-9999px'

    document.body.appendChild(element)
    element.select()

    const success = document.execCommand('copy')
    document.body.removeChild(element)

    if (!success)
      throw new Error('Copy command failed')
  }

  function handleCopy(button: HTMLElement) {
    const codeContainer = button.closest('[class*="language-"]')
    if (!codeContainer)
      return

    const preElement = codeContainer.querySelector('pre')
    if (!preElement)
      return

    const text = preElement.textContent || ''

    copyToClipboard(text)
      .then(() => {
        button.classList.add('copied')

        const existingTimeout = timeoutIdMap.get(button)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
        }

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

  function onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement

    const copyButton = target.closest('button.copy') as HTMLElement | null
    if (!copyButton)
      return

    event.preventDefault()
    handleCopy(copyButton)
  }

  document.addEventListener('click', onDocumentClick)

  return () => {
    document.removeEventListener('click', onDocumentClick)
  }
}
