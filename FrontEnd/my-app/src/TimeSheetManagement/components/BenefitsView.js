import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Users, Heart, Shield, CheckCircle, AlertCircle, X } from 'lucide-react';

const BenefitsEnrollmentModal = React.memo(({ 
  isOpen, 
  onClose, 
  employees,
  benefitType
}) => {
  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const modalScrollPositionRef = useRef(0);

  const filteredEmployees = useMemo(() => {
    if (!employees || !Array.isArray(employees) || !benefitType) return [];

    return employees.filter(emp => {
      let isEnrolled = false;
      
      if (benefitType === 'retirement401k') {
        const value = emp.Retirement401kEnrolled !== undefined 
          ? emp.Retirement401kEnrolled 
          : emp.retirement401kEnrolled;
        isEnrolled = value === true || value === 1 || value === 'true' || value === '1';
      } else if (benefitType === 'medicalInsurance') {
        const value = emp.MedicalInsuranceEnrolled !== undefined 
          ? emp.MedicalInsuranceEnrolled 
          : emp.medicalInsuranceEnrolled;
        isEnrolled = value === true || value === 1 || value === 'true' || value === '1';
      }
      
      return isEnrolled;
    });
  }, [employees, benefitType]);

  const totalEmployees = useMemo(() => Array.isArray(employees) ? employees.length : 0, [employees]);
  const enrollmentPercentage = useMemo(() => 
    totalEmployees === 0 ? 0 : Math.round((filteredEmployees.length / totalEmployees) * 100),
    [totalEmployees, filteredEmployees.length]
  );

  const getBenefitTitle = useCallback(() => {
    switch (benefitType) {
      case 'retirement401k': return '401(k) Retirement Plan';
      case 'medicalInsurance': return 'Medical Insurance';
      default: return 'Benefits';
    }
  }, [benefitType]);

  const getBenefitDescription = useCallback(() => {
    switch (benefitType) {
      case 'retirement401k': return 'Employer-sponsored retirement savings plan with company matching up to 4% of salary.';
      case 'medicalInsurance': return 'Comprehensive health coverage including medical, dental, and vision plans for employees and dependents.';
      default: return '';
    }
  }, [benefitType]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    const handleScroll = () => {
      modalScrollPositionRef.current = contentElement.scrollTop;
    };

    contentElement.addEventListener('scroll', handleScroll);
    return () => {
      contentElement.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      requestAnimationFrame(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = modalScrollPositionRef.current;
        }
      });
    }
  }, [filteredEmployees, isOpen]);

  useEffect(() => {
    if (isOpen) {
      scrollPositionRef.current = window.pageYOffset || document.documentElement.scrollTop;
      const scrollY = `${scrollPositionRef.current}px`;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollPositionRef.current);
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape, true);
    return () => document.removeEventListener('keydown', handleEscape, true);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000
        }}
        onClick={onClose}
      />
      <div
        ref={modalRef}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          zIndex: 1001,
          maxWidth: '700px',
          width: '90%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#f9fafb', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1f2937' }}>{getBenefitTitle()}</h2>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#6b7280' }}>{getBenefitDescription()}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '8px' }}><X size={20} /></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '24px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #e5e7eb' }}>
          <StatBox value={filteredEmployees.length} label="Enrolled" />
          <StatBox value={totalEmployees} label="Total Employees" />
          <StatBox value={`${enrollmentPercentage}%`} label="Enrollment Rate" />
        </div>
        <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>Enrolled Employees ({filteredEmployees.length})</h3>
          {filteredEmployees.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
              {filteredEmployees.map((employee, index) => (
                <EmployeeEnrollmentCard key={employee.id || index} employee={employee} benefitType={benefitType} />
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px' }}>
              <AlertCircle size={32} style={{ color: '#92400e', margin: '0 auto 12px' }} />
              <p style={{ margin: 0, fontSize: '14px', color: '#92400e' }}>No employees enrolled in {getBenefitTitle()} yet.</p>
            </div>
          )}
        </div>
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', backgroundColor: '#f9fafb', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px' }}>
          <button onClick={onClose} className="mts-add-employee-btn" style={{ padding: '10px 20px' }}>Close</button>
        </div>
      </div>
    </>
  );
});

const StatBox = ({ value, label }) => (
  <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #86efac' }}>
    <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981', marginBottom: '4px' }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</div>
  </div>
);

