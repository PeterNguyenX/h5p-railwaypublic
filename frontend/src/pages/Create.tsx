import React, { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import H5PEditor from '../components/H5PEditor';

// Create page: H5P editor and video upload/YouTube
const Create: React.FC = () => {
  const [videoId, setVideoId] = useState<string>('');
  const handleSave = (h5pData: any) => {
    // TODO: Save project with videoId and h5pData
    alert('Project saved!');
  };
  const handleCancel = () => {
    // TODO: Handle cancel (e.g., navigate away)
    alert('Cancelled');
  };
  return (
    <div>
      <h1>Create New Project</h1>
      <VideoUploader onUpload={setVideoId} />
      <H5PEditor videoId={videoId} onSave={handleSave} onCancel={handleCancel} />
    </div>
  );
};

export default Create;
