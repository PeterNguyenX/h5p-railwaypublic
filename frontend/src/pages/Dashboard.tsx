import React, { useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  VStack,
  Heading,
  SimpleGrid,
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Image,
  Text,
  HStack,
  Icon,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import videoStore from '../stores/videoStore';

const Dashboard = observer(() => {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        await videoStore.fetchVideos();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to fetch videos',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    };

    fetchVideos();
  }, [toast]);

  const handleDelete = async (id: string) => {
    try {
      await videoStore.deleteVideo(id);
      toast({
        title: 'Success',
        description: 'Video deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete video',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/videos/${id}/edit`);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8}>
        <Heading mb={4}>My Videos</Heading>
        <Button colorScheme="brand" onClick={() => navigate('/upload')}>
          Upload New Video
        </Button>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {videoStore.videos.map((video) => (
          <Card key={video.id} position="relative">
            <CardHeader>
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<FiMoreVertical size={20} />}
                  position="absolute"
                  top={2}
                  right={2}
                  variant="ghost"
                  aria-label="More options"
                />
                <MenuList>
                  <MenuItem icon={<FiEdit2 size={16} />} onClick={() => handleEdit(video.id)}>
                    Edit
                  </MenuItem>
                  <MenuItem
                    icon={<FiTrash2 size={16} />}
                    color="red.500"
                    onClick={() => handleDelete(video.id)}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
              <Heading size="md">{video.title}</Heading>
            </CardHeader>
            <CardBody>
              <Box
                position="relative"
                paddingTop="56.25%"
                cursor="pointer"
                onClick={() => navigate(`/video/${video.id}`)}
              >
                {video.thumbnailUrl ? (
                  <Image
                    src={`http://localhost:3001${video.thumbnailUrl}`}
                    alt={video.title}
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    objectFit="cover"
                    borderRadius="md"
                    fallback={<Box height="200px" bg="gray.200" borderRadius="md" />}
                  />
                ) : (
                  <Box
                    position="absolute"
                    top={0}
                    left={0}
                    width="100%"
                    height="100%"
                    bg="gray.100"
                    borderRadius="md"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="gray.500">No thumbnail</Text>
                  </Box>
                )}
              </Box>
              <Text mt={4} noOfLines={2}>
                {video.description}
              </Text>
            </CardBody>
            <CardFooter>
              <Text color="gray.500" fontSize="sm">
                Duration: {video.duration || 'N/A'}
              </Text>
            </CardFooter>
          </Card>
        ))}
      </SimpleGrid>
    </Container>
  );
});

export default Dashboard;
