'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

const CourseFilterSort = ({
  courses,
  onFilteredCoursesChange,
  onSortChange,
  initialFilters = {},
  initialSort = 'name-asc'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState(initialFilters || {
    instructor: [],
    code: [],
    progress: [],
    enrollment: [],
    difficulty: []
  });
  const [sortBy, setSortBy] = useState(initialSort);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filteredCount, setFilteredCount] = useState(courses.length);
  const [isFiltering, setIsFiltering] = useState(false);

  // Filter options
  const filterOptions = {
    progress: [
      { value: '0-25', label: '0-25% Complete', color: 'bg-red-100 text-red-800' },
      { value: '26-50', label: '26-50% Complete', color: 'bg-yellow-100 text-yellow-800' },
      { value: '51-75', label: '51-75% Complete', color: 'bg-blue-100 text-blue-800' },
      { value: '76-100', label: '76-100% Complete', color: 'bg-green-100 text-green-800' }
    ],
    enrollment: [
      { value: 'low', label: 'Low Enrollment (<10)', color: 'bg-gray-100 text-gray-800' },
      { value: 'medium', label: 'Medium (10-30)', color: 'bg-blue-100 text-blue-800' },
      { value: 'high', label: 'High (30+)', color: 'bg-purple-100 text-purple-800' }
    ],
    difficulty: [
      { value: 'beginner', label: 'Beginner', color: 'bg-green-100 text-green-800' },
      { value: 'intermediate', label: 'Intermediate', color: 'bg-yellow-100 text-yellow-800' },
      { value: 'advanced', label: 'Advanced', color: 'bg-red-100 text-red-800' }
    ]
  };

  // Get unique instructors for filter
  const instructors = [...new Set(courses.map(course => course.instructor).filter(Boolean))];
  const courseCodes = [...new Set(courses.map(course => course.code).filter(Boolean))];

  // Apply filters and search
  const applyFiltersAndSearch = useCallback(() => {
    setIsFiltering(true);

    let filtered = [...courses];

    // Apply search
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchLower) ||
        course.instructor?.toLowerCase().includes(searchLower) ||
        course.code?.toLowerCase().includes(searchLower) ||
        course.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply active filters
    Object.entries(activeFilters).forEach(([filterType, filterValues]) => {
      if (Array.isArray(filterValues) && filterValues && filterValues.length > 0) {
        filtered = filtered.filter(course => {
          switch (filterType) {
            case 'instructor':
              return filterValues.includes(course.instructor);
            case 'code':
              return filterValues.includes(course.code);
            case 'progress':
              const progress = course.progress || 0;
              return filterValues.some(range => {
                switch (range) {
                  case '0-25': return progress >= 0 && progress <= 25;
                  case '26-50': return progress >= 26 && progress <= 50;
                  case '51-75': return progress >= 51 && progress <= 75;
                  case '76-100': return progress >= 76 && progress <= 100;
                  default: return false;
                }
              });
            case 'enrollment':
              const enrollment = 24; // This would come from course data
              return filterValues.some(level => {
                switch (level) {
                  case 'low': return enrollment < 10;
                  case 'medium': return enrollment >= 10 && enrollment <= 30;
                  case 'high': return enrollment > 30;
                  default: return false;
                }
              });
            case 'difficulty':
              // This would need to be added to course data
              return filterValues.includes(course.difficulty || 'beginner');
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      const [field, direction] = sortBy.split('-');

      let comparison = 0;

      switch (field) {
        case 'name':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'instructor':
          comparison = (a.instructor || '').localeCompare(b.instructor || '');
          break;
        case 'code':
          comparison = (a.code || '').localeCompare(b.code || '');
          break;
        case 'enrollment':
          comparison = (24) - (24); // This would use actual enrollment data
          break;
        case 'accessed':
          comparison = new Date(a.lastAccessed || 0) - new Date(b.lastAccessed || 0);
          break;
        default:
          comparison = 0;
      }

      return direction === 'desc' ? -comparison : comparison;
    });

    setFilteredCount(filtered.length);
    onFilteredCoursesChange(filtered);

    // Simulate filtering delay for visual feedback
    setTimeout(() => setIsFiltering(false), 300);
  }, [courses, searchTerm, activeFilters, sortBy, onFilteredCoursesChange]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFiltersAndSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [applyFiltersAndSearch]);

  const handleFilterToggle = (filterType, value) => {
    setActiveFilters(prev => {
      const currentValues = prev[filterType] || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [filterType]: newValues
      };
    });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    onSortChange(newSort);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setSearchTerm('');
  };

  const removeFilter = (filterType, value) => {
    setActiveFilters(prev => {
      const currentValues = prev[filterType] || [];
      return {
        ...prev,
        [filterType]: currentValues.filter(v => v !== value)
      };
    });
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) =>
      count + (Array.isArray(values) && values ? values.length : 0), 0
    );
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search courses, instructors, or codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          />
          {isFiltering && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-200 ${
            isFilterOpen
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">{filteredCount}</span>
          <span>of</span>
          <span className="font-medium">{courses.length}</span>
          <span>courses</span>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">Active filters:</span>
          {Object.entries(activeFilters).map(([filterType, values]) =>
            Array.isArray(values) && values.length > 0 && values.map(value => {
              const option = filterOptions[filterType]?.find(opt => opt.value === value);
              return (
                <span
                  key={`${filterType}-${value}`}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${option?.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {option?.label || value}
                  <button
                    onClick={() => removeFilter(filterType, value)}
                    className="hover:bg-black/10 rounded-full p-0.5"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              );
            })
          )}
          <button
            onClick={clearAllFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Expanded Filters */}
      {isFilterOpen && (
        <div className="border-t border-gray-200 pt-6 animate-fade-in-down">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Instructor Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Instructor</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {instructors.map(instructor => (
                  <label key={instructor} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(activeFilters.instructor || []).includes(instructor)}
                      onChange={() => handleFilterToggle('instructor', instructor)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{instructor}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Course Code Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Course Code</h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {courseCodes.map(code => (
                  <label key={code} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(activeFilters.code || []).includes(code)}
                      onChange={() => handleFilterToggle('code', code)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{code}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Progress Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Progress</h4>
              <div className="space-y-2">
                {filterOptions.progress.map(option => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(activeFilters.progress || []).includes(option.value)}
                      onChange={() => handleFilterToggle('progress', option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Enrollment Filter */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Enrollment</h4>
              <div className="space-y-2">
                {filterOptions.enrollment.map(option => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={(activeFilters.enrollment || []).includes(option.value)}
                      onChange={() => handleFilterToggle('enrollment', option.value)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sort Options */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200">
        <span className="text-sm font-medium text-gray-700">Sort by:</span>
        {[
          { value: 'name-asc', label: 'Name A-Z', icon: ArrowUpIcon },
          { value: 'name-desc', label: 'Name Z-A', icon: ArrowDownIcon },
          { value: 'instructor-asc', label: 'Instructor A-Z', icon: ArrowUpIcon }
        ].map(option => {
          const Icon = option.icon;
          const isActive = sortBy === option.value;
          return (
            <button
              key={option.value}
              onClick={() => handleSortChange(option.value)}
              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CourseFilterSort;