import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  setApiKey: (apiKey: string) => ipcRenderer.invoke('set-api-key', apiKey),
  getApiKey: () => ipcRenderer.invoke('get-api-key'),
  validateApiKey: (apiKey: string) => ipcRenderer.invoke('validate-api-key', apiKey),
  selectDownloadFolder: () => ipcRenderer.invoke('select-download-folder'),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  validateYouTubeUrl: (url: string) => ipcRenderer.invoke('validate-youtube-url', url),
  downloadClip: (url: string, downloadPath: string, filename: string, startTime?: number, endTime?: number) => 
    ipcRenderer.invoke('download-clip', url, downloadPath, filename, startTime, endTime),
  searchVideos: (query: string, maxResults?: number) => 
    ipcRenderer.invoke('search-videos', query, maxResults),
  getVideoDetails: (videoId: string) => 
    ipcRenderer.invoke('get-video-details', videoId),
  getChannelInfo: (channelId: string) => 
    ipcRenderer.invoke('get-channel-info', channelId),
  getChannelVideos: (channelId: string, maxResults?: number) => 
    ipcRenderer.invoke('get-channel-videos', channelId, maxResults),
  getTrendingVideos: (regionCode?: string, maxResults?: number) => 
    ipcRenderer.invoke('get-trending-videos', regionCode, maxResults),
  getYtDlpInfo: () => ipcRenderer.invoke('get-ytdlp-info'),
  updateYtDlp: () => ipcRenderer.invoke('update-ytdlp'),
  setYtDlpPath: (customPath: string) => ipcRenderer.invoke('set-ytdlp-path', customPath),
  onDownloadProgress: (callback: (data: any) => void) => {
    ipcRenderer.on('download-progress', (_, data) => callback(data))
  },
  onDownloadStatus: (callback: (data: any) => void) => {
    ipcRenderer.on('download-status', (_, data) => callback(data))
  },
  removeDownloadProgressListener: () => {
    ipcRenderer.removeAllListeners('download-progress')
    ipcRenderer.removeAllListeners('download-status')
  }
})

export interface ElectronAPI {
  setApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>
  getApiKey: () => Promise<string>
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>
  selectDownloadFolder: () => Promise<string | null>
  getDownloadPath: () => Promise<string>
  validateYouTubeUrl: (url: string) => Promise<{ valid: boolean; error?: string; clipId?: string }>
  downloadClip: (url: string, downloadPath: string, filename: string, startTime?: number, endTime?: number) => Promise<{ success: boolean; path: string; clipInfo?: any }>
  searchVideos: (query: string, maxResults?: number) => Promise<{ success: boolean; videos?: any[]; error?: string }>
  getVideoDetails: (videoId: string) => Promise<{ success: boolean; video?: any; error?: string }>
  getChannelInfo: (channelId: string) => Promise<{ success: boolean; channel?: any; error?: string }>
  getChannelVideos: (channelId: string, maxResults?: number) => Promise<{ success: boolean; videos?: any[]; error?: string }>
  getTrendingVideos: (regionCode?: string, maxResults?: number) => Promise<{ success: boolean; videos?: any[]; error?: string }>
  getYtDlpInfo: () => Promise<{ success: boolean; version?: string; binaryPath?: string; platform?: string; arch?: string; error?: string }>
  updateYtDlp: () => Promise<{ success: boolean; error?: string }>
  setYtDlpPath: (customPath: string) => Promise<{ success: boolean; error?: string }>
  onDownloadProgress: (callback: (data: { percent: number; downloaded: number; total: number }) => void) => void
  onDownloadStatus: (callback: (data: any) => void) => void
  removeDownloadProgressListener: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}