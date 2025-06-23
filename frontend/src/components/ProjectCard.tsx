import React from 'react';
import './ProjectCard.css';

// ProjectCard component: shows project info and actions
const ProjectCard = ({ title, thumbnail, onEdit, onDelete, onExport }: any) => (
  <div>
    <img className="project-thumbnail" src={thumbnail} alt={title} />
    <h2>{title}</h2>
    <button onClick={onEdit}>Edit</button>
    <button onClick={onDelete}>Delete</button>
    <button onClick={onExport}>Export LTI</button>
  </div>
);

export default ProjectCard;
