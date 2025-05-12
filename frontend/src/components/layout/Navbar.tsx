import React from 'react';
import './Navbar.css';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Stack,
  Select,
  AppBar,
  Toolbar,
  Typography,
  useTheme,
  useMediaQuery,
  SelectChangeEvent,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const Navbar: React.FC = observer(() => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isLoggedIn = !!localStorage.getItem('token');

  const handleLanguageChange = (event: SelectChangeEvent) => {
    i18n.changeLanguage(event.target.value);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    handleClose();
  };

  const Links = [
    { name: t('nav.dashboard'), path: '/dashboard' },
    { name: t('nav.upload'), path: '/upload' },
  ];

  const NavLink = ({ children, to }: { children: React.ReactNode; to: string }) => (
    <RouterLink to={to} className="router-link">
      <Button color="inherit">{children}</Button>
    </RouterLink>
  );

  return (
    <AppBar position="static" color="default">
      <Toolbar>
        {isMobile && (
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={() => setIsOpen(!isOpen)}
            sx={{ mr: 2 }}
          >
            {isOpen ? <CloseIcon /> : <MenuIcon />}
          </IconButton>
        )}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          H5P Video Platform
        </Typography>
        {!isMobile && (
          <Stack direction="row" spacing={2} sx={{ mr: 2 }}>
            {Links.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {link.name}
              </NavLink>
            ))}
          </Stack>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Select
            size="small"
            value={i18n.language}
            onChange={handleLanguageChange}
            sx={{ inlineSize: 100 }}
          >
            <MenuItem value="en">English</MenuItem>
            <MenuItem value="vi">Vietnamese</MenuItem>
          </Select>
          {isLoggedIn ? (
            <>
              <IconButton
                size="large"
                onClick={handleMenu}
                color="inherit"
              >
                <AccountCircleIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogout}>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={2}>
              <Button component={RouterLink} to="/login" color="inherit">
                {t('auth.login')}
              </Button>
              <Button component={RouterLink} to="/register" variant="contained">
                {t('auth.register')}
              </Button>
            </Stack>
          )}
        </Box>
      </Toolbar>
      {isOpen && isMobile && (
        <Box sx={{ p: 2 }}>
          <Stack spacing={2}>
            {Links.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {link.name}
              </NavLink>
            ))}
          </Stack>
        </Box>
      )}
    </AppBar>
  );
});

export default Navbar;