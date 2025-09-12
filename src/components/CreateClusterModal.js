import React, { useState, useEffect } from 'react';
import { useLayout } from '../context/LayoutContext';

const CreateClusterModal = ({ isOpen, onClose, onCreateCluster, userName }) => {
  const { refreshCourses } = useLayout();
  const [currentStep, setCurrentStep] = useState(1);
  const [name, setName] = useState('');
  const [section, setSection] = useState('');
  const [coverColor, setCoverColor] = useState('#60a5fa');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [sectionSuggestions, setSectionSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    section: '',
    coverColor: '#60a5fa',
    courseIds: [],
    description: '',
    isPublic: false,
    allowJoin: true
  });

  const colorOptions = [
    '#60a5fa', '#4ade80', '#facc15', '#fb7185', '#a78bfa', '#f472b6', '#6ee7b7', '#e879f9',
  ];

  const clusterTemplates = [
    {
      id: 'academic',
      name: 'Academic Semester',
      description: 'Standard academic cluster for semester-based courses',
      icon: '🎓',
      color: '#3b82f6',
      defaultSettings: {
        isPublic: false,
        allowJoin: true,
        coverColor: '#3b82f6'
      }
    },
    {
      id: 'workshop',
      name: 'Workshop Series',
      description: 'Short-term workshop or training cluster',
      icon: '🔧',
      color: '#f59e0b',
      defaultSettings: {
        isPublic: true,
        allowJoin: true,
        coverColor: '#f59e0b'
      }
    },
    {
      id: 'research',
      name: 'Research Group',
      description: 'Research-focused cluster for academic projects',
      icon: '🔬',
      color: '#10b981',
      defaultSettings: {
        isPublic: false,
        allowJoin: false,
        coverColor: '#10b981'
      }
    },
    {
      id: 'study',
      name: 'Study Group',
      description: 'Collaborative study and review sessions',
      icon: '📚',
      color: '#8b5cf6',
      defaultSettings: {
        isPublic: true,
        allowJoin: true,
        coverColor: '#8b5cf6'
      }
    },
    {
      id: 'custom',
      name: 'Custom Cluster',
      description: 'Create a cluster from scratch',
      icon: '⚙️',
      color: '#6b7280',
      defaultSettings: {
        isPublic: false,
        allowJoin: true,
        coverColor: '#60a5fa'
      }
    }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
      fetchSectionSuggestions();
      setCurrentStep(1);
      setSelectedTemplate(null);
      setFormData({
        name: '',
        section: '',
        coverColor: '#60a5fa',
        courseIds: [],
        description: '',
        isPublic: false,
        allowJoin: true
      });
    }
  }, [isOpen]);

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData(prev => ({
      ...prev,
      ...template.defaultSettings,
      coverColor: template.color
    }));
    setCoverColor(template.color);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      console.log('Fetched courses:', data.courses);
      setAvailableCourses(data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSectionSuggestions = async () => {
    try {
      const response = await fetch('/api/clusters/suggestions');
      const data = await response.json();
      setSectionSuggestions(data.suggestions || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const clusterData = {
      name: formData.name,
      section: formData.section,
      coverColor: formData.coverColor,
      courseIds: formData.courseIds,
      description: formData.description,
      isPublic: formData.isPublic,
      allowJoin: formData.allowJoin,
    };

    console.log('Sending cluster data:', clusterData);

    try {
      await onCreateCluster(clusterData);
      onClose();
      refreshCourses();
      resetForm();
    } catch (error) {
      console.error('Error creating cluster:', error);
      alert('Failed to create cluster. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSection('');
    setCoverColor('#60a5fa');
    setSelectedCourses([]);
    setCurrentStep(1);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      section: '',
      coverColor: '#60a5fa',
      courseIds: [],
      description: '',
      isPublic: false,
      allowJoin: true
    });
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Choose a Template</h3>
              <p className="text-gray-600">Select a template to get started quickly, or create a custom cluster.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusterTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{template.icon}</span>
                    <h4 className="font-semibold text-gray-900">{template.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: template.color }}
                    ></div>
                    <span className="text-xs text-gray-500">
                      {template.defaultSettings.isPublic ? 'Public' : 'Private'} • 
                      {template.defaultSettings.allowJoin ? ' Open Join' : ' Invite Only'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Basic Information</h3>
              <p className="text-gray-600">Provide the essential details for your cluster.</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cluster Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter cluster name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section
                </label>
                <input
                  type="text"
                  value={formData.section}
                  onChange={(e) => updateFormData('section', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., CS101-A, Fall 2024"
                  list="section-suggestions"
                />
                <datalist id="section-suggestions">
                  {sectionSuggestions.map((suggestion, index) => (
                    <option key={index} value={suggestion.section} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe the purpose of this cluster..."
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Customize Appearance</h3>
              <p className="text-gray-600">Choose colors and settings for your cluster.</p>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Cover Color
                </label>
                <div className="flex flex-wrap gap-3">
                  {colorOptions.map((color) => (
                    <div
                      key={color}
                      className={`w-10 h-10 rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                        formData.coverColor === color ? 'border-purple-500 scale-110' : 'border-gray-300 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateFormData('coverColor', color)}
                    ></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Public Cluster</h4>
                    <p className="text-sm text-gray-600">Allow others to discover and join this cluster</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => updateFormData('isPublic', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Allow Join Requests</h4>
                    <p className="text-sm text-gray-600">Let others request to join this cluster</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.allowJoin}
                      onChange={(e) => updateFormData('allowJoin', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select Courses</h3>
              <p className="text-gray-600">Choose which courses to include in this cluster (optional).</p>
            </div>
            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {availableCourses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No courses available</p>
                  <p className="text-sm text-gray-400">Create some courses first to add them to clusters</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableCourses.map((course) => (
                    <label key={course._id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.courseIds.includes(course._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData('courseIds', [...formData.courseIds, course._id]);
                          } else {
                            updateFormData('courseIds', formData.courseIds.filter(id => id !== course._id));
                          }
                        }}
                        className="mr-3 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{course.subject}</div>
                        {course.section && (
                          <div className="text-sm text-gray-500">{course.section}</div>
                        )}
                      </div>
                      <div
                        className="w-4 h-4 rounded-full ml-2"
                        style={{ backgroundColor: course.coverColor || '#60a5fa' }}
                      ></div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="text-sm text-gray-600">
              {formData.courseIds.length} course{formData.courseIds.length !== 1 ? 's' : ''} selected
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600 bg-opacity-50">
      <div className="w-full max-w-4xl mx-4 bg-white rounded-xl shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Cluster</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Step {currentStep} of 4</span>
              <span className="text-sm text-gray-500">{Math.round((currentStep / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / 4) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 overflow-y-auto max-h-[60vh]">
          {renderStepContent()}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              
              {currentStep === 4 ? (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.name}
                  className="px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Cluster'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={currentStep === 1 && !selectedTemplate}
                  className="px-6 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClusterModal;