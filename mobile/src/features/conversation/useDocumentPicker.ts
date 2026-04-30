// Wrapper expo-document-picker. pick() ouvre le picker système et retourne
// les métadonnées normalisées du fichier (ou null si annulé).

import * as DocumentPicker from 'expo-document-picker'
import { useCallback } from 'react'

export interface PickedDocument {
  name: string
  mimeType: string
  size: number
  uri: string
}

export function useDocumentPicker() {
  const pick = useCallback(async (): Promise<PickedDocument | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    })
    if (result.canceled) return null
    const asset = result.assets[0]
    if (!asset) return null
    return {
      name: asset.name,
      mimeType: asset.mimeType ?? 'application/octet-stream',
      size: asset.size ?? 0,
      uri: asset.uri,
    }
  }, [])

  return { pick }
}
