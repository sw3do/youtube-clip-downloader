import React, { useState, useEffect } from 'react'
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button
} from '@mui/material'
import {
  PlayArrow,
  Visibility,
  ThumbUp,
  TrendingUp,
  Download
} from '@mui/icons-material'
import { YouTubeVideo } from '../types/electron'

interface TrendingVideosProps {
  onVideoSelect?: (video: YouTubeVideo) => void
  onDownloadRequest?: (videoUrl: string) => void
}

const TrendingVideos: React.FC<TrendingVideosProps> = ({ onVideoSelect, onDownloadRequest }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [regionCode, setRegionCode] = useState('US')

  const regions = [
    { code: 'US', name: 'United States' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'CA', name: 'Canada' },
    { code: 'AU', name: 'Australia' },
    { code: 'DE', name: 'Germany' },
    { code: 'FR', name: 'France' },
    { code: 'JP', name: 'Japan' },
    { code: 'KR', name: 'South Korea' },
    { code: 'IN', name: 'India' },
    { code: 'BR', name: 'Brazil' }
  ]

  const loadTrendingVideos = async (region: string = regionCode) => {
    setLoading(true)
    setError(null)

    try {
      if (window.electronAPI) {
        const result = await window.electronAPI.getTrendingVideos(region, 12)
        if (result.success && result.videos) {
          setVideos(result.videos)
        } else {
          setError(result.error || 'Failed to load trending videos')
        }
      }
    } catch (err) {
      setError('An error occurred while loading trending videos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTrendingVideos()
  }, [])

  const handleRegionChange = (newRegion: string) => {
    setRegionCode(newRegion)
    loadTrendingVideos(newRegion)
  }

  const formatViewCount = (viewCount: string) => {
    const count = parseInt(viewCount)
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
  }

  const formatLikeCount = (likeCount: string) => {
    const count = parseInt(likeCount)
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`
    }
    return count.toString()
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6">Trending Videos</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Region</InputLabel>
          <Select
            value={regionCode}
            label="Region"
            onChange={(e) => handleRegionChange(e.target.value)}
          >
            {regions.map((region) => (
              <MenuItem key={region.code} value={region.code}>
                {region.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        {videos.map((video, index) => (
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
                <Chip
                  label={`#${index + 1}`}
                  size="small"
                  color="primary"
                  sx={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    fontWeight: 'bold'
                  }}
                />
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  {video.viewCount && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Visibility sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatViewCount(video.viewCount)}
                      </Typography>
                    </Box>
                  )}
                  {video.likeCount && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <ThumbUp sx={{ fontSize: 14, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary">
                        {formatLikeCount(video.likeCount)}
                      </Typography>
                    </Box>
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', mb: 1 }}>
                  {formatPublishedDate(video.publishedAt)}
                </Typography>
                
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
            No trending videos available
          </Typography>
        </Box>
      )}
    </Box>
  )
}

export default TrendingVideos