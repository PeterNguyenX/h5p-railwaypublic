import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

const VideoPlayer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const toast = useToast();

  // Placeholder video data
  const video = {
    id,
    title: 'Sample Video',
    description: 'This is a sample video description.',
    url: 'https://example.com/video.mp4',
    duration: '10:00',
    createdAt: new Date().toISOString(),
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Box
          position="relative"
          paddingTop="56.25%" // 16:9 Aspect Ratio
          bg="black"
          borderRadius="md"
          overflow="hidden"
        >
          <Box
            position="absolute"
            top="0"
            left="0"
            right="0"
            bottom="0"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
          >
            <Text>Video Player Placeholder</Text>
          </Box>
        </Box>

        <VStack align="stretch" spacing={4}>
          <Heading size="xl">{video.title}</Heading>
          <Text color="gray.600">{video.description}</Text>
          <HStack spacing={4}>
            <Text color="gray.500">{video.duration}</Text>
            <Text color="gray.500">
              {new Date(video.createdAt).toLocaleDateString()}
            </Text>
          </HStack>
          <HStack>
            <Button colorScheme="brand">{t('video.edit')}</Button>
            <Button variant="outline" colorScheme="red">
              {t('video.delete')}
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Container>
  );
};

export default VideoPlayer; 