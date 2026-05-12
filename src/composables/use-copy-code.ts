// 复制代码功能
export interface CopyCodeOptions {
  timeout?: number
}

export function setupCopyCodeDelegation(options: CopyCodeOptions = {}): () => void {
  const { timeout = 2000 } = options

  if (typeof window === 'undefined')
    return () => {}

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
