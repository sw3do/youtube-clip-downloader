import { app, BrowserWindow, ipcMain, dialog, net } from 'electron'
import * as path from 'path'
import * as fs from 'fs'
import { google } from 'googleapis'
import Store from 'electron-store'
import YTDlpWrap from 'yt-dlp-wrap'
import * as os from 'os'

const store = new Store()

let mainWindow: BrowserWindow
let youtube: any = null
let ytDlpWrap: YTDlpWrap | null = null

class YtDlpManager {
  private static instance: YtDlpManager
  private binaryPath: string
  private isInitialized: boolean = false

  private constructor() {
    this.binaryPath = this.getDefaultBinaryPath()
  }

  static getInstance(): YtDlpManager {
    if (!YtDlpManager.instance) {
      YtDlpManager.instance = new YtDlpManager()
    }
    return YtDlpManager.instance
  }

  private getDefaultBinaryPath(): string {
    const platform = os.platform()
    const userDataPath = app.getPath('userData')
    const binariesDir = path.join(userDataPath, 'binaries')
    
    switch (platform) {
      case 'win32':
        return path.join(binariesDir, 'yt-dlp.exe')
      case 'darwin':
      case 'linux':
        return path.join(binariesDir, 'yt-dlp')
      default:
        return path.join(binariesDir, 'yt-dlp')
    }
  }

  private async ensureBinariesDirectory(): Promise<void> {
    const binariesDir = path.dirname(this.binaryPath)
    if (!fs.existsSync(binariesDir)) {
      fs.mkdirSync(binariesDir, { recursive: true })
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await this.ensureBinariesDirectory()
      
      const storedBinaryPath = store.get('ytDlpBinaryPath') as string
      if (storedBinaryPath && fs.existsSync(storedBinaryPath)) {
        this.binaryPath = storedBinaryPath
      }

      if (!fs.existsSync(this.binaryPath)) {
        console.log('yt-dlp binary not found, downloading...')
        await this.downloadBinary()
      } else {
        await this.checkAndUpdateBinary()
      }

      ytDlpWrap = new YTDlpWrap(this.binaryPath)
      this.isInitialized = true
      console.log('yt-dlp initialized successfully at:', this.binaryPath)
    } catch (error) {
      console.error('Failed to initialize yt-dlp:', error)
      ytDlpWrap = new YTDlpWrap()
      this.isInitialized = true
    }
  }

  async downloadBinary(): Promise<void> {
    try {
      const platform = os.platform()
      let platformName: string

      switch (platform) {
        case 'win32':
          platformName = 'win32'
          break
        case 'darwin':
          platformName = 'darwin'
          break
        case 'linux':
          platformName = 'linux'
          break
        default:
          throw new Error(`Unsupported platform: ${platform}`)
      }

      console.log(`Downloading yt-dlp for ${platformName}...`)
      await YTDlpWrap.downloadFromGithub(this.binaryPath, undefined, platformName as any)
      
      if (platform !== 'win32') {
        fs.chmodSync(this.binaryPath, '755')
      }

      store.set('ytDlpBinaryPath', this.binaryPath)
      store.set('ytDlpLastUpdate', Date.now())
      console.log('yt-dlp binary downloaded successfully')
    } catch (error) {
      console.error('Failed to download yt-dlp binary:', error)
      throw error
    }
  }

  private async checkAndUpdateBinary(): Promise<void> {
    try {
      const lastUpdate = store.get('ytDlpLastUpdate', 0) as number
      const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
      
      if (lastUpdate < oneWeekAgo) {
        console.log('Checking for yt-dlp updates...')
        const releases = await YTDlpWrap.getGithubReleases(1, 1)
        
        if (releases && releases.length > 0) {
          const latestVersion = releases[0].tag_name
          const currentVersion = store.get('ytDlpVersion', '') as string
          
          if (latestVersion !== currentVersion) {
            console.log(`Updating yt-dlp from ${currentVersion} to ${latestVersion}`)
            await this.downloadBinary()
            store.set('ytDlpVersion', latestVersion)
          } else {
            store.set('ytDlpLastUpdate', Date.now())
          }
        }
      }
    } catch (error) {
      console.warn('Failed to check for yt-dlp updates:', error)
    }
  }

