interface ClipInfo {
  startTime: number
  endTime: number
  duration: number
  title: string
  channelTitle: string
  videoId?: string
}

interface DownloadStatusData {
  status: string
  message: string
  clipInfo?: ClipInfo
}

interface VideoThumbnails {
  default?: { url: string; width: number; height: number }
  medium?: { url: string; width: number; height: number }
  high?: { url: string; width: number; height: number }
  standard?: { url: string; width: number; height: number }
  maxres?: { url: string; width: number; height: number }
}

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  channelTitle: string
  channelId: string
  publishedAt: string
  thumbnails: VideoThumbnails
  duration?: string
  viewCount?: string
  likeCount?: string
  commentCount?: string
  tags?: string[]
}

export interface YouTubeChannel {
  channelId: string
  title: string
  description: string
  customUrl?: string
  publishedAt: string
  thumbnails: VideoThumbnails
  subscriberCount: string
  videoCount: string
  viewCount: string
}

interface SearchResult {
  success: boolean
  videos?: YouTubeVideo[]
  error?: string
}

interface VideoDetailsResult {
  success: boolean
  video?: YouTubeVideo
  error?: string
}

interface ChannelInfoResult {
  success: boolean
  channel?: YouTubeChannel
  error?: string
}

interface ChannelVideosResult {
  success: boolean
  videos?: YouTubeVideo[]
  error?: string
}

export interface ElectronAPI {
  setApiKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>
  getApiKey: () => Promise<string>
  validateApiKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>
  selectDownloadFolder: () => Promise<string | null>
  getDownloadPath: () => Promise<string>
  validateYouTubeUrl: (url: string) => Promise<{ valid: boolean; error?: string; clipId?: string; type?: string; videoId?: string }>
  downloadClip: (url: string, downloadPath: string, filename: string, startTime?: number, endTime?: number) => Promise<{ success: boolean; path: string; clipInfo?: ClipInfo }>
  searchVideos: (query: string, maxResults?: number) => Promise<SearchResult>
  getVideoDetails: (videoId: string) => Promise<VideoDetailsResult>
  getChannelInfo: (channelId: string) => Promise<ChannelInfoResult>
  getChannelVideos: (channelId: string, maxResults?: number) => Promise<ChannelVideosResult>
  getTrendingVideos: (regionCode?: string, maxResults?: number) => Promise<SearchResult>
  getYtDlpInfo: () => Promise<{ success: boolean; version?: string; binaryPath?: string; platform?: string; arch?: string; error?: string }>
  updateYtDlp: () => Promise<{ success: boolean; error?: string }>
  setYtDlpPath: (customPath: string) => Promise<{ success: boolean; error?: string }>
  onDownloadProgress: (callback: (data: { percent: number; downloaded: number; total: number }) => void) => void
  onDownloadStatus?: (callback: (data: DownloadStatusData) => void) => void
  removeDownloadProgressListener: () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}