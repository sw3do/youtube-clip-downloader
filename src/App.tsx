import React, { useState, useEffect } from 'react'
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  LinearProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Stack,
  Paper,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  CircularProgress,
  Tabs,
  Tab,
  AppBar
} from '@mui/material'
import {
  Download,
  Folder,
  YouTube,
  CheckCircle,
  Error,
  ContentCopy,
  Clear,
  Key,
  Settings,
  Visibility,
  VisibilityOff,
  Search,
  TrendingUp,
} from '@mui/icons-material'
import { styled } from '@mui/material/styles'
import { VideoSearch, TrendingVideos, VideoDetails, YtDlpSettings } from './components'
import { YouTubeVideo } from './types/electron'

const StyledCard = styled(Card)(() => ({
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
}))

const GradientButton = styled(Button)(() => ({
  background: 'linear-gradient(45deg, #ff4444 30%, #ff6b6b 90%)',
  border: 0,
  borderRadius: 8,
  boxShadow: '0 3px 5px 2px rgba(255, 68, 68, .3)',
  color: 'white',
  height: 48,
  padding: '0 30px',
  '&:hover': {
    background: 'linear-gradient(45deg, #ff3333 30%, #ff5555 90%)',
    boxShadow: '0 4px 8px 2px rgba(255, 68, 68, .4)',
  },
}))

interface DownloadState {
  isDownloading: boolean
  progress: number
  downloaded: number
  total: number
  error: string | null
  success: boolean
  status: string
  message: string
}

interface ClipInfo {
  startTime: number
  endTime: number
  duration: number
  title: string
  channelTitle: string
  videoId?: string
}



const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return (error as Error).message
  return String(error) || 'An unknown error occurred'
}

const parseDuration = (duration: string): number => {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  
  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')
  
  return hours * 3600 + minutes * 60 + seconds
}


