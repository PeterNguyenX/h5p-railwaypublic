import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AdminPanelSettings,
  People,
  VideoLibrary,
  BarChart,
  Delete,
  Edit,
  Block,
  CheckCircle,
  PersonAdd
} from '@mui/icons-material';
import authStore from '../stores/authStore';
import api from '../config/api';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

interface AdminStats {
  stats: {
    totalUsers: number;
    totalVideos: number;
    totalH5PContent: number;
  };
  recent: {
    users: any[];
    videos: any[];
  };
  videoStats: any[];
}

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  status: string;
  duration: string;
  createdAt: string;
  User: {
    username: string;
    email: string;
  };
}

const AdminDashboard: React.FC = () => {
  const { user } = authStore;
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDialog, setUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [createAdminDialog, setCreateAdminDialog] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if current user is admin
  useEffect(() => {
    if ((user as any)?.role !== 'admin') {
      // Redirect non-admin users
      window.location.href = '/dashboard';
    }
  }, [user]);

  useEffect(() => {
    fetchAdminStats();
    fetchUsers();
    fetchVideos();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data as AdminStats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      setMessage({ type: 'error', text: 'Failed to fetch admin statistics' });
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers((response.data as any).users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await api.get('/admin/videos');
      setVideos((response.data as any).videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setMessage({ type: 'error', text: 'Failed to fetch videos' });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleUpdateUserRole = async () => {
    if (!selectedUser || !newRole) return;

    try {
      await api.put(`/admin/users/${selectedUser.id}/role`, { role: newRole });
      setMessage({ type: 'success', text: 'User role updated successfully' });
      fetchUsers();
      setUserDialog(false);
      setSelectedUser(null);
      setNewRole('');
    } catch (error) {
      console.error('Error updating user role:', error);
      setMessage({ type: 'error', text: 'Failed to update user role' });
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      await api.put(`/admin/users/${userId}/status`);
      setMessage({ type: 'success', text: 'User status updated successfully' });
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      setMessage({ type: 'error', text: 'Failed to update user status' });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/admin/videos/${videoId}`);
      setMessage({ type: 'success', text: 'Video deleted successfully' });
      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      setMessage({ type: 'error', text: 'Failed to delete video' });
    }
  };

  const handleCreateAdmin = async () => {
    try {
      await api.post('/admin/create-admin', newAdmin);
      setMessage({ type: 'success', text: 'Admin user created successfully' });
      fetchUsers();
      setCreateAdminDialog(false);
      setNewAdmin({ username: '', email: '', password: '' });
    } catch (error: any) {
      console.error('Error creating admin:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Failed to create admin user' 
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Container>
        <Alert severity="error">Access denied. Admin privileges required.</Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <AdminPanelSettings sx={{ mr: 2, fontSize: 40 }} />
          <Typography variant="h4">Admin Dashboard</Typography>
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<BarChart />} label="Overview" />
            <Tab icon={<People />} label="Users" />
            <Tab icon={<VideoLibrary />} label="Videos" />
          </Tabs>
        </Box>

        {/* Overview Tab */}
        <CustomTabPanel value={tabValue} index={0}>
          {stats && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      Total Users
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {stats.stats.totalUsers}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      Total Videos
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {stats.stats.totalVideos}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" color="text.secondary">
                      H5P Content
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {stats.stats.totalH5PContent}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Recent Activity */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Users
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Role</TableCell>
                            <TableCell>Joined</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.recent.users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell>{user.username}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={user.role} 
                                  color={user.role === 'admin' ? 'error' : 'default'}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(user.createdAt).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Recent Videos
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Owner</TableCell>
                            <TableCell>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {stats.recent.videos.map((video) => (
                            <TableRow key={video.id}>
                              <TableCell>{video.title}</TableCell>
                              <TableCell>{video.User?.username}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={video.status} 
                                  color={video.status === 'ready' ? 'success' : 'warning'}
                                  size="small"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </CustomTabPanel>

        {/* Users Tab */}
        <CustomTabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6">User Management</Typography>
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={() => setCreateAdminDialog(true)}
            >
              Create Admin
            </Button>
          </Box>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        color={user.role === 'admin' ? 'error' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        color={user.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit Role">
                        <IconButton
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                            setUserDialog(true);
                          }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={user.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton
                          onClick={() => handleToggleUserStatus(user.id)}
                          color={user.isActive ? 'error' : 'success'}
                        >
                          {user.isActive ? <Block /> : <CheckCircle />}
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>

        {/* Videos Tab */}
        <CustomTabPanel value={tabValue} index={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>Video Management</Typography>
          
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Owner</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>{video.title}</TableCell>
                    <TableCell>{video.User?.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={video.status} 
                        color={video.status === 'ready' ? 'success' : 'warning'}
                      />
                    </TableCell>
                    <TableCell>{video.duration}</TableCell>
                    <TableCell>
                      {new Date(video.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Delete Video">
                        <IconButton
                          onClick={() => handleDeleteVideo(video.id)}
                          color="error"
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CustomTabPanel>
      </Box>

      {/* Edit User Role Dialog */}
      <Dialog open={userDialog} onClose={() => setUserDialog(false)}>
        <DialogTitle>Edit User Role</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              label="Role"
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUserRole} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={createAdminDialog} onClose={() => setCreateAdminDialog(false)}>
        <DialogTitle>Create Admin User</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Username"
            value={newAdmin.username}
            onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={newAdmin.email}
            onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={newAdmin.password}
            onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateAdminDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateAdmin} variant="contained">
            Create Admin
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Snackbar */}
      <Snackbar
        open={!!message}
        autoHideDuration={6000}
        onClose={() => setMessage(null)}
      >
        <Alert 
          onClose={() => setMessage(null)} 
          severity={message?.type}
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;
