"use client";

import React from "react";

interface ModalProps {
    isOpen: boolean;
    title: string;
    children: React.ReactNode;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose }) => {
    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
                    {/* Header */}
                    <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {title}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">{children}</div>
                </div>
            </div>
        </>
    );
};

export default Modal;
