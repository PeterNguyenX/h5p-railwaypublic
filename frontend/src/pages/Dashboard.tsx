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
  createIcon,
} from '@chakra-ui/react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiEdit2, FiTrash2 } from 'react-icons/fi';
import videoStore from '../stores/videoStore';

const MoreIcon = createIcon({
  displayName: 'MoreIcon',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
    />
  ),
});

const EditIcon = createIcon({
  displayName: 'EditIcon',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  ),
});

const TrashIcon = createIcon({
  displayName: 'TrashIcon',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  ),
});

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
            <Box
              position="relative"
              paddingTop="56.25%"
              cursor="pointer"
              onClick={() => navigate(`/videos/${video.id}/edit`)}
            >
              {video.thumbnailPath ? (
                <Image
                  src={`http://localhost:3001${video.thumbnailPath}`}
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
              <Menu>
                <MenuButton
                  as={IconButton}
                  icon={<MoreIcon w={5} h={5} />}
                  position="absolute"
                  top={2}
                  right={2}
                  variant="ghost"
                  aria-label="More options"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                />
                <MenuList onClick={(e) => e.stopPropagation()}>
                  <MenuItem icon={<EditIcon w={4} h={4} />} onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(video.id);
                  }}>
                    Edit
                  </MenuItem>
                  <MenuItem
                    icon={<TrashIcon w={4} h={4} />}
                    color="red.500"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(video.id);
                    }}
                  >
                    Delete
                  </MenuItem>
                </MenuList>
              </Menu>
            </Box>
            <CardBody>
              <Heading size="md" mb={2}>{video.title}</Heading>
              <Text noOfLines={2}>
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