function App() {
  const [, setApiKey] = useState('')
  const [hasApiKey, setHasApiKey] = useState(false)
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidatingApiKey, setIsValidatingApiKey] = useState(false)
  const [apiKeyError, setApiKeyError] = useState('')
  
  const [url, setUrl] = useState('')
  const [filename, setFilename] = useState('')
  const [downloadPath, setDownloadPath] = useState('')
  const [downloadState, setDownloadState] = useState<DownloadState>({
    isDownloading: false,
    progress: 0,
    downloaded: 0,
    total: 0,
    error: null,
    success: false,
    status: '',
    message: ''
  })
  const [clipInfo, setClipInfo] = useState<ClipInfo | null>(null)
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; error?: string; clipId?: string; type?: string; videoId?: string } | null>(null)
  const [currentTab, setCurrentTab] = useState(0)
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null)

  const [, setVideoDuration] = useState<number>(0)

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    if (window.electronAPI) {
      const existingApiKey = await window.electronAPI.getApiKey()
      if (existingApiKey) {
        setApiKey(existingApiKey)
        setHasApiKey(true)
        loadDownloadPath()
        setupProgressListener()
      } else {
        setShowApiKeyDialog(true)
      }
    }
  }

  const loadDownloadPath = async () => {
    if (window.electronAPI) {
      const path = await window.electronAPI.getDownloadPath()
      setDownloadPath(path)
    }
  }

  const setupProgressListener = () => {
    if (window.electronAPI) {
      window.electronAPI.onDownloadProgress((data: { percent: number; downloaded: number; total: number }) => {
        setDownloadState(prev => ({
          ...prev,
          progress: data.percent,
          downloaded: data.downloaded,
          total: data.total
        }))
      })
      
      window.electronAPI.onDownloadStatus?.((data: { status: string; message: string; clipInfo?: ClipInfo }) => {
        setDownloadState(prev => ({
          ...prev,
          status: data.status,
          message: data.message
        }))
        
        if (data.clipInfo) {
          setClipInfo(data.clipInfo)
        }
        
        if (data.status === 'error') {
          setDownloadState(prev => ({
            ...prev,
            isDownloading: false,
            error: data.message
          }))
        }
      })
    }
  }

  const handleApiKeySubmit = async () => {
    if (!apiKeyInput.trim()) {
      setApiKeyError('Please enter an API key')
      return
    }

    setIsValidatingApiKey(true)
    setApiKeyError('')

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.setApiKey(apiKeyInput)
        if (result.success) {
          setApiKey(apiKeyInput)
          setHasApiKey(true)
          setShowApiKeyDialog(false)
          setApiKeyInput('')
          loadDownloadPath()
          setupProgressListener()
        } else {
          setApiKeyError(result.error || 'Invalid API key')
        }
      }
    } catch (error) {
      setApiKeyError('Failed to validate API key')
    } finally {
      setIsValidatingApiKey(false)
    }
  }

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const selectedPath = await window.electronAPI.selectDownloadFolder()
      if (selectedPath) {
        setDownloadPath(selectedPath)
      }
    }
  }

  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl.trim()) {
      setUrlValidation(null)
      setVideoDuration(0)
      return
    }

    if (window.electronAPI) {
      const result = await window.electronAPI.validateYouTubeUrl(inputUrl)
      setUrlValidation(result)
      
      if (result.valid && result.type === 'video' && result.videoId) {
        try {
          const videoDetails = await window.electronAPI.getVideoDetails(result.videoId)
          if (videoDetails.success && videoDetails.video && videoDetails.video.duration) {
            const duration = parseDuration(videoDetails.video.duration)
            setVideoDuration(duration)
          }
        } catch (error) {
          console.error('Failed to get video details:', error)
        }
      } else {
        setVideoDuration(0)
      }
    }
  }

  const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = event.target.value
    setUrl(newUrl)
    validateUrl(newUrl)
  }

  const handleDownload = async () => {
    if (!url || !downloadPath || !filename || !urlValidation?.valid) {
      return
    }

    setDownloadState({
      isDownloading: true,
      progress: 0,
      downloaded: 0,
      total: 0,
      error: null,
      success: false,
      status: 'starting',
      message: 'Starting download...'
    })
    setClipInfo(null)

    try {
      if (window.electronAPI) {
        await window.electronAPI.downloadClip(url, downloadPath, filename)
        setDownloadState(prev => ({ 
          ...prev, 
          isDownloading: false, 
          success: true,
          status: 'completed',
          message: 'Download completed successfully!'
        }))
      }
    } catch (error: unknown) {
      setDownloadState(prev => ({
        ...prev,
        isDownloading: false,
        error: getErrorMessage(error) || 'Download failed',
        status: 'error',
        message: getErrorMessage(error) || 'Download failed'
      }))
    }
  }

  const handlePasteUrl = async () => {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      validateUrl(text)
    } catch (error: unknown) {
      console.error('Failed to read clipboard:', error)
    }
  }

  const handleClearUrl = () => {
    setUrl('')
    setUrlValidation(null)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const isDownloadDisabled = !url || !downloadPath || !filename || !urlValidation?.valid || downloadState.isDownloading

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue)
  }

  const handleVideoSelect = (video: YouTubeVideo) => {
    setSelectedVideoId(video.videoId)
  }

  const handleVideoDetailsClose = () => {
    setSelectedVideoId(null)
  }

  const handleDownloadRequest = (videoId: string, title: string) => {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`
    setUrl(videoUrl)
    setFilename(title.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 50))
    setCurrentTab(0)
    setSelectedVideoId(null)
    validateUrl(videoUrl)
  }

  const handleDownloadFromSearch = (videoUrl: string) => {
    setUrl(videoUrl)
    setCurrentTab(0)
    // Auto-validate the URL when coming from search/trending
    validateUrl(videoUrl)
  }

  if (!hasApiKey) {
    return (
      <Dialog open={showApiKeyDialog} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
          <Key sx={{ fontSize: 40, color: '#ff4444', mb: 1 }} />
          YouTube API Key Required
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            To use this application, you need a YouTube Data API v3 key from Google Cloud Console.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>How to get your API key:</strong><br />
              1. Go to{' '}
              <Link href="https://console.cloud.google.com/" target="_blank" rel="noopener">
                Google Cloud Console
              </Link><br />
              2. Create a new project or select an existing one<br />
              3. Enable the YouTube Data API v3<br />
              4. Create credentials (API Key)<br />
              5. Copy and paste the API key below
            </Typography>
          </Alert>

          <TextField
            fullWidth
            label="YouTube API Key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            error={!!apiKeyError}
            helperText={apiKeyError}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowApiKey(!showApiKey)}
                  edge="end"
                >
                  {showApiKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={handleApiKeySubmit}
            disabled={isValidatingApiKey || !apiKeyInput.trim()}
            startIcon={isValidatingApiKey ? <CircularProgress size={20} /> : <Key />}
            sx={{ height: 48 }}
          >
            {isValidatingApiKey ? 'Validating...' : 'Save API Key'}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <YouTube sx={{ fontSize: 60, color: '#ff4444', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
          YouTube Clip Downloader
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Discover, explore, and download YouTube content using YouTube API v3
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Tooltip title="Change API Key">
            <IconButton
              onClick={() => setShowApiKeyDialog(true)}
              sx={{ color: 'text.secondary' }}
            >
              <Settings />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <StyledCard>
        <AppBar position="static" sx={{ bgcolor: 'transparent', boxShadow: 'none', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            centered
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&.Mui-selected': {
                  color: '#ff4444'
                }
              }
            }}
          >
            <Tab icon={<Download />} label="Download Clips" />
            <Tab icon={<Search />} label="Search Videos" />
            <Tab icon={<TrendingUp />} label="Trending" />
            <Tab icon={<Settings />} label="Settings" />
          </Tabs>
        </AppBar>

        <CardContent sx={{ p: 4 }}>
          {currentTab === 0 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <YouTube color="primary" />
                  YouTube Video/Clip URL
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <TextField
                    fullWidth
                    placeholder="https://youtube.com/clip/... or https://youtube.com/watch?v=..."
                    value={url}
                    onChange={handleUrlChange}
                    error={urlValidation !== null && !urlValidation.valid}
                    helperText={urlValidation?.error || "Paste any YouTube video URL or clip URL"}
                    InputProps={{
                      endAdornment: (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {url && (
                            <IconButton onClick={handleClearUrl} size="small">
                              <Clear />
                            </IconButton>
                          )}
                          <Tooltip title="Paste from clipboard">
                            <IconButton onClick={handlePasteUrl} size="small">
                              <ContentCopy />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      )
                    }}
                  />
                  {urlValidation?.valid && (
                    <Chip
                      icon={<CheckCircle />}
                      label="Valid YouTube URL"
                      color="success"
                      size="small"
                      sx={{ position: 'absolute', top: -10, right: 10, bgcolor: 'success.main' }}
                    />
                  )}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Folder color="primary" />
                  Download Location
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    placeholder="Select download folder..."
                    value={downloadPath}
                    InputProps={{ readOnly: true }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleSelectFolder}
                    startIcon={<Folder />}
                    sx={{ minWidth: 140 }}
                  >
                    Browse
                  </Button>
                </Box>
              </Box>

              <Box>
                <Typography variant="h6" gutterBottom>
                  Filename
                </Typography>
                <TextField
                  fullWidth
                  placeholder="Enter filename (without extension)"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  helperText="The file will be saved as .mp4"
                />
              </Box>



              <Divider />

              <Box sx={{ textAlign: 'center' }}>
                <GradientButton
                  size="large"
                  onClick={handleDownload}
                  disabled={isDownloadDisabled}
                  startIcon={<Download />}
                  sx={{ minWidth: 200 }}
                >
                  {downloadState.isDownloading ? 'Downloading...' : 'Download Video'}
                </GradientButton>
              </Box>

              {downloadState.isDownloading && (
                <Paper sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Download Status
                  </Typography>
                  
                  {downloadState.message && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {downloadState.message}
                    </Typography>
                  )}
                  
                  {clipInfo && (
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Video Information
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {clipInfo.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Channel: {clipInfo.channelTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {clipInfo.duration.toFixed(1)}s ({clipInfo.startTime.toFixed(1)}s - {clipInfo.endTime.toFixed(1)}s)
                      </Typography>
                    </Box>
                  )}
                  
                  {downloadState.progress > 0 && (
                    <>
                      <LinearProgress
                        variant="determinate"
                        value={downloadState.progress}
                        sx={{ height: 8, borderRadius: 4, mb: 1 }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          {downloadState.progress.toFixed(1)}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatBytes(downloadState.downloaded)} / {formatBytes(downloadState.total)}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Paper>
              )}

              {downloadState.error && (
                <Alert severity="error" icon={<Error />}>
                  {downloadState.error}
                </Alert>
              )}

              {downloadState.success && (
                <Alert severity="success" icon={<CheckCircle />}>
                  Video downloaded successfully!
                </Alert>
              )}
            </Stack>
          )}

          {currentTab === 1 && (
            <VideoSearch 
              onVideoSelect={handleVideoSelect} 
              onDownloadRequest={handleDownloadFromSearch}
            />
          )}

          {currentTab === 2 && (
            <TrendingVideos 
              onVideoSelect={handleVideoSelect}
              onDownloadRequest={handleDownloadFromSearch}
            />
          )}

          {currentTab === 3 && (
            <YtDlpSettings />
          )}
        </CardContent>
      </StyledCard>

      <VideoDetails
        videoId={selectedVideoId}
        onClose={handleVideoDetailsClose}
        onDownloadRequest={handleDownloadRequest}
      />

      <Dialog open={showApiKeyDialog && hasApiKey} onClose={() => setShowApiKeyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Key color="primary" />
            Update API Key
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="YouTube API Key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            error={!!apiKeyError}
            helperText={apiKeyError}
            InputProps={{
              endAdornment: (
                <IconButton
                  onClick={() => setShowApiKey(!showApiKey)}
                  edge="end"
                >
                  {showApiKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              )
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setShowApiKeyDialog(false)
            setApiKeyInput('')
            setApiKeyError('')
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleApiKeySubmit}
            disabled={isValidatingApiKey || !apiKeyInput.trim()}
            startIcon={isValidatingApiKey ? <CircularProgress size={20} /> : <Key />}
          >
            {isValidatingApiKey ? 'Validating...' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default App