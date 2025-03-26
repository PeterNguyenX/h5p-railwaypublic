import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  HStack,
  Text,
  Image,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import videoStore, { Video } from '../stores/videoStore';

const VideoEdit = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3001/api/videos/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (!response.ok) throw new Error('Failed to fetch video');
        const data = await response.json();
        setVideo(data);
        setTitle(data.title);
        setDescription(data.description);
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch video details',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    try {
      setLoading(true);
      await videoStore.updateVideo(id, { title, description });
      toast({
        title: 'Success',
        description: 'Video updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!video) {
    return <Box>Video not found</Box>;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Edit Video</Heading>
        
        <Box>
          <Image
            src={`http://localhost:3001${video.thumbnailUrl}`}
            alt={video.title}
            borderRadius="md"
            height="200px"
            objectFit="cover"
            fallback={<Box height="200px" bg="gray.200" borderRadius="md" />}
          />
          <Text mt={2} color="gray.500">
            Duration: {video.duration}
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={4} align="stretch">
            <FormControl>
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

            <HStack spacing={4}>
              <Button type="submit" colorScheme="blue" isLoading={loading}>
                Save Changes
              </Button>
              <Button onClick={() => navigate('/dashboard')}>Cancel</Button>
            </HStack>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
});

export default VideoEdit; 