  getBinaryPath(): string {
    return this.binaryPath
  }

  setBinaryPath(newPath: string): void {
    if (fs.existsSync(newPath)) {
      this.binaryPath = newPath
      store.set('ytDlpBinaryPath', newPath)
      if (ytDlpWrap) {
        ytDlpWrap.setBinaryPath(newPath)
      }
    } else {
      throw new Error(`Binary not found at path: ${newPath}`)
    }
  }

  async getVersion(): Promise<string> {
    if (!ytDlpWrap) {
      throw new Error('yt-dlp not initialized')
    }
    return await ytDlpWrap.getVersion()
  }

  getWrap(): YTDlpWrap {
    if (!ytDlpWrap) {
      throw new Error('yt-dlp not initialized')
    }
    return ytDlpWrap
  }
}

const ytDlpManager = YtDlpManager.getInstance()

function createWindow(): void {
  mainWindow = new BrowserWindow({
    height: 700,
    width: 1000,
    minHeight: 600,
    minWidth: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false
  })

  const isDev = process.env.NODE_ENV === 'development'
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null as any
  })
}

app.whenReady().then(async () => {
  await ytDlpManager.initialize()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('set-api-key', async (_, apiKey: string) => {
  try {
    const isValid = await validateApiKey(apiKey)
    if (isValid) {
      store.set('youtubeApiKey', apiKey)
      initializeYouTubeAPI(apiKey)
      return { success: true }
    } else {
      return { success: false, error: 'Invalid API key' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to validate API key' }
  }
})

ipcMain.handle('get-api-key', () => {
  return store.get('youtubeApiKey', '')
})

ipcMain.handle('validate-api-key', async (_, apiKey: string) => {
  try {
    const isValid = await validateApiKey(apiKey)
    return { valid: isValid }
  } catch (error) {
    return { valid: false, error: 'Failed to validate API key' }
  }
})

ipcMain.handle('select-download-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  })
  
  if (!result.canceled && result.filePaths.length > 0) {
    const selectedPath = result.filePaths[0]
    store.set('downloadPath', selectedPath)
    return selectedPath
  }
  return null
})

ipcMain.handle('get-download-path', () => {
  return store.get('downloadPath', '')
})

ipcMain.handle('get-ytdlp-info', async () => {
  try {
    const version = await ytDlpManager.getVersion()
    const binaryPath = ytDlpManager.getBinaryPath()
    return {
      success: true,
      version,
      binaryPath,
      platform: os.platform(),
      arch: os.arch()
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
})

ipcMain.handle('update-ytdlp', async () => {
  try {
    const manager = YtDlpManager.getInstance()
    await manager.downloadBinary()
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update yt-dlp'
    }
  }
})

ipcMain.handle('set-ytdlp-path', async (_, customPath: string) => {
  try {
    ytDlpManager.setBinaryPath(customPath)
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid binary path'
    }
  }
})

ipcMain.handle('validate-youtube-url', async (_, url: string) => {
  try {
    const clipMatch = url.match(/youtube\.com\/clip\/([a-zA-Z0-9_-]+)/)
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    
    if (clipMatch) {
      return { valid: true, type: 'clip', clipId: clipMatch[1] }
    } else if (videoMatch) {
      return { valid: true, type: 'video', videoId: videoMatch[1] }
    } else {
      return { valid: false, error: 'Invalid YouTube URL. Please enter a valid YouTube video or clip URL.' }
    }
  } catch (error) {
    return { valid: false, error: 'Failed to validate URL' }
  }
})

ipcMain.handle('search-videos', async (_, query: string, maxResults: number = 10) => {
  try {
    if (!youtube) {
      return { success: false, error: 'YouTube API not initialized' }
    }

    const response = await youtube.search.list({
      part: ['snippet'],
      q: query,
      type: ['video'],
      maxResults,
      order: 'relevance'
    })

    const videos = response.data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    })) || []

    return { success: true, videos }
  } catch (error) {
    console.error('Error searching videos:', error)
    return { success: false, error: 'Failed to search videos' }
  }
})

