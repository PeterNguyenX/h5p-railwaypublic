import { Link } from "react-router";
import { Plus, Play, MoreVertical, Edit3, Share2, Video as VideoIcon } from "lucide-react";

const VIDEOS = [
  {
    id: "1",
    title: "Introduction to Biology",
    status: "Published",
    date: "Oct 12, 2026",
    duration: "14:20",
    interactions: 5,
    thumbnail: "https://images.unsplash.com/photo-1544191046-397b734b0891?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjbGFzc3Jvb20lMjB0ZWFjaGVyfGVufDF8fHx8MTc3MzU1MjQ2MHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "2",
    title: "Chemical Reactions Lab",
    status: "Draft",
    date: "Oct 10, 2026",
    duration: "08:45",
    interactions: 0,
    thumbnail: "https://images.unsplash.com/photo-1758685734201-72662f1a368d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbmNlJTIwZXhwZXJpbWVudCUyMHN0dWRlbnR8ZW58MXx8fHwxNzczNjUxNDM4fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: "3",
    title: "World War II Overview",
    status: "Published",
    date: "Sep 28, 2026",
    duration: "22:10",
    interactions: 12,
    thumbnail: "https://images.unsplash.com/photo-1756507175997-7dfc3ff3b353?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoaXN0b3J5JTIwbWFwJTIwdGVhY2hlcnxlbnwxfHx8fDE3NzM2NTE0NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Videos</h1>
          <p className="text-slate-600 text-[15px]">Manage and edit your interactive lessons.</p>
        </div>
        
        <Link 
          to="/app/editor" 
          className="inline-flex items-center gap-2.5 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          Create New Video
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-8 flex space-x-6">
        <button className="pb-3 border-b-2 border-blue-800 text-blue-900 font-semibold text-[15px]">
          All Videos (3)
        </button>
        <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-[15px]">
          Published
        </button>
        <button className="pb-3 border-b-2 border-transparent text-slate-500 hover:text-slate-700 font-medium text-[15px]">
          Drafts
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VIDEOS.map((video) => (
          <div key={video.id} className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            {/* Thumbnail area */}
            <div className="relative aspect-video bg-slate-100">
              <img 
                src={video.thumbnail} 
                alt={video.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button className="bg-white text-slate-900 p-3 rounded-full hover:scale-105 transition-transform shadow-sm" title="Preview">
                  <Play className="w-5 h-5 fill-slate-900" />
                </button>
                <Link to={`/app/editor/${video.id}`} className="bg-blue-800 text-white p-3 rounded-full hover:scale-105 transition-transform shadow-sm" title="Edit Video">
                  <Edit3 className="w-5 h-5" />
                </Link>
              </div>
              <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-xs font-medium px-2 py-1 rounded-md backdrop-blur-sm">
                {video.duration}
              </div>
            </div>

            {/* Content area */}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                    video.status === "Published" ? "bg-slate-100 text-slate-700" : "bg-orange-50 text-orange-800"
                  }`}>
                    {video.status}
                  </span>
                </div>
                <button className="text-slate-400 hover:text-slate-600 p-1">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
              
              <h3 className="font-bold text-[17px] text-slate-900 mb-1 line-clamp-1 group-hover:text-blue-800 transition-colors">
                {video.title}
              </h3>
              
              <div className="flex items-center text-sm text-slate-500 mb-5">
                <span>Last edited {video.date}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                <Link 
                  to={`/app/editor/${video.id}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-50 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  {video.status === "Draft" ? "Continue Editing" : "Edit"}
                </Link>
                {video.status === "Published" && (
                  <button className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-colors">
                    <Share2 className="w-4 h-4 text-slate-400" />
                    Share
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Create Empty Card */}
        <Link to="/app/editor" className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center p-8 hover:bg-slate-100 hover:border-slate-400 transition-colors text-center group min-h-[340px]">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 border border-slate-200">
            <Plus className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-[17px] font-bold text-slate-700 mb-2">Create New Video</h3>
          <p className="text-sm text-slate-500 max-w-[200px]">Upload a new file or import from YouTube to start.</p>
        </Link>
      </div>
    </div>
  );
}
