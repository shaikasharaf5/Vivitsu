export type IssueStatus = 'reported' | 'assigned' | 'in_progress' | 'pending_inspection' | 'resolved' | 'closed';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';
export type IssueCategory = 'pothole' | 'streetlight' | 'graffiti' | 'trash' | 'water_leak' | 'road_damage' | 'other';

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: IssueCategory;
  status: IssueStatus;
  priority: IssuePriority;
  location: {
    address: string;
    lat: number;
    lng: number;
  };
  reportedBy: string;
  reportedAt: Date;
  assignedTo?: string;
  images: string[];
  upvotes: number;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

export const categoryLabels: Record<IssueCategory, string> = {
  pothole: 'Pothole',
  streetlight: 'Streetlight',
  graffiti: 'Graffiti',
  trash: 'Trash/Litter',
  water_leak: 'Water Leak',
  road_damage: 'Road Damage',
  other: 'Other',
};

export const statusLabels: Record<IssueStatus, string> = {
  reported: 'Reported',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  pending_inspection: 'Pending Inspection',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const priorityColors: Record<IssuePriority, string> = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

export const statusColors: Record<IssueStatus, string> = {
  reported: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  pending_inspection: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

// Generate demo issues
const demoIssues: Issue[] = [
  {
    id: '1',
    title: 'Large pothole on Main Street',
    description: 'There is a large pothole near the intersection of Main Street and 5th Avenue. It is causing damage to vehicles and is a safety hazard for cyclists.',
    category: 'pothole',
    status: 'reported',
    priority: 'high',
    location: { address: '123 Main Street', lat: 40.7128, lng: -74.006 },
    reportedBy: 'John Citizen',
    reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    images: ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400'],
    upvotes: 24,
    comments: [
      { id: '1', userId: '2', userName: 'Jane Doe', text: 'I damaged my tire here yesterday!', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
  },
  {
    id: '2',
    title: 'Broken streetlight on Oak Avenue',
    description: 'The streetlight has been out for a week now. The area is very dark at night and feels unsafe.',
    category: 'streetlight',
    status: 'assigned',
    priority: 'medium',
    location: { address: '456 Oak Avenue', lat: 40.7148, lng: -74.008 },
    reportedBy: 'Sarah Smith',
    reportedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    assignedTo: 'Mike Worker',
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'],
    upvotes: 12,
    comments: [],
  },
  {
    id: '3',
    title: 'Graffiti on public building',
    description: 'Vandalism on the side of the community center. Offensive language visible from the street.',
    category: 'graffiti',
    status: 'in_progress',
    priority: 'low',
    location: { address: '789 Community Dr', lat: 40.7168, lng: -74.002 },
    reportedBy: 'Bob Johnson',
    reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    assignedTo: 'Mike Worker',
    images: [],
    upvotes: 8,
    comments: [],
  },
  {
    id: '4',
    title: 'Water main leak flooding street',
    description: 'Water is gushing from a crack in the street. The water is spreading to nearby homes.',
    category: 'water_leak',
    status: 'in_progress',
    priority: 'critical',
    location: { address: '321 Elm Street', lat: 40.7108, lng: -74.004 },
    reportedBy: 'Mary Wilson',
    reportedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    assignedTo: 'Mike Worker',
    images: ['https://images.unsplash.com/photo-1504297050568-910d24c426d3?w=400'],
    upvotes: 45,
    comments: [
      { id: '2', userId: '3', userName: 'Neighbor', text: 'Water is reaching my driveway now', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    ],
  },
  {
    id: '5',
    title: 'Road damage after construction',
    description: 'The road surface is severely damaged after recent construction work. Multiple cracks and uneven surfaces.',
    category: 'road_damage',
    status: 'pending_inspection',
    priority: 'high',
    location: { address: '555 Pine Road', lat: 40.7188, lng: -74.01 },
    reportedBy: 'Tom Brown',
    reportedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    images: [],
    upvotes: 31,
    comments: [],
  },
  {
    id: '6',
    title: 'Overflowing trash bin in park',
    description: 'The public trash bin near the playground is overflowing and attracting pests.',
    category: 'trash',
    status: 'resolved',
    priority: 'medium',
    location: { address: 'Central Park, Section B', lat: 40.7138, lng: -74.012 },
    reportedBy: 'Lisa Green',
    reportedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    images: [],
    upvotes: 15,
    comments: [],
  },
];

let issues = [...demoIssues];

export const getIssues = () => issues;

export const getIssueById = (id: string) => issues.find(i => i.id === id);

export const addIssue = (issue: Omit<Issue, 'id' | 'reportedAt' | 'upvotes' | 'comments'>) => {
  const newIssue: Issue = {
    ...issue,
    id: Date.now().toString(),
    reportedAt: new Date(),
    upvotes: 0,
    comments: [],
  };
  issues = [newIssue, ...issues];
  return newIssue;
};

export const updateIssue = (id: string, updates: Partial<Issue>) => {
  issues = issues.map(i => i.id === id ? { ...i, ...updates } : i);
  return issues.find(i => i.id === id);
};

export const upvoteIssue = (id: string) => {
  issues = issues.map(i => i.id === id ? { ...i, upvotes: i.upvotes + 1 } : i);
};

export const addComment = (issueId: string, userId: string, userName: string, text: string) => {
  const comment: Comment = {
    id: Date.now().toString(),
    userId,
    userName,
    text,
    createdAt: new Date(),
  };
  issues = issues.map(i => i.id === issueId ? { ...i, comments: [...i.comments, comment] } : i);
};