ipcMain.handle('get-video-details', async (_, videoId: string) => {
  try {
    if (!youtube) {
      return { success: false, error: 'YouTube API not initialized' }
    }

    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId]
    })

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0]
      return {
        success: true,
        video: {
          videoId,
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          channelId: video.snippet.channelId,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount,
          commentCount: video.statistics.commentCount,
          thumbnails: video.snippet.thumbnails,
          tags: video.snippet.tags || []
        }
      }
    }

    return { success: false, error: 'Video not found' }
  } catch (error) {
    console.error('Error getting video details:', error)
    return { success: false, error: 'Failed to get video details' }
  }
})

ipcMain.handle('get-channel-info', async (_, channelId: string) => {
  try {
    if (!youtube) {
      return { success: false, error: 'YouTube API not initialized' }
    }

    const response = await youtube.channels.list({
      part: ['snippet', 'statistics'],
      id: [channelId]
    })

    if (response.data.items && response.data.items.length > 0) {
      const channel = response.data.items[0]
      return {
        success: true,
        channel: {
          channelId,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          publishedAt: channel.snippet.publishedAt,
          thumbnails: channel.snippet.thumbnails,
          subscriberCount: channel.statistics.subscriberCount,
          videoCount: channel.statistics.videoCount,
          viewCount: channel.statistics.viewCount
        }
      }
    }

    return { success: false, error: 'Channel not found' }
  } catch (error) {
    console.error('Error getting channel info:', error)
    return { success: false, error: 'Failed to get channel info' }
  }
})

ipcMain.handle('get-channel-videos', async (_, channelId: string, maxResults: number = 10) => {
  try {
    if (!youtube) {
      return { success: false, error: 'YouTube API not initialized' }
    }

    const response = await youtube.search.list({
      part: ['snippet'],
      channelId,
      type: ['video'],
      maxResults,
      order: 'date'
    })

    const videos = response.data.items?.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    })) || []

    return { success: true, videos }
  } catch (error) {
    console.error('Error getting channel videos:', error)
    return { success: false, error: 'Failed to get channel videos' }
  }
})

ipcMain.handle('get-trending-videos', async (_, regionCode: string = 'US', maxResults: number = 10) => {
  try {
    if (!youtube) {
      return { success: false, error: 'YouTube API not initialized' }
    }

    const response = await youtube.videos.list({
      part: ['snippet', 'statistics'],
      chart: 'mostPopular',
      regionCode,
      maxResults
    })

    const videos = response.data.items?.map((item: any) => ({
      videoId: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails,
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount
    })) || []

    return { success: true, videos }
  } catch (error) {
    console.error('Error getting trending videos:', error)
    return { success: false, error: 'Failed to get trending videos' }
  }
})

