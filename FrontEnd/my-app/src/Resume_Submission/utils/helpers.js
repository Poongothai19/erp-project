// src/ResumeSubmission/utils/helpers.js
export const getStatusText = (status) => {
  const statusMap = {
    'new': 'New',
    'reviewed': 'Reviewed',
    'interview': 'Interview',
    'offer': 'Offer',
    'hired': 'Hired',
    'rejected': 'Rejected'
  };
  return statusMap[status] || status;
};

export const formatDate = (dateString) => {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-US', options);
};

export const getRandomColor = () => {
  const colors = [
    '#4361ee', '#3f37c9', '#4895ef', '#4cc9f0',
    '#7209b7', '#560bad', '#480ca8', '#3a0ca3',
    '#3f37c9', '#4361ee', '#4895ef', '#4cc9f0',
    '#f72585', '#b5179e', '#7209b7', '#560bad'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const applyFilters = (candidates, filters, sortConfig) => {
  let result = [...candidates];
  
  // Search filter
  if (filters.search) {
    const searchTerm = filters.search.toLowerCase();
    result = result.filter(candidate => 
      candidate.name.toLowerCase().includes(searchTerm) ||
      candidate.role.toLowerCase().includes(searchTerm) ||
      candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm)) ||
      candidate.email.toLowerCase().includes(searchTerm) ||
      candidate.submittedBy.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Status filter
  if (filters.status !== 'all') {
    result = result.filter(candidate => candidate.status === filters.status);
  }
  
  // Role filter
  if (filters.role !== 'all') {
    const roleMap = {
      'frontend': 'Frontend Developer',
      'backend': 'Backend Developer',
      'fullstack': 'Full Stack Developer',
      'designer': 'UI/UX Designer',
      'pm': 'Product Manager'
    };
    result = result.filter(candidate => candidate.role === roleMap[filters.role]);
  }
  
  // Date filter
  if (filters.date !== 'all') {
    const now = new Date();
    result = result.filter(candidate => {
      const candidateDate = new Date(candidate.date);
      
      switch (filters.date) {
        case 'today':
          return candidateDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return candidateDate >= weekAgo;
        case 'month':
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          return candidateDate >= monthAgo;
        default:
          return true;
      }
    });
  }
  
  // Sorting
  result.sort((a, b) => {
    let comparison = 0;
    
    switch (sortConfig.key) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'experience':
        comparison = parseFloat(a.experience) - parseFloat(b.experience);
        break;
      case 'date':
        comparison = new Date(a.date) - new Date(b.date);
        break;
    }
    
    return sortConfig.direction === 'asc' ? comparison : -comparison;
  });
  
  return result;
};