import React from 'react';
import { Box, Heading, Text, Button, VStack, Container } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={6} align="center" textAlign="center">
        <Heading size="2xl">404</Heading>
        <Text fontSize="xl" color="gray.600">
          {t('error.pageNotFound')}
        </Text>
        <Button onClick={() => navigate('/')}>
          {t('common.backToHome')}
        </Button>
      </VStack>
    </Container>
  );
};

export default NotFound; 