ipcMain.handle('download-clip', async (_, url: string, downloadPath: string, filename: string, startTime?: number, endTime?: number) => {
  try {
    let videoId: string
    let clipStartTime: number
    let clipEndTime: number

    const clipId = extractClipIdFromUrl(url)
    const directVideoId = extractVideoIdFromUrl(url)

    if (clipId) {
      mainWindow.webContents.send('download-status', { status: 'extracting', message: 'Extracting clip information...' })
      
      const clipInfo = await getClipInfo(clipId, url)
      if (!clipInfo) {
        throw new Error('Could not retrieve clip information. The clip may be private or deleted.')
      }

      videoId = clipInfo.videoId
      clipStartTime = clipInfo.startTime
      clipEndTime = clipInfo.endTime
    } else if (directVideoId && startTime !== undefined && endTime !== undefined) {
      videoId = directVideoId
      clipStartTime = startTime
      clipEndTime = endTime
      
      mainWindow.webContents.send('download-status', { status: 'preparing', message: 'Preparing custom clip...' })
    } else if (directVideoId) {
      videoId = directVideoId
      clipStartTime = 0
      clipEndTime = 0
      
      mainWindow.webContents.send('download-status', { status: 'preparing', message: 'Preparing full video download...' })
    } else {
      throw new Error('Invalid URL or missing clip timing information')
    }
    
    mainWindow.webContents.send('download-status', { status: 'fetching', message: 'Fetching video details from YouTube API...' })
    
    const videoInfo = await getVideoInfo(videoId)
    if (!videoInfo) {
      console.warn('Could not retrieve video info from API, proceeding with basic info')
    }

    const isFullVideo = clipStartTime === 0 && clipEndTime === 0
    
    if (!isFullVideo) {
      if (clipStartTime >= clipEndTime) {
        throw new Error(`Invalid clip timing: start time (${clipStartTime}s) must be before end time (${clipEndTime}s)`)
      }

      const clipDuration = clipEndTime - clipStartTime
      if (clipDuration > 600) {
        throw new Error(`Clip duration (${clipDuration}s) exceeds maximum allowed duration of 10 minutes`)
      }

      if (clipDuration < 1) {
        throw new Error(`Clip duration must be at least 1 second`)
      }
    }

    const outputPath = path.join(downloadPath, `${filename}.mp4`)
    
    if (isFullVideo) {
      mainWindow.webContents.send('download-status', { 
        status: 'downloading', 
        message: 'Downloading full video...',
        clipInfo: {
          startTime: 0,
          endTime: 0,
          duration: 0,
          title: videoInfo?.title || 'Unknown Title',
          channelTitle: videoInfo?.channelTitle || 'Unknown Channel'
        }
      })
    } else {
      const clipDuration = clipEndTime - clipStartTime
      mainWindow.webContents.send('download-status', { 
        status: 'downloading', 
        message: `Downloading clip (${clipDuration.toFixed(1)}s)...`,
        clipInfo: {
          startTime: clipStartTime,
          endTime: clipEndTime,
          duration: clipDuration,
          title: videoInfo?.title || 'Unknown Title',
          channelTitle: videoInfo?.channelTitle || 'Unknown Channel'
        }
      })
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        const success = await downloadVideoWithYtDlp(videoId, outputPath, clipStartTime, clipEndTime)
        if (success) {
          const finalClipInfo = isFullVideo ? {
            startTime: 0,
            endTime: 0,
            duration: 0,
            title: videoInfo?.title || 'Unknown Title',
            channelTitle: videoInfo?.channelTitle || 'Unknown Channel',
            videoId
          } : {
            startTime: clipStartTime,
            endTime: clipEndTime,
            duration: clipEndTime - clipStartTime,
            title: videoInfo?.title || 'Unknown Title',
            channelTitle: videoInfo?.channelTitle || 'Unknown Channel',
            videoId
          }
          
          resolve({ 
            success: true, 
            path: outputPath,
            clipInfo: finalClipInfo
          })
        } else {
          reject(new Error('Download failed'))
        }
      } catch (error) {
        reject(error)
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    mainWindow.webContents.send('download-status', { status: 'error', message: errorMessage })
    throw error
  }
})

function initializeYouTubeAPI(apiKey: string) {
  youtube = google.youtube({
    version: 'v3',
    auth: apiKey
  })
}

async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const testYoutube = google.youtube({
      version: 'v3',
      auth: apiKey
    })
    
    await testYoutube.search.list({
      part: ['id'],
      q: 'test',
      maxResults: 1
    })
    
    return true
  } catch (error) {
    return false
  }
}

function extractClipIdFromUrl(url: string): string | null {
  try {
    const clipMatch = url.match(/youtube\.com\/clip\/([a-zA-Z0-9_-]+)/)
    if (clipMatch) {
      return clipMatch[1]
    }
    
    const urlObj = new URL(url)
    const clipId = urlObj.pathname.split('/clip/')[1]?.split('?')[0]
    return clipId || null
  } catch {
    return null
  }
}

function extractVideoIdFromUrl(url: string): string | null {
  try {
    const videoMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return videoMatch ? videoMatch[1] : null
  } catch {
    return null
  }
}

function extractClipParamsFromUrl(url: string): { videoId?: string, startTime?: number, endTime?: number } {
  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    const result: { videoId?: string, startTime?: number, endTime?: number } = {}
    
    if (params.has('v')) {
      result.videoId = params.get('v') || undefined
    }
    
    if (params.has('t')) {
      const timeParam = params.get('t')
      if (timeParam) {
        result.startTime = parseTimeParam(timeParam)
      }
    }
    
    if (params.has('start')) {
      result.startTime = parseInt(params.get('start') || '0')
    }
    
    if (params.has('end')) {
      result.endTime = parseInt(params.get('end') || '0')
    }
    
    return result
  } catch {
    return {}
  }
}

