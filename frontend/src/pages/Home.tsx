import React from 'react';
import { Box, Heading, Text, Button, VStack, Container } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container maxW="container.xl" py={10}>
      <VStack spacing={8} align="center" textAlign="center">
        <Heading size="2xl">{t('welcome.title')}</Heading>
        <Text fontSize="xl" color="gray.600">
          {t('welcome.description')}
        </Text>
        <Box>
          <Button size="lg" onClick={() => navigate('/login')} mr={4}>
            {t('login.title')}
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/register')}>
            {t('register.title')}
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default Home; 