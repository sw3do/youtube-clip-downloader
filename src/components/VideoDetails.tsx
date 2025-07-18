import React, { useState, useEffect } from 'react'
import {
  Box,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Button,
  Divider,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import {
  Visibility,
  ThumbUp,
  Comment,
  AccessTime,
  CalendarToday,
  Person,
  Download,
  Close,
  OpenInNew
} from '@mui/icons-material'
import { YouTubeVideo, YouTubeChannel } from '../types/electron'

interface VideoDetailsProps {
  videoId: string | null
  onClose: () => void
  onDownloadRequest?: (videoId: string, title: string) => void
}

const VideoDetails: React.FC<VideoDetailsProps> = ({ videoId, onClose, onDownloadRequest }) => {
  const [video, setVideo] = useState<YouTubeVideo | null>(null)
  const [channel, setChannel] = useState<YouTubeChannel | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (videoId) {
      loadVideoDetails()
    }
  }, [videoId])

  const loadVideoDetails = async () => {
    if (!videoId) return

    setLoading(true)
    setError(null)

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getVideoDetails(videoId)
        if (result.success && result.video) {
          setVideo(result.video)
          if (result.video.channelId) {
            loadChannelInfo(result.video.channelId)
          }
        } else {
          setError(result.error || 'Failed to load video details')
        }
      }
    } catch (err) {
      setError('An error occurred while loading video details')
    } finally {
      setLoading(false)
    }
  }

  const loadChannelInfo = async (channelId: string) => {
    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getChannelInfo(channelId)
        if (result.success && result.channel) {
          setChannel(result.channel)
        }
      }
    } catch (err) {
      console.error('Failed to load channel info:', err)
    }
  }

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
    if (!match) return ''
    
    const hours = parseInt(match[1] || '0')
    const minutes = parseInt(match[2] || '0')
    const seconds = parseInt(match[3] || '0')
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const formatNumber = (num: string) => {
    const count = parseInt(num)
    if (count >= 1000000000) {
      return `${(count / 1000000000).toFixed(1)}B`
    } else if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toLocaleString()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const openYouTubeVideo = () => {
    if (video) {
      window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')
    }
  }

  if (!videoId) return null

  return (
    <Dialog
      open={!!videoId}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">Video Details</Typography>
        <IconButton onClick={onClose}>
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {video && (
          <Box>
            <CardMedia
              component="img"
              height="300"
              image={video.thumbnails.high?.url || video.thumbnails.medium?.url}
              alt={video.title}
              sx={{ objectFit: 'cover' }}
            />
            
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                {video.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {video.viewCount && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Visibility sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(video.viewCount)} views
                    </Typography>
                  </Box>
                )}
                {video.likeCount && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ThumbUp sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(video.likeCount)} likes
                    </Typography>
                  </Box>
                )}
                {video.commentCount && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Comment sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(video.commentCount)} comments
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                {video.duration && (
                  <Chip
                    icon={<AccessTime />}
                    label={formatDuration(video.duration)}
                    variant="outlined"
                    size="small"
                  />
                )}
                <Chip
                  icon={<CalendarToday />}
                  label={formatDate(video.publishedAt)}
                  variant="outlined"
                  size="small"
                />
              </Box>

              {channel && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Avatar
                    src={channel.thumbnails.medium?.url || channel.thumbnails.default?.url}
                    sx={{ width: 48, height: 48 }}
                  >
                    <Person />
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {channel.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatNumber(channel.subscriberCount)} subscribers • {formatNumber(channel.videoCount)} videos
                    </Typography>
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                {video.description.length > 300 
                  ? `${video.description.substring(0, 300)}...` 
                  : video.description
                }
              </Typography>

              {video.tags && video.tags.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Tags:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {video.tags.slice(0, 10).map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {video.tags.length > 10 && (
                      <Chip
                        label={`+${video.tags.length - 10} more`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Box>
        )}
      </DialogContent>

      {video && (
        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button
            variant="outlined"
            startIcon={<OpenInNew />}
            onClick={openYouTubeVideo}
          >
            Open in YouTube
          </Button>
          {onDownloadRequest && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => onDownloadRequest(video.videoId, video.title)}
              sx={{
                background: 'linear-gradient(45deg, #ff4444 30%, #ff6b6b 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #ff3333 30%, #ff5555 90%)'
                }
              }}
            >
              Download Video
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  )
}

export default VideoDetails