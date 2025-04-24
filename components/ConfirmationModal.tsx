// components/ConfirmationModal.tsx
'use client';

import React, { Fragment, useEffect, useState } from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean; // Per gestire lo stato di caricamento
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Conferma",
  cancelText = "Annulla",
  isConfirming = false
}) => {
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Gestisci l'apertura del modale
  useEffect(() => {
    if (isOpen && !showModal) {
      setShowModal(true);
      // Inizia l'animazione di entrata dopo un breve delay per garantire che il DOM sia aggiornato
      setTimeout(() => setIsAnimatingIn(true), 10);
    } else if (!isOpen && showModal) {
      // Avvia l'animazione di uscita
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      // Rimuovi il modale dal DOM dopo che l'animazione di uscita è completata
      setTimeout(() => {
        setIsAnimatingOut(false);
        setShowModal(false);
      }, 300); // Deve corrispondere alla durata dell'animazione
    }
  }, [isOpen, showModal]);

  // Funzione per gestire la chiusura del modale con animazione
  const handleClose = () => {
    if (isConfirming) return; // Non permettere la chiusura durante la conferma
    if (!isAnimatingOut) {
      setIsAnimatingIn(false);
      setIsAnimatingOut(true);
      // Chiama onClose dopo che l'animazione di uscita è completata
      setTimeout(() => {
        onClose();
      }, 250);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay scuro con animazione di fade */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out ${
          isAnimatingIn ? 'opacity-70' : isAnimatingOut ? 'opacity-0' : 'opacity-0'
        }`}
        onClick={handleClose}
      ></div>
      
      {/* Contenitore centrale del modal con animazione di slide e fade */}
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div 
          className={`relative transform overflow-hidden rounded-lg bg-[#2C2F33] text-left shadow-xl transition-all duration-300 ease-in-out sm:my-8 sm:w-full sm:max-w-lg ${
            isAnimatingIn 
              ? 'opacity-100 translate-y-0' 
              : isAnimatingOut 
                ? 'opacity-0 -translate-y-4' 
                : 'opacity-0 -translate-y-8'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header del modal */}
          <div className="px-6 py-4 border-b border-[#1E2124]">
            <h3 className="text-lg font-medium text-white">
              {title}
            </h3>
          </div>
          
          {/* Corpo del modal */}
          <div className="px-6 py-4">
            <p className="text-sm text-gray-300">
              {message}
            </p>
          </div>
          
          {/* Footer con pulsanti */}
          <div className="bg-[#36393E] px-6 py-3 flex flex-row-reverse gap-2">
            <button
              type="button"
              className={`inline-flex justify-center rounded-md px-4 py-2 text-sm font-medium ${
                isConfirming 
                  ? 'bg-gray-700 text-gray-300 cursor-not-allowed' 
                  : 'bg-red-600 text-white hover:bg-red-700 cursor-pointer'
              } transition-colors`}
              onClick={onConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <Fragment>
                  <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                  Rimozione...
                </Fragment>
              ) : (
                confirmText
              )}
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-600 bg-[#2C2F33] px-4 py-2 text-sm font-medium text-white hover:bg-[#36393E] cursor-pointer transition-colors"
              onClick={handleClose}
              disabled={isConfirming}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;