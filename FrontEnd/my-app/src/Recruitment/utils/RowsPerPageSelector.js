// // RowsPerPageSelector.js
// import React from 'react';
// import Select from 'react-select';

// const options = [
//   { value: 5, label: '5' },
//   { value: 10, label: '10' },
//   { value: 20, label: '20' },
//   { value: 50, label: '50' },
// ];

// const customStyles = {
//   control: (provided, state) => ({
//     ...provided,
//     borderRadius: '6px',
//     borderColor: state.isFocused ? '#087f5b' : '#ccc',
//     boxShadow: state.isFocused ? '0 0 0 1px #087f5b' : 'none',
//     '&:hover': {
//       borderColor: '#087f5b',
//     },
//     fontSize: '12px',
//     minHeight: '36px',
//   }),
//   option: (provided, state) => ({
//     ...provided,
//     backgroundColor: state.isFocused
//       ? '#087f5b'
//       : state.isSelected
//         ? '#065f46'
//         : undefined,
//     color: state.isFocused || state.isSelected ? '#fff' : '#000',
//     cursor: 'pointer',
//     fontSize: '12px',
//   }),
// };

// const RowsPerPageSelector = ({ rowsPerPage, setRowsPerPage }) => {
//   return (
//     <div
//       style={{
//         display: 'flex',
//         alignItems: 'center',
//         gap: '10px',
//         justifyContent: 'flex-end',
//         fontFamily: 'Arial, sans-serif',
//         fontSize: '14px',
//       }}
//     >
//       <label style={{ color: '#333' }}>Rows per page:</label>
//       <div style={{ minWidth: '100px' }}>
//         <Select
//           styles={customStyles}
//           options={options}
//           value={options.find((opt) => opt.value === rowsPerPage)}
//           onChange={(selected) => setRowsPerPage(selected.value)}
//           isSearchable={false}
//         />
//       </div>
//     </div>
//   );
// };

// export default RowsPerPageSelector;
