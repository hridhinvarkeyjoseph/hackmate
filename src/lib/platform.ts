import { Capacitor } from '@capacitor/core'

export const PUBLIC_APP_URL = 'https://hridhinvarkeyjoseph.github.io/hackmate/'

export const isNativeApp = (): boolean => Capacitor.isNativePlatform()

/**
 * Hands a text file to the user. Browsers download it. The Android app has no
 * download manager, so it opens the share sheet (Drive, Files, WhatsApp and so on).
 */
export async function saveTextFile(name: string, content: string, type: string): Promise<void> {
  if (isNativeApp()) {
    const [{ Directory, Encoding, Filesystem }, { Share }] = await Promise.all([
      import('@capacitor/filesystem'),
      import('@capacitor/share'),
    ])
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: content,
      directory: Directory.Cache,
      encoding: Encoding.UTF8,
    })
    await Share.share({ title: name, files: [uri] })
    return
  }

  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
