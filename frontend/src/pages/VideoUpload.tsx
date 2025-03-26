import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Text,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import videoStore from '../stores/videoStore';

const VideoUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('video', file);
      await videoStore.uploadVideo(formData);
      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleYoutubeUpload = async () => {
    if (!youtubeUrl) return;

    try {
      setLoading(true);
      await videoStore.uploadYoutubeVideo(youtubeUrl);
      toast({
        title: 'Success',
        description: 'YouTube video import started. It will be available soon.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to import YouTube video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8}>
        <Tabs isFitted variant="enclosed" width="100%">
          <TabList mb="1em">
            <Tab>Upload Video File</Tab>
            <Tab>YouTube URL</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Choose Video File</FormLabel>
                  <Input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                  />
                </FormControl>

                <Button
                  colorScheme="blue"
                  onClick={handleFileUpload}
                  isLoading={loading}
                  isDisabled={!file}
                  width="100%"
                >
                  Upload Video
                </Button>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>YouTube Video URL</FormLabel>
                  <Input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                </FormControl>

                <Button
                  colorScheme="blue"
                  onClick={handleYoutubeUpload}
                  isLoading={loading}
                  isDisabled={!youtubeUrl}
                  width="100%"
                >
                  Import from YouTube
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

export default VideoUpload; 