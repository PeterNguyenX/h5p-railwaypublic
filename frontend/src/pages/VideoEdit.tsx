import React, { useEffect, useState, useRef } from 'react';
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
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  IconButton,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useParams, useNavigate } from 'react-router-dom';
import { FiPlay, FiPause, FiScissors, FiSave } from 'react-icons/fi';
import videoStore, { Video } from '../stores/videoStore';
import { IconType } from 'react-icons';

const VideoEdit = observer(() => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);
  const [h5pContent, setH5pContent] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

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
        setH5pContent(data.h5pContent || '');
        if (data.duration) {
          setTrimEnd(parseFloat(data.duration));
        }
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

  const handleMetadataLoaded = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (!trimEnd) {
        setTrimEnd(videoRef.current.duration);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTrim = async () => {
    if (!video) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/videos/${video.id}/trim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          startTime: trimStart,
          endTime: trimEnd,
        }),
      });

      if (!response.ok) throw new Error('Failed to trim video');

      const data = await response.json();
      setVideo(data.video);
      toast({
        title: 'Success',
        description: 'Video trimmed successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to trim video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleH5PContentSave = async () => {
    if (!video) return;
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/videos/${video.id}/h5p`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          h5pContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to save H5P content');

      toast({
        title: 'Success',
        description: 'H5P content saved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save H5P content',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        
        <Tabs isFitted variant="enclosed">
          <TabList>
            <Tab>Basic Info</Tab>
            <Tab>Edit Video</Tab>
            <Tab>H5P Content</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
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
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Box position="relative">
                  <video
                    ref={videoRef}
                    src={`http://localhost:3001/api/videos/${video.id}/stream`}
                    style={{ width: '100%' }}
                    onLoadedMetadata={handleMetadataLoaded}
                    onTimeUpdate={handleTimeUpdate}
                    onError={(e) => {
                      toast({
                        title: 'Error',
                        description: 'Failed to load video',
                        status: 'error',
                        duration: 3000,
                        isClosable: true,
                      });
                    }}
                    controls
                  />
                  <IconButton
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                    icon={isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                    position="absolute"
                    bottom="4"
                    left="4"
                    onClick={togglePlay}
                  />
                </Box>

                <Text>Current Time: {formatTime(currentTime)}</Text>

                <Box>
                  <Text mb={2}>Trim Video</Text>
                  <Flex align="center">
                    <Text mr={4}>Start: {formatTime(trimStart)}</Text>
                    <Slider
                      value={trimStart}
                      min={0}
                      max={duration}
                      step={0.1}
                      onChange={setTrimStart}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Flex>
                  <Flex align="center" mt={4}>
                    <Text mr={4}>End: {formatTime(trimEnd)}</Text>
                    <Slider
                      value={trimEnd}
                      min={0}
                      max={duration}
                      step={0.1}
                      onChange={setTrimEnd}
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                  </Flex>
                  <Button
                    leftIcon={<FiScissors size={20} />}
                    mt={4}
                    onClick={handleTrim}
                    isLoading={loading}
                  >
                    Trim Video
                  </Button>
                </Box>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <FormControl>
                  <FormLabel>H5P Content</FormLabel>
                  <Textarea
                    value={h5pContent}
                    onChange={(e) => setH5pContent(e.target.value)}
                    placeholder="Enter H5P content"
                    rows={10}
                  />
                </FormControl>

                <Button
                  leftIcon={<FiSave size={20} />}
                  colorScheme="blue"
                  onClick={handleH5PContentSave}
                  isLoading={loading}
                >
                  Save H5P Content
                </Button>
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
});

export default VideoEdit; 