function parseTimeParam(timeStr: string): number {
  if (timeStr.endsWith('s')) {
    return parseInt(timeStr.slice(0, -1))
  }
  
  const match = timeStr.match(/(\d+)h(\d+)m(\d+)s|^(\d+)$/)
  if (match) {
    if (match[4]) {
      return parseInt(match[4])
    }
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    return hours * 3600 + minutes * 60 + seconds
  }
  
  return parseInt(timeStr) || 0
}

async function getClipInfo(clipId: string, originalUrl?: string): Promise<{ videoId: string, startTime: number, endTime: number } | null> {
  try {
    let urlParams: { videoId?: string, startTime?: number, endTime?: number } = {}
    if (originalUrl) {
      urlParams = extractClipParamsFromUrl(originalUrl)
      console.log('URL params extracted:', urlParams)
    }
    
    const html = await fetchClipPage(clipId)
    if (!html) return null
    
    let videoId: string | null = urlParams.videoId || null
    let startTime: number = urlParams.startTime || 0
    let endTime: number = urlParams.endTime || 0
    
    console.log('Fetched HTML length:', html.length)
    console.log('Initial values - videoId:', videoId, 'startTime:', startTime, 'endTime:', endTime)
    
    const videoIdPatterns = [
      /"videoId":"([a-zA-Z0-9_-]{11})"/,
      /"video_id":"([a-zA-Z0-9_-]{11})"/,
      /watch\?v=([a-zA-Z0-9_-]{11})/,
      /"videoDetails":{"videoId":"([a-zA-Z0-9_-]{11})"/,
      /ytInitialPlayerResponse.*?"videoId":"([a-zA-Z0-9_-]{11})"/
    ]
    
    for (const pattern of videoIdPatterns) {
      const match = html.match(pattern)
      if (match) {
        videoId = match[1]
        break
      }
    }
    
    if (!videoId) {
      console.error('Could not extract video ID from clip page')
      return null
    }
    
    const startTimePatterns = [
      /"clipConfig":{[^}]*"startTimeMs":"(\d+)"/,
      /"startTimeMs":"(\d+)"/,
      /"start_time_seconds":(\d+)/,
      /startTimeMs["']?:\s*["']?(\d+)/,
      /"clipStartTimeMs":"(\d+)"/,
      /clipStartTimeMs["']?:\s*["']?(\d+)/,
      /"startMs":"(\d+)"/,
      /startMs["']?:\s*["']?(\d+)/
    ]
    
    const endTimePatterns = [
      /"clipConfig":{[^}]*"endTimeMs":"(\d+)"/,
      /"endTimeMs":"(\d+)"/,
      /"end_time_seconds":(\d+)/,
      /endTimeMs["']?:\s*["']?(\d+)/,
      /"clipEndTimeMs":"(\d+)"/,
      /clipEndTimeMs["']?:\s*["']?(\d+)/,
      /"endMs":"(\d+)"/,
      /endMs["']?:\s*["']?(\d+)/
    ]
    
    for (const pattern of startTimePatterns) {
      const match = html.match(pattern)
      if (match) {
        const rawValue = parseInt(match[1])
        if (pattern.toString().includes('Ms')) {
          startTime = rawValue / 1000
        } else {
          startTime = rawValue
        }
        console.log('Found startTime:', startTime, 'from pattern:', pattern.toString(), 'raw value:', rawValue)
        break
      }
    }
    
    for (const pattern of endTimePatterns) {
      const match = html.match(pattern)
      if (match) {
        const rawValue = parseInt(match[1])
        if (pattern.toString().includes('Ms')) {
          endTime = rawValue / 1000
        } else {
          endTime = rawValue
        }
        console.log('Found endTime:', endTime, 'from pattern:', pattern.toString(), 'raw value:', rawValue)
        break
      }
    }
    
    console.log('Final extracted values - videoId:', videoId, 'startTime:', startTime, 'endTime:', endTime)
    
    if (!youtube) {
      console.warn('YouTube API not initialized, using basic clip info')
      return {
        videoId,
        startTime,
        endTime: endTime || startTime + 60
      }
    }
    
    try {
      const videoResponse = await youtube.videos.list({
        part: ['snippet', 'contentDetails'],
        id: [videoId]
      })
      
      if (videoResponse.data.items && videoResponse.data.items.length > 0) {
        const video = videoResponse.data.items[0]
        const duration = parseDuration(video.contentDetails.duration)
        
        if (endTime === 0 || endTime <= startTime) {
          endTime = Math.min(startTime + 60, duration)
        }
        
        if (startTime >= duration) {
          startTime = Math.max(0, duration - 60)
          endTime = duration
        }
        
        return {
          videoId,
          startTime,
          endTime
        }
      }
    } catch (apiError) {
      console.error('Error fetching video details from API:', apiError)
    }
    
    return {
      videoId,
      startTime,
      endTime: endTime || startTime + 60
    }
    
  } catch (error) {
    console.error('Error getting clip info:', error)
    return null
  }
}

async function fetchClipPage(clipId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const request = net.request({
      url: `https://www.youtube.com/clip/${clipId}`,
      method: 'GET'
    })
    
    request.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    request.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    request.setHeader('Accept-Language', 'en-US,en;q=0.5')
    request.setHeader('Accept-Encoding', 'gzip, deflate, br')
    request.setHeader('DNT', '1')
    request.setHeader('Connection', 'keep-alive')
    request.setHeader('Upgrade-Insecure-Requests', '1')
    
    let responseData = ''
    
    request.on('response', (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        const location = response.headers.location
        if (location && typeof location === 'string') {
          fetchClipPage(location.split('/clip/')[1]?.split('?')[0] || clipId).then(resolve)
          return
        }
      }
      
      response.on('data', (chunk) => {
        responseData += chunk.toString()
      })
      
      response.on('end', () => {
        resolve(responseData)
      })
    })
    
    request.on('error', (error) => {
      console.error('Error fetching clip page:', error)
      resolve(null)
    })
    
    request.end()
  })
}

function parseDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}

async function getVideoInfo(videoId: string): Promise<{ title: string, duration: number, channelTitle: string } | null> {
  try {
    if (!youtube) return null
    
    const response = await youtube.videos.list({
      part: ['snippet', 'contentDetails', 'statistics'],
      id: [videoId]
    })
    
    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0]
      return {
        title: video.snippet.title,
        duration: parseDuration(video.contentDetails.duration),
        channelTitle: video.snippet.channelTitle
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting video info:', error)
    return null
  }
}

async function downloadVideoWithYtDlp(videoId: string, outputPath: string, startTime: number, endTime: number): Promise<boolean> {
  try {
    const ytDlpInstance = ytDlpManager.getWrap()
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    
    const args = [
      videoUrl,
      '-o', outputPath,
      '--format', 'best[ext=mp4]',
    ]
    
    if (startTime > 0 && endTime > startTime) {
      args.push('--download-sections', `*${startTime}-${endTime}`)
    }
    
    return new Promise((resolve, reject) => {
      const ytDlpProcess = ytDlpInstance.exec(args)
      
      let totalSize = 0
      let downloadedSize = 0
      
      ytDlpProcess.on('progress', (progress: any) => {
        if (progress.percent !== undefined && progress.percent !== null) {
          let percent: number = 0
          if (typeof progress.percent === 'string') {
            percent = parseFloat(progress.percent.replace('%', ''))
          } else if (typeof progress.percent === 'number') {
            percent = progress.percent
          }
          
          if (progress.totalSize && typeof progress.totalSize === 'string') {
            totalSize = parseFloat(progress.totalSize.replace(/[^0-9.]/g, '')) * 1024 * 1024
          }
          
          if (progress.currentSpeed) {
            downloadedSize = (percent / 100) * totalSize
          }
          
          mainWindow.webContents.send('download-progress', {
            percent: percent,
            downloaded: downloadedSize,
            total: totalSize
          })
        }
      })
      
      ytDlpProcess.on('close', (code) => {
        if (code === 0) {
          resolve(true)
        } else {
          reject(new Error(`yt-dlp process exited with code ${code}`))
        }
      })
      
      ytDlpProcess.on('error', (error) => {
        reject(error)
      })
    })
  } catch (error) {
    console.error('Error downloading video with yt-dlp:', error)
    return false
  }
}

const apiKey = store.get('youtubeApiKey', '') as string
if (apiKey) {
  initializeYouTubeAPI(apiKey)
}