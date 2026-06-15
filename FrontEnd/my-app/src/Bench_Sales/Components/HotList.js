



import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import BASE_URL from '../../url';
import * as XLSX from 'xlsx'; // Add this import for Excel support
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Download, 
  Upload,
  Search,
  Filter,
  MoreHorizontal,
  Copy,
  Star,
  Scissors,
  Send,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Flag,
  FileSpreadsheet
} from 'lucide-react';

const ProphecyHotList = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [columns, setColumns] = useState([
    'S. No',
    'Full Name',
    'Role',
    'Exp',
    'State',
    'Relocation',
    'Visa',
    'Priority'
  ]);

  const [editingCell, setEditingCell] = useState({ row: null, col: null });
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedCells, setSelectedCells] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(null);
  const [draggedColumn, setDraggedColumn] = useState(null);
  const [showSendHotlist, setShowSendHotlist] = useState(false);
  const [vendorEmail, setVendorEmail] = useState('');
  const [emailService, setEmailService] = useState('gmail');
  const [emailSubject, setEmailSubject] = useState('Hotlist Candidates');
  const [emailBody, setEmailBody] = useState('Please find attached the hotlist candidates.');

  // Drag and drop states for rows
  const [draggedRow, setDraggedRow] = useState(null);
  const [dragOverRow, setDragOverRow] = useState(null);

  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Priority CSS class mapping
  const getPriorityClass = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'high':
        return 'prophecy-priority-high';
      case 'medium':
        return 'prophecy-priority-medium';
      case 'low':
        return 'prophecy-priority-low';
      default:
        return 'prophecy-priority-default';
    }
  };



   const fetchHotlistData = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    Swal.fire({
      title: 'Authentication Required',
      text: 'Please login to access hotlist',
      icon: 'warning'
    }).then(() => {
      window.location.href = '/login';
    });
    return;
  }

  try {
    setLoading(true);
    const response = await axios.get(`${BASE_URL}/api/hotlist`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      params: {
        limit: 1000,
        orderBy: 'CreatedAt',      // CHANGED: Order by CreatedAt to maintain import order
        orderDirection: 'ASC'      // CHANGED: ASC to show in the same order as imported
      }
    });

    if (response.data.success && response.data.data) {
      const transformedData = response.data.data.map(item => ({
        id: item.Id,
        'Priority': item.Priority || 'Medium',
        'Full Name': item.FullName || '',
        'Role': item.Role || '',
        'Exp': item.Exp || '',
        'State': item.State || '',
        'Relocation': item.Relocation || '',
        'Visa': item.Visa || ''
      }));
      
      setData(transformedData);
      setFilteredData(transformedData);
      setSelectedRows([]);
      setSelectAll(false);
    } else {
      setData([]);
      setFilteredData([]);
      setSelectedRows([]);
      setSelectAll(false);
    }
  } catch (error) {
    console.error('Fetch hotlist error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      Swal.fire({
        title: 'Session Expired',
        text: 'Please login again',
        icon: 'warning'
      }).then(() => {
        window.location.href = '/login';
      });
    } else {
      Swal.fire({
        title: 'Error',
        text: 'Failed to load hotlist data',
        icon: 'error'
      });
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchHotlistData();
  }, []);

  useEffect(() => {
    if (editingCell.row !== null && editingCell.col !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingCell]);

  useEffect(() => {
    const filtered = data.filter(row =>
      Object.values(row).some(value =>
        value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(filtered);
    setSelectedRows([]);
    setSelectAll(false);
  }, [data, searchTerm]);

  // Handle individual row selection
  const handleRowSelect = (rowId) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };

  // Handle select all rows
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      const allRowIds = filteredData.map(row => row.id);
      setSelectedRows(allRowIds);
    }
    setSelectAll(!selectAll);
  };

  // Check if a row is selected
  const isRowSelected = (rowId) => {
    return selectedRows.includes(rowId);
  };

  // Bulk delete selected rows
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) {
      Swal.fire({
        title: 'No Rows Selected',
        text: 'Please select at least one row to delete',
        icon: 'warning'
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `You are about to delete ${selectedRows.length} candidate(s). This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: `Yes, delete ${selectedRows.length} candidate(s)!`
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('token');
    
    try {
      // Delete all selected rows from the server
      const deletePromises = selectedRows.map(rowId => 
        axios.delete(`${BASE_URL}/api/hotlist/${rowId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(deletePromises);

      // Update local state
      const newData = data.filter(item => !selectedRows.includes(item.id));
      setData(newData);
      setSelectedRows([]);
      setSelectAll(false);
      
      Swal.fire({
        title: 'Deleted!',
        text: `${selectedRows.length} candidate(s) have been deleted.`,
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete some candidates. Please try again.',
        icon: 'error'
      });
    }
  };

  const handleCellClick = (rowIndex, colName) => {
    if (colName === 'S. No') return;
    setEditingCell({ row: rowIndex, col: colName });
  };

  const handleCellChange = async (value, rowIndex, colName) => {
    const token = localStorage.getItem('token');
    const candidate = filteredData[rowIndex];
    
    if (!candidate) {
      console.error('Candidate not found at index:', rowIndex);
      return;
    }

    try {
      // Update locally first
      const newData = [...data];
      const dataIndex = newData.findIndex(item => item.id === candidate.id);
      if (dataIndex !== -1) {
        newData[dataIndex] = { ...newData[dataIndex], [colName]: value };
        setData(newData);
      }

      const getCurrentValue = (fieldName) => {
        const currentValue = candidate[fieldName];
        if (currentValue === null || currentValue === undefined) {
          return '';
        }
        return String(currentValue);
      };

      const processValue = (inputValue) => {
        if (inputValue === null || inputValue === undefined || inputValue === '') {
          return '';
        }
        return String(inputValue);
      };

      const apiPayload = {
        fullName: colName === 'Full Name' ? processValue(value) : getCurrentValue('Full Name'),
        role: colName === 'Role' ? processValue(value) : getCurrentValue('Role'),
        exp: colName === 'Exp' ? processValue(value) : getCurrentValue('Exp'),
        state: colName === 'State' ? processValue(value) : getCurrentValue('State'),
        relocation: colName === 'Relocation' ? processValue(value) : getCurrentValue('Relocation'),
        visa: colName === 'Visa' ? processValue(value) : getCurrentValue('Visa'),
        priority: colName === 'Priority' ? processValue(value) : getCurrentValue('Priority')
      };

      const response = await axios.put(`${BASE_URL}/api/hotlist/${candidate.id}`, apiPayload, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await fetchHotlistData();
      } else {
        throw new Error(response.data.message || 'Update failed');
      }

    } catch (error) {
      console.error('Update error:', error);
      await fetchHotlistData();
      
      Swal.fire({
        title: 'Update Error',
        text: `Failed to update ${colName}. Error: ${error.response?.data?.message || error.message}`,
        icon: 'error'
      });
    }
  };

  const handleCellBlur = () => {
    setEditingCell({ row: null, col: null });
  };

  const handleKeyDown = (e, rowIndex, colName) => {
    if (e.key === 'Enter') {
      setEditingCell({ row: null, col: null });
    } else if (e.key === 'Escape') {
      setEditingCell({ row: null, col: null });
    }
  };

    const addRow = async () => {
      const token = localStorage.getItem('token');
      
      try {
        const newCandidateData = {
          fullName: 'New Candidate',
          role: '',
          exp: '',
          state: '',
          relocation: '',
          visa: '',
          priority: 'Medium'
        };

        const response = await axios.post(`${BASE_URL}/api/hotlist`, newCandidateData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.success) {
          // CHANGED: Add new candidate at the beginning of the array
          const newCandidate = {
            id: response.data.data.Id,
            'Priority': response.data.data.Priority || 'Medium',
            'Full Name': response.data.data.FullName || '',
            'Role': response.data.data.Role || '',
            'Exp': response.data.data.Exp || '',
            'State': response.data.data.State || '',
            'Relocation': response.data.data.Relocation || '',
            'Visa': response.data.data.Visa || ''
          };
          
          // Add to the beginning instead of fetching all data
          setData(prevData => [newCandidate, ...prevData]);
          setFilteredData(prevData => [newCandidate, ...prevData]);
          
          Swal.fire({
            title: 'Success',
            text: 'New candidate added at the top',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
        }
      } catch (error) {
        console.error('Add candidate error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to add candidate',
          icon: 'error'
        });
      }
    };

  const deleteRow = async (index) => {
    const candidate = filteredData[index];
    if (!candidate) return;

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: `Delete ${candidate['Full Name']}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (!confirm.isConfirmed) return;

    const token = localStorage.getItem('token');
    
    try {
      await axios.delete(`${BASE_URL}/api/hotlist/${candidate.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const newData = data.filter(item => item.id !== candidate.id);
      setData(newData);
      
      // Remove from selected rows if it was selected
      setSelectedRows(prev => prev.filter(id => id !== candidate.id));
      
      Swal.fire({
        title: 'Deleted!',
        text: 'Candidate has been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Delete error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to delete candidate',
        icon: 'error'
      });
    }
  };

  // Move row up function
  const moveRowUp = (index) => {
    if (index === 0) return;
    
    const newData = [...data];
    const currentItem = newData[index];
    const previousItem = newData[index - 1];
    
    newData[index - 1] = currentItem;
    newData[index] = previousItem;
    
    setData(newData);
  };

  // Move row down function
  const moveRowDown = (index) => {
    if (index === data.length - 1) return;
    
    const newData = [...data];
    const currentItem = newData[index];
    const nextItem = newData[index + 1];
    
    newData[index + 1] = currentItem;
    newData[index] = nextItem;
    
    setData(newData);
  };

  // Drag and drop functions for rows
  const handleRowDragStart = (e, index) => {
    setDraggedRow(index);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('prophecy-row-dragging');
  };

  const handleRowDragEnd = (e) => {
    e.currentTarget.classList.remove('prophecy-row-dragging');
    setDraggedRow(null);
    setDragOverRow(null);
  };

  const handleRowDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRow(index);
  };

  const handleRowDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedRow === null || draggedRow === dropIndex) return;
    
    const newData = [...data];
    const draggedItem = newData[draggedRow];
    
    newData.splice(draggedRow, 1);
    const finalDropIndex = draggedRow < dropIndex ? dropIndex - 1 : dropIndex;
    newData.splice(finalDropIndex, 0, draggedItem);
    
    setData(newData);
    setDraggedRow(null);
    setDragOverRow(null);
  };

  const addColumn = () => {
    if (newColumnName.trim()) {
      const newColumns = [...columns, newColumnName.trim()];
      setColumns(newColumns);
      
      const newData = data.map(row => ({
        ...row,
        [newColumnName.trim()]: ''
      }));
      setData(newData);
      setNewColumnName('');
    }
  };

  const deleteColumn = (columnName) => {
    if (columnName === 'S. No' || columnName === 'Priority') return;
    
    const newColumns = columns.filter(col => col !== columnName);
    setColumns(newColumns);
    
    const newData = data.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });
    setData(newData);
    setShowColumnMenu(null);
  };

  const renameColumn = (oldName, newName) => {
    if (oldName === 'S. No' || oldName === 'Priority' || !newName.trim()) return;
    
    const newColumns = columns.map(col => col === oldName ? newName.trim() : col);
    setColumns(newColumns);
    
    const newData = data.map(row => {
      const newRow = { ...row };
      newRow[newName.trim()] = newRow[oldName];
      delete newRow[oldName];
      return newRow;
    });
    setData(newData);
    setEditingColumn(null);
  };

  const handleColumnDragStart = (e, column) => {
    if (column === 'S. No' || column === 'Priority') return;
    setDraggedColumn(column);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleColumnDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleColumnDrop = (e, targetColumn) => {
    e.preventDefault();
    if (draggedColumn && draggedColumn !== targetColumn && targetColumn !== 'S. No' && targetColumn !== 'Priority') {
      const dragIndex = columns.indexOf(draggedColumn);
      const targetIndex = columns.indexOf(targetColumn);
      
      const newColumns = [...columns];
      newColumns.splice(dragIndex, 1);
      newColumns.splice(targetIndex, 0, draggedColumn);
      
      setColumns(newColumns);
    }
    setDraggedColumn(null);
  };

  const exportToCSV = () => {
    const csvContent = generateCSVContent();
    downloadCSV(csvContent, 'hotlist.csv');
  };

  const generateCSVContent = () => {
    return [
      columns.join(','),
      ...filteredData.map((row, index) => 
        columns.map(col => 
          col === 'S. No' ? index + 1 : `"${(row[col] || '').toString().replace(/"/g, '""')}"`
        ).join(',')
      )
    ].join('\n');
  };

  const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // FIXED: Enhanced parsing function that handles both CSV and Excel files
  const parseFile = (file, content) => {
    try {
      let parsedData;
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files
        console.log('Processing Excel file...');
        const workbook = XLSX.read(content, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with header row
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });
        
        if (jsonData.length <= 1) {
          throw new Error('Excel file appears to be empty or contains only headers');
        }
        
        const headers = jsonData[0].map(h => String(h || '').trim()).filter(h => h);
        const dataRows = jsonData.slice(1).filter(row => 
          row && row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        );
        
        parsedData = { headers, dataRows };
        
      } else if (fileName.endsWith('.csv')) {
        // Handle CSV files
        console.log('Processing CSV file...');
        const csvText = typeof content === 'string' ? content : new TextDecoder('utf-8').decode(content);
        
        const lines = csvText
          .replace(/\r\n/g, '\n')
          .replace(/\r/g, '\n')
          .split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);

        if (lines.length <= 1) {
          throw new Error('CSV file appears to be empty or contains only headers');
        }

        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          let i = 0;

          while (i < line.length) {
            const char = line[i];
            
            if (char === '"') {
              if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                current += '"';
                i += 2;
              } else {
                inQuotes = !inQuotes;
                i++;
              }
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
              i++;
            } else {
              current += char;
              i++;
            }
          }
          
          result.push(current.trim());
          
          return result.map(field => {
            if (field.startsWith('"') && field.endsWith('"')) {
              return field.slice(1, -1);
            }
            return field;
          });
        };

        const headers = parseCSVLine(lines[0]);
        const dataRows = lines.slice(1).map(line => parseCSVLine(line));
        
        parsedData = { headers, dataRows };
      } else {
        throw new Error('Unsupported file format. Please use CSV or Excel files.');
      }

      // Common processing for both file types
      const findHeaderIndex = (possibleNames) => {
        for (const name of possibleNames) {
          let index = parsedData.headers.findIndex(h => 
            h.toLowerCase() === name.toLowerCase()
          );
          
          if (index !== -1) return index;
          
          index = parsedData.headers.findIndex(h => 
            h.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(h.toLowerCase())
          );
          
          if (index !== -1) return index;
        }
        return -1;
      };

      const headerMapping = {
        fullName: findHeaderIndex(['full name', 'fullname', 'name', 'candidate name', 'full_name']),
        role: findHeaderIndex(['role', 'position', 'title', 'job title', 'designation']),
        exp: findHeaderIndex(['exp', 'experience', 'years', 'years of experience', 'work experience']),
        state: findHeaderIndex(['state', 'location', 'current location', 'residence']),
        relocation: findHeaderIndex(['relocation', 'relocate', 'willing to relocate', 'can relocate']),
        visa: findHeaderIndex(['visa', 'visa status', 'work authorization', 'visa type']),
        priority: findHeaderIndex(['priority', 'priority level', 'importance'])
      };

      if (headerMapping.fullName === -1) {
        headerMapping.fullName = parsedData.headers.findIndex(h => 
          /name/i.test(h) || /candidate/i.test(h)
        );
        
        if (headerMapping.fullName === -1) {
          headerMapping.fullName = 0;
        }
      }

      const candidates = [];

      // Process all data rows in the correct order
      for (let rowIndex = 0; rowIndex < parsedData.dataRows.length; rowIndex++) {
        const row = parsedData.dataRows[rowIndex];
        
        if (!row || row.length === 0) continue;

        try {
          const getFieldValue = (fieldIndex) => {
            if (fieldIndex === -1 || fieldIndex >= row.length) {
              return '';
            }
            const value = row[fieldIndex];
            return (value && String(value).trim() !== '') ? String(value).trim() : '';
          };

          const candidateData = {
            fullName: getFieldValue(headerMapping.fullName),
            role: getFieldValue(headerMapping.role),
            exp: getFieldValue(headerMapping.exp),
            state: getFieldValue(headerMapping.state),
            relocation: getFieldValue(headerMapping.relocation),
            visa: getFieldValue(headerMapping.visa),
            priority: getFieldValue(headerMapping.priority) || 'Medium'
          };

          if (!candidateData.fullName || candidateData.fullName.length < 2) {
            continue;
          }

          candidates.push(candidateData);

        } catch (rowError) {
          console.error(`Error parsing row ${rowIndex + 1}:`, rowError);
        }
      }

      if (candidates.length === 0) {
        throw new Error('No valid candidates found. Please check that your file has a name/fullname column and contains valid data.');
      }

      console.log(`Parsed ${candidates.length} candidates from ${fileName}`);
      return { candidates };

    } catch (error) {
      console.error('File parsing error:', error);
      throw new Error(`File parsing failed: ${error.message}`);
    }
  };

  // FIXED: Enhanced import handler for both CSV and Excel
  // FIXED: Enhanced import handler with better error handling and validation
  const handleImportFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const supportedFormats = ['.csv', '.xlsx', '.xls'];
    const isSupported = supportedFormats.some(format => fileName.endsWith(format));

    if (!isSupported) {
      Swal.fire({
        title: 'Invalid File Format',
        text: 'Please select a CSV or Excel file (.csv, .xlsx, .xls)',
        icon: 'error'
      });
      event.target.value = '';
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        title: 'File Too Large',
        text: 'File size should be less than 10MB',
        icon: 'error'
      });
      event.target.value = '';
      return;
    }

    Swal.fire({
      title: 'Processing...',
      text: `Reading ${fileName.endsWith('.csv') ? 'CSV' : 'Excel'} file`,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const content = fileName.endsWith('.csv') ? e.target.result : new Uint8Array(e.target.result);
        const { candidates } = parseFile(file, content);
        
        if (!candidates || candidates.length === 0) {
          Swal.fire({
            title: 'No Data Found',
            text: 'No valid candidates found in the file',
            icon: 'warning'
          });
          return;
        }

        Swal.update({
          title: 'Importing...',
          text: `Importing ${candidates.length} candidates to database`
        });

        const token = localStorage.getItem('token');
        if (!token) {
          Swal.fire({
            title: 'Authentication Error',
            text: 'Please login again',
            icon: 'error'
          });
          return;
        }

        // FIXED: Sanitize and validate each candidate before sending
        const sanitizedCandidates = candidates.map(candidate => ({
          fullName: (candidate.fullName || '').trim() || 'Unknown',
          role: (candidate.role || '').trim() || '',
          exp: (candidate.exp || '').trim() || '',
          state: (candidate.state || '').trim() || '',
          relocation: (candidate.relocation || '').trim() || '',
          visa: (candidate.visa || '').trim() || '',
          priority: (candidate.priority || 'Medium').trim()
        }));

        console.log('Sanitized candidates:', sanitizedCandidates);

        // FIXED: Send in smaller batches if needed (handles large imports better)
        const batchSize = 100;
        let totalSuccess = 0;
        let totalErrors = 0;

        for (let i = 0; i < sanitizedCandidates.length; i += batchSize) {
          const batch = sanitizedCandidates.slice(i, i + batchSize);
          
          try {
            const response = await axios.post(`${BASE_URL}/api/hotlist/bulk`, 
              { candidates: batch },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 60000
              }
            );

            if (response.data && response.data.success) {
              totalSuccess += response.data.count || response.data.successCount || batch.length;
              totalErrors += response.data.errorCount || 0;
              
              console.log(`Batch ${Math.floor(i / batchSize) + 1} imported successfully`);
            } else {
              totalErrors += batch.length;
              console.warn(`Batch ${Math.floor(i / batchSize) + 1} failed:`, response.data);
            }
          } catch (batchError) {
            totalErrors += batch.length;
            console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, batchError);
            
            // Log detailed error info for debugging
            if (batchError.response?.data) {
              console.error('Backend error details:', batchError.response.data);
            }
          }
        }

        // Refresh data after all batches
        await fetchHotlistData();
        
        let message = `Successfully imported ${totalSuccess} candidates`;
        if (totalErrors > 0) {
          message += `\n${totalErrors} candidates had errors and were skipped`;
        }

        if (totalSuccess > 0) {
          Swal.fire({
            title: 'Import Successful!',
            text: message,
            icon: 'success'
          });
        } else {
          Swal.fire({
            title: 'Import Failed',
            text: 'No candidates could be imported. Please check your data format.',
            icon: 'error'
          });
        }

      } catch (error) {
        console.error('Import error:', error);
        
        let errorMessage = `Failed to import ${fileName.endsWith('.csv') ? 'CSV' : 'Excel'} file`;
        
        if (error.response?.status === 400) {
          errorMessage = `Bad Request (400): ${error.response.data?.message || 'Check that all required fields are present and properly formatted'}`;
        } else if (error.response?.status === 413) {
          errorMessage = 'Payload too large. Try importing fewer candidates at once.';
        } else if (error.response?.status === 500) {
          errorMessage = `Server error (500): ${error.response.data?.message || 'Please contact support'}`;
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        console.error('Detailed error:', error.response?.data || error);

        Swal.fire({
          title: 'Import Failed',
          text: errorMessage,
          icon: 'error'
        });
      } finally {
        event.target.value = '';
      }
    };

    reader.onerror = () => {
      Swal.fire({
        title: 'File Error',
        text: 'Could not read the file',
        icon: 'error'
      });
      event.target.value = '';
    };

    // Read file based on type
    if (fileName.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const duplicateRow = async (index) => {
    const rowToDuplicate = filteredData[index];
    if (!rowToDuplicate) return;

    const token = localStorage.getItem('token');
    
    try {
      const duplicateData = {
        fullName: `${rowToDuplicate['Full Name']} (Copy)`,
        role: rowToDuplicate['Role'],
        exp: rowToDuplicate['Exp'],
        state: rowToDuplicate['State'],
        relocation: rowToDuplicate['Relocation'],
        visa: rowToDuplicate['Visa'],
        priority: rowToDuplicate['Priority']
      };

      const response = await axios.post(`${BASE_URL}/api/hotlist`, duplicateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        await fetchHotlistData();
        
        Swal.fire({
          title: 'Success',
          text: 'Candidate duplicated successfully',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Duplicate error:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to duplicate candidate',
        icon: 'error'
      });
    }
  };

const handleSendHotlist = async () => {
  if (!vendorEmail.trim()) {
    Swal.fire({
      title: 'Missing Email',
      text: 'Please enter a vendor email address',
      icon: 'warning'
    });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(vendorEmail.trim())) {
    Swal.fire({
      title: 'Invalid Email',
      text: 'Please enter a valid email address',
      icon: 'warning'
    });
    return;
  }

  try {
    const csvContent = generateCSVContent();
    const subject = encodeURIComponent(emailSubject);
    const body = encodeURIComponent(emailBody + '\n\nNote: Please find the hotlist CSV file downloaded to your computer.');
    const email = encodeURIComponent(vendorEmail.trim());
    
    let mailtoLink = '';
    
    switch(emailService) {
      case 'gmail':
        // Use intent URLs for mobile or mailto for desktop
        if (/Android/i.test(navigator.userAgent)) {
          mailtoLink = `intent://send?to=${email}&subject=${subject}&body=${body}#Intent;package=com.google.android.gm;scheme=mailto;end`;
        } else {
          mailtoLink = `googlegmail://co?to=${email}&subject=${subject}&body=${body}`;
        }
        break;
      case 'outlook':
        // Use ms-outlook protocol for Windows/Office or intent for Android
        if (/Android/i.test(navigator.userAgent)) {
          mailtoLink = `intent://send?to=${email}&subject=${subject}&body=${body}#Intent;package=com.microsoft.office.outlook;scheme=mailto;end`;
        } else {
          mailtoLink = `ms-outlook://compose?to=${email}&subject=${subject}&body=${body}`;
        }
        break;
      case 'zoho':
        // Zoho doesn't have a universal protocol, fallback to mailto
        mailtoLink = `mailto:${vendorEmail}?subject=${subject}&body=${body}`;
        break;
      default:
        // System default will show app picker on most devices
        mailtoLink = `mailto:${vendorEmail}?subject=${subject}&body=${body}`;
    }

    // Download CSV first
    downloadCSV(csvContent, 'hotlist_candidates.csv');

    setTimeout(() => {
      // Try to open the specific app first, fallback to mailto if it fails
      const tryOpenApp = () => {
        if (emailService !== 'default' && emailService !== 'zoho') {
          // Create a hidden iframe to test if the protocol works
          const iframe = document.createElement('iframe');
          iframe.style.display = 'none';
          iframe.src = mailtoLink;
          document.body.appendChild(iframe);
          
          // Remove iframe after a short delay
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
          
          // Fallback to mailto after a short delay if the app didn't open
          setTimeout(() => {
            window.location.href = `mailto:${vendorEmail}?subject=${subject}&body=${body}`;
          }, 2000);
        } else {
          // Direct mailto for system default and zoho
          window.location.href = mailtoLink;
        }
      };

      tryOpenApp();

      Swal.fire({
        title: 'Email Prepared!',
        text: 'CSV file downloaded and email app opening. Please attach the downloaded file manually.',
        icon: 'success'
      });

      setVendorEmail('');
      setShowSendHotlist(false);
    }, 500);

  } catch (error) {
    console.error('Send hotlist error:', error);
    Swal.fire({
      title: 'Error',
      text: 'Failed to prepare email. Please try again.',
      icon: 'error'
    });
  }
};

  if (loading) {
    return (
      <div className="prophecy-hotlist-wrapper">
        <div className="prophecy-loading-container">
          <div>Loading...</div>
          <p>Please wait while we fetch the hotlist data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prophecy-hotlist-wrapper">
      <div className="prophecy-header-section">
        <div className="prophecy-title-block">
          <h1><Star className="icon" /> Hot List Management</h1>
          <p>Manage your bench sales candidates with priority levels</p>
        </div>
        
        <div className="prophecy-action-controls">
          <div className="prophecy-search-container">
            <Search className="prophecy-search-icon" />
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
          />
          
          <button className="prophecy-btn prophecy-btn-secondary" onClick={triggerFileInput}>
            <FileSpreadsheet size={16} />
            Import CSV/Excel
          </button>
          
          <button className="prophecy-btn prophecy-btn-secondary" onClick={exportToCSV}>
            <Download size={16} />
            Export CSV
          </button>
          
          <button 
            className="prophecy-btn prophecy-btn-primary" 
            onClick={() => setShowSendHotlist(!showSendHotlist)}
          >
            <Send size={16} />
            Send Hotlist
          </button>
          
          {/* Bulk Delete Button */}
          {selectedRows.length > 0 && (
            <button 
              className="prophecy-btn prophecy-btn-danger" 
              onClick={handleBulkDelete}
              title={`Delete ${selectedRows.length} selected candidate(s)`}
            >
              <Trash2 size={16} />
              Delete({selectedRows.length})
            </button>
          )}
          
          <button className="prophecy-btn prophecy-btn-primary" onClick={addRow}>
            <Plus size={16} />
            Add Row
          </button>
        </div>
      </div>

      {showSendHotlist && (
        <div className="prophecy-send-hotlist-panel">
          <div className="prophecy-email-form">
            <div className="prophecy-email-service-selector">
              <label>Email Service:</label><br />
              <select 
                value={emailService} 
                onChange={(e) => setEmailService(e.target.value)}
              >
                <option value="gmail">Gmail</option>
                <option value="outlook">Outlook</option>
                <option value="zoho">Zoho Mail</option>
                <option value="default">System Default</option>
              </select>
            </div>
            
            <div className="prophecy-email-input-group">
              <label>To:</label>
              <input
                type="email"
                placeholder="Enter vendor email..."
                value={vendorEmail}
                onChange={(e) => setVendorEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="prophecy-email-input-group">
              <label>Subject:</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div className="prophecy-email-input-group">
              <label>Message:</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows="3"
              />
            </div>
            
            <div className="prophecy-email-actions">
              <button 
                className="prophecy-btn prophecy-btn-primary" 
                onClick={handleSendHotlist}
              >
                Send & Download CSV
              </button>
              
              <button 
                className="prophecy-btn prophecy-btn-secondary" 
                onClick={() => setShowSendHotlist(false)}
              >
                Cancel
              </button>
            </div>
            
            <div className="prophecy-email-note">
              <p><strong>Note:</strong> The CSV file will be downloaded and your email client will open. Please attach the downloaded file manually to your email.</p>
            </div>
          </div>
        </div>
      )}

      <div className="prophecy-add-column-area">
        <input
          type="text"
          placeholder="New column name..."
          value={newColumnName}
          onChange={(e) => setNewColumnName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addColumn()}
          className="prophecy-column-input-field"
        />
        <button className="prophecy-btn prophecy-btn-outline" onClick={addColumn}>
          <Plus size={16} />
          Add Column
        </button>
      </div>

      <div className="prophecy-table-wrapper">
        <table className="prophecy-data-table">
          <thead>
            <tr>
              {/* Select All Checkbox Column */}
              <th className="prophecy-select-column">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  title="Select all rows"
                />
              </th>
              
              {columns.map((column, index) => (
                <th
                  key={column}
                  draggable={column !== 'S. No' && column !== 'Priority'}
                  onDragStart={(e) => handleColumnDragStart(e, column)}
                  onDragOver={handleColumnDragOver}
                  onDrop={(e) => handleColumnDrop(e, column)}
                  className={`prophecy-column-head ${draggedColumn === column ? 'dragging' : ''}`}
                >
                  <div className="prophecy-column-content">
                    {editingColumn === column ? (
                      <input
                        type="text"
                        defaultValue={column}
                        onBlur={(e) => renameColumn(column, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            renameColumn(column, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditingColumn(null);
                          }
                        }}
                        autoFocus
                        className="prophecy-column-name-field"
                      />
                    ) : (
                      <span>{column}</span>
                    )}
                    
                    {column !== 'S. No' && column !== 'Priority' && (
                      <div className="prophecy-column-controls">
                        <button
                          className="prophecy-column-menu-trigger"
                          onClick={() => setShowColumnMenu(showColumnMenu === column ? null : column)}
                        >
                          <MoreHorizontal size={14} />
                        </button>
                        
                        {showColumnMenu === column && (
                          <div className="prophecy-column-dropdown">
                            <button onClick={() => setEditingColumn(column)}>
                              <Edit3 size={14} />
                              Rename
                            </button>
                            <button onClick={() => deleteColumn(column)}>
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
              <th className="prophecy-actions-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, rowIndex) => {
              const actualDataIndex = data.findIndex(item => item.id === row.id);
              
              return (
                <tr
                  key={row.id}
                  draggable
                  onDragStart={(e) => handleRowDragStart(e, actualDataIndex)}
                  onDragEnd={handleRowDragEnd}
                  onDragOver={(e) => handleRowDragOver(e, actualDataIndex)}
                  onDrop={(e) => handleRowDrop(e, actualDataIndex)}
                  className={`prophecy-data-row ${
                    dragOverRow === actualDataIndex ? 'prophecy-drag-over' : ''
                  } ${isRowSelected(row.id) ? 'prophecy-row-selected' : ''}`}
                >
                  {/* Row Selection Checkbox */}
                  <td className="prophecy-select-cell">
                    <input
                      type="checkbox"
                      checked={isRowSelected(row.id)}
                      onChange={() => handleRowSelect(row.id)}
                      title="Select this row"
                    />
                  </td>
                  
                  {columns.map((column) => (
                    <td
                      key={`${row.id}-${column}`}
                      className={`prophecy-table-cell ${editingCell.row === rowIndex && editingCell.col === column ? 'editing' : ''}`}
                      onClick={() => handleCellClick(rowIndex, column)}
                    >
                      {column === 'S. No' ? (
                        <div className="prophecy-row-number-container">
                          <GripVertical className="prophecy-drag-handle" />
                          <span className="prophecy-row-number">{rowIndex + 1}</span>
                        </div>
                      ) : column === 'Priority' ? (
                        editingCell.row === rowIndex && editingCell.col === column ? (
                          <select
                            ref={inputRef}
                            defaultValue={row[column] || 'Medium'}
                            onBlur={(e) => {
                              handleCellChange(e.target.value, rowIndex, column);
                              handleCellBlur();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleCellChange(e.target.value, rowIndex, column);
                              }
                              handleKeyDown(e, rowIndex, column);
                            }}
                            className="prophecy-priority-selector"
                          >
                            <option value="High">High</option>
                            <option value="Medium">Medium</option>
                            <option value="Low">Low</option>
                          </select>
                        ) : (
                          <div className="prophecy-priority-display">
                            <Flag className={`prophecy-priority-${(row[column] || 'medium').toLowerCase()}-icon`} />
                            <span className={`prophecy-priority-${(row[column] || 'medium').toLowerCase()}-badge`}>
                              {row[column] || 'Medium'}
                            </span>
                          </div>
                        )
                      ) : editingCell.row === rowIndex && editingCell.col === column ? (
                        <input
                          ref={inputRef}
                          type="text"
                          defaultValue={row[column] || ''}
                          onBlur={(e) => {
                            handleCellChange(e.target.value, rowIndex, column);
                            handleCellBlur();
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCellChange(e.target.value, rowIndex, column);
                            }
                            handleKeyDown(e, rowIndex, column);
                          }}
                          className="prophecy-cell-editor"
                        />
                      ) : (
                        <span className="prophecy-cell-display">
                          {row[column] || ''}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="prophecy-actions-cell">
                    <div className="prophecy-row-controls">
                      <button
                        className="prophecy-action-button prophecy-duplicate-btn"
                        onClick={() => duplicateRow(rowIndex)}
                        title="Duplicate row"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        className="prophecy-action-button prophecy-delete-btn"
                        onClick={() => deleteRow(rowIndex)}
                        title="Delete row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="prophecy-footer-section">
        <div className="prophecy-footer-stats">
          <span>Total Records: {filteredData.length}</span>
          {selectedRows.length > 0 && (
            <span className="prophecy-selected-count">
              Selected: {selectedRows.length}
            </span>
          )}
          {searchTerm && (
            <span>Filtered from {data.length} total records</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProphecyHotList;