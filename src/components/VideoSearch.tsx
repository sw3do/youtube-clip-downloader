import React, { useState } from 'react'
import {
  Box,
  TextField,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
} from '@mui/material'
import {
  Search,
  PlayArrow,
  Visibility,
  Download
} from '@mui/icons-material'
import { YouTubeVideo } from '../types/electron'

interface VideoSearchProps {
  onVideoSelect?: (video: YouTubeVideo) => void
  onDownloadRequest?: (videoUrl: string) => void
}

const VideoSearch: React.FC<VideoSearchProps> = ({ onVideoSelect, onDownloadRequest }) => {
  const [query, setQuery] = useState('')
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.searchVideos(query, 12)
        if (result.success && result.videos) {
          setVideos(result.videos)
        } else {
          setError(result.error || 'Failed to search videos')
        }
      }
    } catch (err) {
      setError('An error occurred while searching')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
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

  const formatViewCount = (viewCount: string) => {
    const count = parseInt(viewCount)
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`
    }
    return `${count} views`
  }

  const formatPublishedDate = (publishedAt: string) => {
    const date = new Date(publishedAt)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return '1 day ago'
    if (diffDays < 30) return `${diffDays} days ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search YouTube videos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
        <Button
          variant="contained"
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <Search />}
          sx={{ minWidth: 120 }}
        >
          {loading ? 'Searching...' : 'Search'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {videos.map((video) => (
          <Grid item xs={12} sm={6} md={4} key={video.videoId}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: onVideoSelect ? 'pointer' : 'default',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': onVideoSelect ? {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                } : {}
              }}
              onClick={() => onVideoSelect?.(video)}
            >
              <Box sx={{ position: 'relative' }}>
                <CardMedia
                  component="img"
                  height="180"
                  image={video.thumbnails.medium?.url || video.thumbnails.default?.url}
                  alt={video.title}
                />
                {video.duration && (
                  <Chip
                    label={formatDuration(video.duration)}
                    size="small"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  />
                )}
                {onVideoSelect && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiCard-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    <IconButton
                      sx={{
                        bgcolor: 'rgba(255, 68, 68, 0.9)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(255, 68, 68, 1)'
                        }
                      }}
                    >
                      <PlayArrow sx={{ fontSize: 32 }} />
                    </IconButton>
                  </Box>
                )}
              </Box>
              <CardContent sx={{ p: 2 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    lineHeight: 1.3,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    mb: 1
                  }}
                >
                  {video.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1 }}
                >
                  {video.channelTitle}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  {video.viewCount && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ fontSize: 14 }} />
                      <Typography variant="caption">
                        {formatViewCount(video.viewCount)}
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {formatPublishedDate(video.publishedAt)}
                  </Typography>
                </Box>
                
                {onDownloadRequest && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<Download />}
                      onClick={(e) => {
                        e.stopPropagation()
                        onDownloadRequest(`https://www.youtube.com/watch?v=${video.videoId}`)
                      }}
                      sx={{
                        background: 'linear-gradient(45deg, #ff4444 30%, #ff6b6b 90%)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #ff3333 30%, #ff5555 90%)'
                        }
                      }}
                    >
                      Download
                    </Button>
                    {onVideoSelect && (
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={(e) => {
                          e.stopPropagation()
                          onVideoSelect(video)
                        }}
                      >
                        Details
                      </Button>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {videos.length === 0 && !loading && !error && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            Search for YouTube videos to get started
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default VideoSearch