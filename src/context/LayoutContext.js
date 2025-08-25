'use client';

import React, { createContext, useState, useContext } from 'react';

const LayoutContext = createContext();

export const useLayout = () => useContext(LayoutContext);

export const LayoutProvider = ({ children }) => {
  const [isCreateCourseModalOpen, setIsCreateCourseModalOpen] = useState(false);
  const [isJoinCourseModalOpen, setIsJoinCourseModalOpen] = useState(false);

  const openCreateCourseModal = () => setIsCreateCourseModalOpen(true);
  const closeCreateCourseModal = () => setIsCreateCourseModalOpen(false);

  const openJoinCourseModal = () => setIsJoinCourseModalOpen(true);
  const closeJoinCourseModal = () => setIsJoinCourseModalOpen(false);

  return (
    <LayoutContext.Provider
      value={{
        isCreateCourseModalOpen,
        openCreateCourseModal,
        closeCreateCourseModal,
        isJoinCourseModalOpen,
        openJoinCourseModal,
        closeJoinCourseModal,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};