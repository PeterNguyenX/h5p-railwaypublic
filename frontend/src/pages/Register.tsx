import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  useToast,
  Link,
  FormErrorMessage,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import authStore from '../stores/authStore';

const Register: React.FC = observer(() => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const validateForm = () => {
    let isValid = true;
    setUsernameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Username validation
    if (!username) {
      setUsernameError(t('auth.usernameRequired'));
      isValid = false;
    } else if (username.length < 3) {
      setUsernameError(t('auth.usernameTooShort'));
      isValid = false;
    }

    // Email validation
    if (!email) {
      setEmailError(t('auth.emailRequired'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('auth.invalidEmail'));
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      setConfirmPasswordError(t('auth.confirmPasswordRequired'));
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError(t('auth.passwordMismatch'));
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await authStore.register(username, email, password);
      toast({
        title: t('auth.registerSuccess'),
        description: t('auth.redirectingToLogin'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.registerError');
      toast({
        title: t('auth.registrationFailed'),
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius={8} boxShadow="lg">
      <VStack spacing={4} align="stretch">
        <Heading textAlign="center">{t('auth.register')}</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isInvalid={!!usernameError}>
              <FormLabel>{t('auth.username')}</FormLabel>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('auth.usernamePlaceholder')}
              />
              <FormErrorMessage>{usernameError}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!emailError}>
              <FormLabel>{t('auth.email')}</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
              />
              <FormErrorMessage>{emailError}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!passwordError}>
              <FormLabel>{t('auth.password')}</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
              />
              <FormErrorMessage>{passwordError}</FormErrorMessage>
            </FormControl>
            <FormControl isInvalid={!!confirmPasswordError}>
              <FormLabel>{t('auth.confirmPassword')}</FormLabel>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.confirmPasswordPlaceholder')}
              />
              <FormErrorMessage>{confirmPasswordError}</FormErrorMessage>
            </FormControl>
            <Button 
              type="submit" 
              colorScheme="brand" 
              width="full"
              isLoading={authStore.loading}
            >
              {t('auth.register')}
            </Button>
          </VStack>
        </form>
        <Text textAlign="center">
          {t('auth.haveAccount')}{' '}
          <Link as={RouterLink} to="/login" color="brand.500">
            {t('auth.login')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
});

export default Register; 