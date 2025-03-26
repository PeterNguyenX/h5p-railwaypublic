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
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import authStore from '../stores/authStore';

const Login: React.FC = observer(() => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');

    if (!email) {
      setEmailError(t('auth.emailRequired'));
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError(t('auth.invalidEmail'));
      isValid = false;
    }

    if (!password) {
      setPasswordError(t('auth.passwordRequired'));
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError(t('auth.passwordTooShort'));
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
      await authStore.login(email, password);
      toast({
        title: t('auth.loginSuccess'),
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // Redirect to the originally requested page or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('auth.loginError');
      toast({
        title: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderWidth={1} borderRadius={8} boxShadow="lg">
      <VStack spacing={4} align="stretch">
        <Heading textAlign="center">{t('auth.login')}</Heading>
        <form onSubmit={handleSubmit}>
          <VStack spacing={4}>
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
            <Button type="submit" colorScheme="brand" width="full" isLoading={authStore.loading}>
              {t('auth.login')}
            </Button>
          </VStack>
        </form>
        <Text textAlign="center">
          {t('auth.noAccount')}{' '}
          <Link as={RouterLink} to="/register" color="brand.500">
            {t('auth.register')}
          </Link>
        </Text>
        <Text textAlign="center">
          <Link as={RouterLink} to="/forgot-password" color="brand.500">
            {t('auth.forgotPassword')}
          </Link>
        </Text>
      </VStack>
    </Box>
  );
});

export default Login;

