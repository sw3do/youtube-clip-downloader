import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Alert,
  Chip,
  Stack,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material'
import {
  Download,
  Refresh,
  Settings,
  Computer,
  CheckCircle,
  Error as ErrorIcon,
  FolderOpen
} from '@mui/icons-material'

interface YtDlpInfo {
  success: boolean
  version?: string
  binaryPath?: string
  platform?: string
  arch?: string
  error?: string
}

const YtDlpSettings: React.FC = () => {
  const [ytDlpInfo, setYtDlpInfo] = useState<YtDlpInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [showCustomPathDialog, setShowCustomPathDialog] = useState(false)
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  const loadYtDlpInfo = async () => {
    try {
      setLoading(true)
      const info = await window.electronAPI.getYtDlpInfo()
      setYtDlpInfo(info)
      if (info.binaryPath) {
        setCustomPath(info.binaryPath)
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to load yt-dlp information' })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      setUpdating(true)
      setAlert({ type: 'info', message: 'Updating yt-dlp binary...' })
      
      const result = await window.electronAPI.updateYtDlp()
      
      if (result.success) {
        setAlert({ type: 'success', message: 'yt-dlp updated successfully!' })
        await loadYtDlpInfo()
      } else {
        setAlert({ type: 'error', message: result.error || 'Failed to update yt-dlp' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to update yt-dlp' })
    } finally {
      setUpdating(false)
    }
  }

  const handleSetCustomPath = async () => {
    try {
      const result = await window.electronAPI.setYtDlpPath(customPath)
      
      if (result.success) {
        setAlert({ type: 'success', message: 'Custom yt-dlp path set successfully!' })
        setShowCustomPathDialog(false)
        await loadYtDlpInfo()
      } else {
        setAlert({ type: 'error', message: result.error || 'Failed to set custom path' })
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Failed to set custom path' })
    }
  }

  const getPlatformIcon = (platform?: string) => {
    switch (platform) {
      case 'darwin':
        return '🍎'
      case 'win32':
        return '🪟'
      case 'linux':
        return '🐧'
      default:
        return '💻'
    }
  }

  const getPlatformName = (platform?: string) => {
    switch (platform) {
      case 'darwin':
        return 'macOS'
      case 'win32':
        return 'Windows'
      case 'linux':
        return 'Linux'
      default:
        return 'Unknown'
    }
  }

  useEffect(() => {
    loadYtDlpInfo()
  }, [])

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [alert])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {alert && (
        <Alert 
          severity={alert.type} 
          sx={{ mb: 2 }}
          onClose={() => setAlert(null)}
        >
          {alert.message}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <Settings />
            <Typography variant="h6">yt-dlp Configuration</Typography>
          </Box>

          {ytDlpInfo?.success ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <CheckCircle color="success" fontSize="small" />
                  <Typography variant="body2">yt-dlp is properly configured</Typography>
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Version Information
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip 
                    label={`Version: ${ytDlpInfo.version || 'Unknown'}`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    icon={<Computer />}
                    label={`${getPlatformIcon(ytDlpInfo.platform)} ${getPlatformName(ytDlpInfo.platform)}`}
                    variant="outlined"
                    size="small"
                  />
                  <Chip 
                    label={`${ytDlpInfo.arch || 'Unknown'} architecture`}
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Binary Location
                </Typography>
                <Box 
                  sx={{ 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    backgroundColor: 'grey.800',
                    color: 'grey.100',
                    padding: 2,
                    borderRadius: 1,
                    wordBreak: 'break-all',
                    border: '1px solid',
                    borderColor: 'grey.600',
                    maxHeight: '100px',
                    overflow: 'auto'
                  }}
                >
                  {ytDlpInfo.binaryPath || 'Default system path'}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Actions
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Button
                    variant="contained"
                    startIcon={updating ? <CircularProgress size={16} /> : <Download />}
                    onClick={handleUpdate}
                    disabled={updating}
                  >
                    {updating ? 'Updating...' : 'Update yt-dlp'}
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<FolderOpen />}
                    onClick={() => setShowCustomPathDialog(true)}
                  >
                    Set Custom Path
                  </Button>
                  
                  <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={loadYtDlpInfo}
                  >
                    Refresh Info
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ErrorIcon color="error" />
                <Typography variant="body1" color="error">
                  yt-dlp Configuration Error
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {ytDlpInfo?.error || 'Failed to load yt-dlp information'}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={handleUpdate}
                disabled={updating}
              >
                {updating ? 'Installing...' : 'Install yt-dlp'}
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={showCustomPathDialog} 
        onClose={() => setShowCustomPathDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Set Custom yt-dlp Binary Path</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Specify a custom path to your yt-dlp binary. This is useful if you have yt-dlp installed system-wide or in a custom location.
          </Typography>
          <TextField
            fullWidth
            label="Binary Path"
            value={customPath}
            onChange={(e) => setCustomPath(e.target.value)}
            placeholder="/usr/local/bin/yt-dlp"
            variant="outlined"
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCustomPathDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSetCustomPath}
            variant="contained"
            disabled={!customPath.trim()}
          >
            Set Path
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default YtDlpSettings