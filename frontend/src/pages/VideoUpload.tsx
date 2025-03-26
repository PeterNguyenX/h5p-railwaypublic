import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Textarea,
  useToast,
  Heading,
  Text,
  Progress,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import videoStore from '../stores/videoStore';
import authStore from '../stores/authStore';

const VideoUpload = observer(() => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        title: 'Error',
        description: 'Please select a video file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for your video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('title', title);
      formData.append('description', description);

      await videoStore.uploadVideo(formData, (progress: number) => {
        setUploadProgress(progress);
      });

      toast({
        title: 'Success',
        description: 'Video uploaded successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload video',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Box maxW="container.md" mx="auto" p={6}>
      <Heading mb={6}>Upload Video</Heading>
      <form onSubmit={handleSubmit}>
        <VStack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description"
              rows={4}
            />
          </FormControl>

          <FormControl isRequired>
            <FormLabel>Video File</FormLabel>
            <Input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              p={1}
            />
            <Text fontSize="sm" color="gray.500" mt={1}>
              Supported formats: MP4, WebM, Ogg
            </Text>
          </FormControl>

          {isUploading && (
            <Box w="100%">
              <Progress value={uploadProgress} size="sm" colorScheme="blue" />
              <Text fontSize="sm" mt={2} textAlign="center">
                Uploading: {uploadProgress}%
              </Text>
            </Box>
          )}

          <Button
            type="submit"
            colorScheme="blue"
            width="100%"
            isLoading={isUploading}
            loadingText="Uploading..."
          >
            Upload Video
          </Button>
        </VStack>
      </form>
    </Box>
  );
});

export default VideoUpload; 