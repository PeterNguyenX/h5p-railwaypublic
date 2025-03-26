import React from 'react';
import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  useDisclosure,
  useColorModeValue,
  Stack,
  Select,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import authStore from '../../stores/authStore';

const Navbar: React.FC = observer(() => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { t, i18n } = useTranslation();

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(event.target.value);
  };

  const Links = [
    { name: t('nav.dashboard'), path: '/dashboard' },
    { name: t('nav.upload'), path: '/upload' },
  ];

  const NavLink = ({ children, to }: { children: React.ReactNode; to: string }) => (
    <RouterLink to={to}>
      <Button variant="ghost">{children}</Button>
    </RouterLink>
  );

  return (
    <Box bg={useColorModeValue('white', 'gray.900')} px={4}>
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          size="md"
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label="Open Menu"
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems="center">
          <Box fontWeight="bold" fontSize="xl">
            H5P Video Platform
          </Box>
          <HStack as="nav" spacing={4} display={{ base: 'none', md: 'flex' }}>
            {Links.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {link.name}
              </NavLink>
            ))}
          </HStack>
        </HStack>
        <Flex alignItems="center">
          <Select
            size="sm"
            mr={4}
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
          </Select>
          {authStore.isAuthenticated ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
              >
                {authStore.user?.username}
              </MenuButton>
              <MenuList>
                <MenuItem as={RouterLink} to="/profile">
                  {t('nav.profile')}
                </MenuItem>
                <MenuItem as={RouterLink} to="/settings">
                  {t('nav.settings')}
                </MenuItem>
                <MenuItem onClick={() => authStore.logout()}>
                  {t('auth.logout')}
                </MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <HStack spacing={4}>
              <Button as={RouterLink} to="/login" variant="ghost">
                {t('auth.login')}
              </Button>
              <Button as={RouterLink} to="/register" colorScheme="brand">
                {t('auth.register')}
              </Button>
            </HStack>
          )}
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as="nav" spacing={4}>
            {Links.map((link) => (
              <NavLink key={link.path} to={link.path}>
                {link.name}
              </NavLink>
            ))}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
});

export default Navbar; 