const EmployeeEnrollmentCard = ({ employee, benefitType }) => {
  let percentageText = '';
  if (benefitType === 'retirement401k') {
    const percentage = employee.Retirement401kPercentage || employee.retirement401kPercentage;
    percentageText = percentage ? `${percentage}% contribution` : 'No percentage set';
  } else if (benefitType === 'medicalInsurance') {
    const plan = employee.MedicalInsurancePlan || employee.medicalInsurancePlan;
    percentageText = plan ? `Plan: ${plan}` : 'No plan selected';
  }

  return (
    <div style={{ padding: '12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '14px', fontWeight: '600' }}>
          {employee.name ? employee.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937' }}>{employee.name || 'Unknown'}</div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>{employee.email || 'No email'}</div>
        </div>
        <CheckCircle size={18} style={{ color: '#10b981' }} />
      </div>
      <div style={{ padding: '8px 12px', backgroundColor: '#ffffff', border: '1px solid #86efac', borderRadius: '6px', fontSize: '13px', fontWeight: '600', color: '#10b981', textAlign: 'center' }}>
        {percentageText}
      </div>
    </div>
  );
};

const BenefitsView = React.memo(({ employees, benefitsModalState, setBenefitsModalState }) => {
  const [enrollmentData, setEnrollmentData] = useState({
    totalEmployees: 0,
    retirement401kEnrolled: 0,
    medicalInsuranceEnrolled: 0
  });

  const employeeKey = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return '';
    return employees.map(e => e.id || e.Id).join(',');
  }, [employees]);

  useEffect(() => {
    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      setEnrollmentData({ totalEmployees: 0, retirement401kEnrolled: 0, medicalInsuranceEnrolled: 0 });
      return;
    }

    const retirement401kCount = employees.filter(emp => {
      const value = emp.Retirement401kEnrolled !== undefined ? emp.Retirement401kEnrolled : emp.retirement401kEnrolled;
      return value === true || value === 1 || value === 'true' || value === '1';
    }).length;
    
    const medicalInsuranceCount = employees.filter(emp => {
      const value = emp.MedicalInsuranceEnrolled !== undefined ? emp.MedicalInsuranceEnrolled : emp.medicalInsuranceEnrolled;
      return value === true || value === 1 || value === 'true' || value === '1';
    }).length;

    setEnrollmentData({
      totalEmployees: employees.length,
      retirement401kEnrolled: retirement401kCount,
      medicalInsuranceEnrolled: medicalInsuranceCount
    });
  }, [employeeKey]);

  const handleOpenModal = useCallback((benefitType) => {
    setBenefitsModalState({ isOpen: true, benefitType });
  }, [setBenefitsModalState]);

  return (
    <>
      <div className="mts-employee-table">
        <div className="mts-employee-table-header-container">
          <h2 className="mts-employee-table-title">Benefits Management</h2>
        </div>
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats Summary Header */}
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.05)', 
            border: '1px solid rgba(16, 185, 129, 0.2)', 
            borderRadius: 'var(--mts-radius-lg)', 
            padding: '1.25rem 1.5rem', 
            display: 'inline-flex', 
            alignSelf: 'flex-start',
            alignItems: 'center', 
            gap: '1rem',
            boxShadow: 'var(--mts-shadow-sm)'
          }}>
            <div style={{ 
              backgroundColor: 'var(--mts-white)', 
              width: '40px', 
              height: '40px', 
              borderRadius: 'var(--mts-radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--mts-primary-green)',
              border: '1px solid var(--mts-gray-200)'
            }}>
              <Users size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--mts-gray-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Employees</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--mts-gray-900)', lineHeight: '1.2' }}>{enrollmentData.totalEmployees}</div>
            </div>
          </div>

          {/* Benefit Cards Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
            gap: '1.5rem', 
          }}>
            <BenefitCard 
              icon={Heart} 
              title="401(k) Retirement Plan" 
              enrolled={enrollmentData.retirement401kEnrolled} 
              total={enrollmentData.totalEmployees} 
              color="#10b981" 
              benefitType="retirement401k" 
              onClick={handleOpenModal} 
            />
            <BenefitCard 
              icon={Shield} 
              title="Medical Insurance" 
              enrolled={enrollmentData.medicalInsuranceEnrolled} 
              total={enrollmentData.totalEmployees} 
              color="#10b981" 
              benefitType="medicalInsurance" 
              onClick={handleOpenModal} 
            />
          </div>
        </div>
      </div>
      <BenefitsEnrollmentModal 
        isOpen={benefitsModalState.isOpen} 
        onClose={() => setBenefitsModalState({ isOpen: false, benefitType: null })} 
        employees={employees} 
        benefitType={benefitsModalState.benefitType} 
      />
    </>
  );
});

const BenefitCard = ({ icon: Icon, title, enrolled, total, color, benefitType, onClick }) => {
  const percentage = total === 0 ? 0 : Math.round((enrolled / total) * 100);
  return (
    <div 
      onClick={() => onClick(benefitType)} 
      style={{ 
        backgroundColor: 'var(--mts-white)', 
        border: `1px solid var(--mts-gray-200)`, 
        borderRadius: 'var(--mts-radius-xl)', 
        padding: '1.5rem', 
        cursor: 'pointer', 
        transition: 'all 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--mts-shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--mts-shadow-lg)';
        e.currentTarget.style.borderColor = color;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--mts-shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--mts-gray-200)';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div style={{ 
          width: '48px', 
          height: '48px', 
          borderRadius: 'var(--mts-radius-lg)', 
          backgroundColor: `${color}15`, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Icon size={24} style={{ color }} />
        </div>
        <div style={{ 
          backgroundColor: `${color}15`, 
          color, 
          padding: '0.375rem 0.75rem', 
          borderRadius: '2rem', 
          fontSize: '0.75rem', 
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          border: `1px solid ${color}30`
        }}>
          {percentage}%
        </div>
      </div>

      <h3 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--mts-gray-900)', margin: '0 0 1rem 0' }}>{title}</h3>
      
      {/* Progress Bar Container */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--mts-gray-100)', borderRadius: '1rem', overflow: 'hidden', marginBottom: '0.75rem' }}>
          <div style={{ height: '100%', width: `${percentage}%`, backgroundColor: color, borderRadius: '1rem', transition: 'width 1s ease-out' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--mts-gray-500)', fontWeight: '500' }}>{enrolled} of {total} enrolled</span>
          <div style={{ fontSize: '0.75rem', color, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
            View details <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );
};

BenefitsView.displayName = 'BenefitsView';

export default BenefitsView;
