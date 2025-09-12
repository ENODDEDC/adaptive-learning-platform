'use client';

import React, { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModalOpen] = useState(false);
  const [isCreateClusterModalOpen, setIsCreateClusterModalOpen] = useState(false);
  const [isJoinClusterModalOpen, setIsJoinClusterModalOpen] = useState(false);
  const [shouldRefreshCourses, setShouldRefreshCourses] = useState(false);

  const openCreateCourseModal = () => setIsCreateCourseModalOpen(true);
  const closeCreateCourseModal = () => setIsCreateCourseModalOpen(false);

  const openJoinCourseModal = () => setIsJoinCourseModalOpen(true);
  const closeJoinCourseModal = () => setIsJoinCourseModalOpen(false);

  const openCreateClusterModal = () => setIsCreateClusterModalOpen(true);
  const closeCreateClusterModal = () => setIsCreateClusterModalOpen(false);

  const openJoinClusterModal = () => setIsJoinClusterModalOpen(true);
  const closeJoinClusterModal = () => setIsJoinClusterModalOpen(false);

  const refreshCourses = () => setShouldRefreshCourses(prev => !prev);

  return (
    <LayoutContext.Provider
      value={{
        isCreateCourseModalOpen,
        openCreateCourseModal,
        closeCreateCourseModal,
        isJoinCourseModalOpen,
        openJoinCourseModal,
        closeJoinCourseModal,
        isCreateClusterModalOpen,
        openCreateClusterModal,
        closeCreateClusterModal,
        isJoinClusterModalOpen,
        openJoinClusterModal,
        closeJoinClusterModal,
        shouldRefreshCourses,
        refreshCourses,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};