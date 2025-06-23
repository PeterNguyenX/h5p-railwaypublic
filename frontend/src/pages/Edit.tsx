import React, { useState } from 'react';
import VideoUploader from '../components/VideoUploader';
import H5PEditor from '../components/H5PEditor';
import api from '../config/api';
import './Edit.css';

const Edit: React.FC = () => {
  const [videoId, setVideoId] = useState<string>('');
  const [ltiLink, setLtiLink] = useState<string | null>(null);
  const [ltiError, setLtiError] = useState<string | null>(null);

  const handleSave = (h5pData: any) => {
    // TODO: Save project with videoId and h5pData
    alert('Project updated!');
  };
  const handleCancel = () => {
    // TODO: Handle cancel (e.g., navigate away)
    alert('Cancelled');
  };
  const handleExportLTI = async () => {
    setLtiError(null);
    setLtiLink(null);
    if (!videoId) {
      setLtiError('No video selected.');
      return;
    }
    try {
      const res = await api.get<{ ltiLink: string }>(`/lti/generate/${videoId}`);
      setLtiLink(res.data.ltiLink);
    } catch (err: any) {
      setLtiError(err.response?.data?.error || 'Failed to generate LTI link');
    }
  };
  return (
    <div>
      <h1>Edit Project</h1>
      <VideoUploader onUpload={setVideoId} />
      <H5PEditor videoId={videoId} onSave={handleSave} onCancel={handleCancel} />
      <div className="lti-export-block">
        <button onClick={handleExportLTI}>Export LTI Link</button>
        {ltiLink && (
          <div className="lti-link-row">
            <label htmlFor="lti-link-input"><strong>LTI Link:</strong></label>
            <input id="lti-link-input" type="text" value={ltiLink} readOnly className="lti-link-input" title="LTI Link" onFocus={e => e.target.select()} />
            <button onClick={() => navigator.clipboard.writeText(ltiLink!)}>Copy</button>
          </div>
        )}
        {ltiError && <div className="lti-link-error">{ltiError}</div>}
      </div>
    </div>
  );
};
export default Edit;
