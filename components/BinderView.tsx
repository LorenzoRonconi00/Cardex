'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { useParams, useRouter } from 'next/navigation';
import HTMLFlipBook from 'react-pageflip';
import BinderSlot from './BinderSlot';
import CardSelectionModal from './CardSelectionModal';
import { Card } from '@/lib/types';
import CardPreviewModal from './CardPreviewModal';

// Definizione delle props per le pagine
type PageProps = {
    pageNumber: number;
    startingSlot: number;
};

type CoverProps = {
    color: string;
    name: string;
};

// Componente per le pagine standard del raccoglitore
const BinderPage = React.forwardRef<HTMLDivElement, PageProps>((props, ref) => {
    const { pageNumber, startingSlot } = props;
    const params = useParams();
    const binderId = params.id as string;
    
    // State per lo slot selezionato e i modal
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewCard, setPreviewCard] = useState<Card | null>(null);
    const [previewSlot, setPreviewSlot] = useState<number | null>(null);
    
    // State per le carte nei slot e le animazioni
    const [slotCards, setSlotCards] = useState<{[slotNumber: number]: Card | null}>({});
    const [newlyAddedSlots, setNewlyAddedSlots] = useState<Set<number>>(new Set());
    
    // Query per caricare i dati degli slot
    const { data: binderSlotsData, isLoading: isLoadingSlots, refetch: refetchSlots } = useQuery({
        queryKey: ['binderSlots', binderId],
        queryFn: async () => {
            const response = await fetch(`/api/binders/${binderId}/slots`);
            if (!response.ok) {
                throw new Error('Failed to fetch binder slots');
            }
            const result = await response.json();
            return result.success ? result.data : [];
        },
        enabled: !!binderId // Esegui solo se binderId esiste
    });
    
    // Aggiorna lo state delle carte negli slot quando i dati vengono caricati
    useEffect(() => {
        if (binderSlotsData && Array.isArray(binderSlotsData)) {
            const newSlotCards: {[slotNumber: number]: Card | null} = {};
            binderSlotsData.forEach((slot: any) => {
                if (slot.slotNumber && slot.card) {
                    newSlotCards[slot.slotNumber] = slot.card;
                }
            });
            setSlotCards(newSlotCards);
        }
    }, [binderSlotsData]);
    
    // Ottieni gli ID delle carte già inserite nel binder
    const existingCardIds = useMemo(() => {
        return Object.values(slotCards)
            .filter(card => card !== null)
            .map(card => card!.id);
    }, [slotCards]);
    
    // Gestisce il click su uno slot vuoto per aprire il modal di selezione
    const handleSlotClick = (slotNumber: number) => {
        setSelectedSlot(slotNumber);
        setIsModalOpen(true);
    };
    
    // Gestisce il click su una carta inserita per aprire la preview
    const handleCardPreview = (card: Card, slotNumber: number) => {
        setPreviewCard(card);
        setPreviewSlot(slotNumber);
    };
    
    // Gestisce la selezione di una carta dal modal
    const handleCardSelect = async (card: Card) => {
        if (selectedSlot === null) return;
        
        try {
            // Invia la richiesta API per aggiungere la carta allo slot
            const response = await fetch(`/api/binders/${binderId}/slots`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    slotNumber: selectedSlot,
                    cardId: card.id
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to add card to slot');
            }
            
            // Aggiorna lo state locale
            setSlotCards(prev => ({
                ...prev,
                [selectedSlot]: card
            }));
            
            // Marca questo slot come appena aggiunto per l'animazione
            setNewlyAddedSlots(prev => new Set(prev).add(selectedSlot));
            
            // Imposta un timer per rimuovere il flag di "appena aggiunto" dopo l'animazione
            setTimeout(() => {
                setNewlyAddedSlots(prev => {
                    const updated = new Set(prev);
                    updated.delete(selectedSlot);
                    return updated;
                });
            }, 1000); // Durata dell'animazione + un piccolo margine
            
            // Chiude il modal
            setIsModalOpen(false);
            setSelectedSlot(null);
            
            // Ricarica i dati degli slot
            refetchSlots();
            
        } catch (error) {
            console.error('Error adding card to slot:', error);
            
            // Chiude il modal anche in caso di errore
            setIsModalOpen(false);
            setSelectedSlot(null);
        }
    };
    
    // Gestisce la rimozione di una carta da uno slot
    const handleRemoveCard = async (slotNumber: number) => {
        try {
            // Invia la richiesta API per rimuovere la carta dallo slot
            const response = await fetch(`/api/binders/${binderId}/slots/${slotNumber}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error('Failed to remove card from slot');
            }
            
            // Aggiorna lo state locale
            setSlotCards(prev => {
                const newState = { ...prev };
                delete newState[slotNumber];
                return newState;
            });
            
            // Ricarica i dati degli slot
            refetchSlots();
            
        } catch (error) {
            console.error('Error removing card from slot:', error);
        }
    };
    
    return (
        <div ref={ref} className="binder-page h-full w-full bg-[#1a1a1a]">
            <div className="h-full w-full p-6">
                {/* Griglia 4x3 per le tasche del raccoglitore (4 colonne, 3 righe) */}
                <div className="grid grid-cols-4 grid-rows-3 gap-2 h-full w-full">
                    {Array(12).fill(0).map((_, index) => {
                        const slotNumber = startingSlot + index;
                        return (
                            <BinderSlot
                                key={index}
                                slotNumber={slotNumber}
                                card={slotCards[slotNumber] || null}
                                onSlotClick={handleSlotClick}
                                onCardPreview={handleCardPreview}
                                isNewlyAdded={newlyAddedSlots.has(slotNumber)}
                            />
                        );
                    })}
                </div>

                {/* Numero pagina */}
                <div className={`absolute bottom-2 ${pageNumber % 2 === 0 ? 'right-2' : 'left-2'} text-[#555555] text-xs`}>
                    {pageNumber}
                </div>
            </div>
            
            {/* Card Selection Modal */}
            {isModalOpen && selectedSlot !== null && (
                <CardSelectionModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedSlot(null);
                    }}
                    onSelectCard={handleCardSelect}
                    slotNumber={selectedSlot}
                    existingCardIds={existingCardIds}
                />
            )}
            
            {/* Card Preview Modal */}
            {previewCard && previewSlot !== null && (
                <CardPreviewModal
                    isOpen={!!previewCard}
                    onClose={() => {
                        setPreviewCard(null);
                        setPreviewSlot(null);
                    }}
                    card={previewCard}
                    slotNumber={previewSlot}
                    onRemoveCard={handleRemoveCard}
                />
            )}
        </div>
    );
});


BinderPage.displayName = 'BinderPage';

// Componente per la copertina
const CoverPage = React.forwardRef<HTMLDivElement, CoverProps>((props, ref) => {
    const { color, name } = props;

    return (
        <div
            ref={ref}
            className="h-full w-full"
        >
            <div
                className="h-full w-full flex items-center justify-center relative"
                style={{ backgroundColor: color }}
            >
                <div className="cover-content text-center">
                    <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-bold mb-2 tracking-wide">
                        {name}
                    </h1>
                    <p className="text-white text-sm sm:text-base opacity-70">Cardora</p>
                </div>

                {/* Texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "url('data:image/png;base64,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')",
                        opacity: 0.05
                    }}
                ></div>

                {/* Border effect */}
                <div className="absolute inset-0 pointer-events-none border-8 border-black border-opacity-20"></div>
            </div>
        </div>
    );
});

CoverPage.displayName = 'CoverPage';

// Componente per il retro del raccoglitore (ultima pagina)
const BackCoverPage = React.forwardRef<HTMLDivElement, { color: string }>((props, ref) => {
    const { color } = props;

    return (
        <div
            ref={ref}
            className="h-full w-full"
        >
            <div
                className="h-full w-full flex items-center justify-center relative"
                style={{ backgroundColor: color }}
            >
                {/* Texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAAUVBMVEWFhYWDg4N3d3dtbW17e3t1dXWBgYGHh4d5eXlzc3OLi4ubm5uVlZWPj4+NjY19fX2JiYl/f39ra2uRkZGZmZlpaWmXl5dvb29xcXGTk5NnZ2c8TV1mAAAAG3RSTlNAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEAvEOwtAAAFVklEQVR4XpWWB67c2BUFb3g557T/hRo9/WUMZHlgr4Bg8Z4qQgQJlHI4A8SzFVrapvmTF9O7dmYRFZ60YiBhJRCgh1FYhiLAmdvX0CzTOpNE77ME0Zty/nWWzchDtiqrmQDeuv3powQ5ta2eN0FY0InkqDD73lT9c9lEzwUNqgFHs9VQce3TVClFCQrSTfOiYkVJQBmpbq2L6iZavPnAPcoU0dSw0SUTqz/GtrGuXfbyyBniKykOWQWGqwwMA7QiYAxi+IlPdqo+hYHnUt5ZPfnsHJyNiDtnpJyayNBkF6cWoYGAMY92U2hXHF/C1M8uP/ZtYdiuj26UdAdQQSXQErwSOMzt/XWRWAz5GuSBIkwG1H3FabJ2OsUOUhGC6tK4EMtJO0ttC6IBD3kM0ve0tJwMdSfjZo+EEISaeTr9P3wYrGjXqyC1krcKdhMpxEnt5JetoulscpyzhXN5FRpuPHvbeQaKxFAEB6EN+cYN6xD7RYGpXpNndMmZgM5Dcs3YSNFDHUo2LGfZuukSWyUYirJAdYbF3MfqEKmjM+I2EfhA94iG3L7uKrR+GdWD73ydlIB+6hgref1QTlmgmbM3/LeX5GI1Ux1RWpgxpLuZ2+I+IjzZ8wqE4nilvQdkUdfhzI5QDWy+kw5Wgg2pGpeEVeCCA7b85BO3F9DzxB3cdqvBzWcmzbyMiqhzuYqtHRVG2y4x+KOlnyqla8AoWWpuBoYRxzXrfKuILl6SfiWCbjxoZJUaCBj1CjH7GIaDbc9kqBY3W/Rgjda1iqQcOJu2WW+76pZC9QG7M00dffe9hNnseupFL53r8F7YHSwJWUKP2q+k7RdsxyOB11n0xtOvnW4irMMFNV4H0uqwS5ExsmP9AxbDTc9JwgneAT5vTiUSm1E7BSflSt3bfa1tv8Di3R8n3Af7MNWzs49hmauE2wP+ttrq+AsWpFG2awvsuOqbipWHgtuvuaAE+A1Z/7gC9hesnr+7wqCwG8c5yAg3AL1fm8T9AZtp/bbJGwl1pNrE7RuOX7PeMRUERVaPpEs+yqeoSmuOlokqw49pgomjLeh7icHNlG19yjs6XXOMedYm5xH2YxpV2tc0Ro2jJfxC50ApuxGob7lMsxfTbeUv07TyYxpeLucEH1gNd4IKH2LAg5TdVhlCafZvpskfncCfx8pOhJzd76bJWeYFnFciwcYfubRc12Ip/ppIhA1/mSZ/RxjFDrJC5xifFjJpY2Xl5zXdguFqYyTR1zSp1Y9p+tktDYYSNflcxI0iyO4TPBdlRcpeqjK/piF5bklq77VSEaA+z8qmJTFzIWiitbnzR794USKBUaT0NTEsVjZqLaFVqJoPN9ODG70IPbfBHKK+/q/AWR0tJzYHRULOa4MP+W/HfGadZUbfw177G7j/OGbIs8TahLyynl4X4RinF793Oz+BU0saXtUHrVBFT/DnA3ctNPoGbs4hRIjTok8i+algT1lTHi4SxFvONKNrgQFAq2/gFnWMXgwffgYMJpiKYkmW3tTg3ZQ9Jq+f8XN+A5eeUKHWvJWJ2sgJ1Sop+wwhqFVijqWaJhwtD8MNlSBeWNNWTa5Z5kPZw5+LbVT99wqTdx29lMUH4OIG/D86ruKEauBjvH5xy6um/Sfj7ei6UUVk4AIl3MyD4MSSTOFgSwsH/QJWaQ5as7ZcmgBZkzjjU1UrQ74ci1gWBCSGHtuV1H2mhSnO3Wp/3fEV5a+4wz//6qy8JxjZsmxxy5+4w9CDNJY09T072iKG0EnOS0arEYgXqYnXcYHwjTtUNAcMelOd4xpkoqiTYICWFq0JSiPfPDQdnt+4/wuqcXY47QILbgAAAABJRU5ErkJggg==')",
                        opacity: 0.05
                    }}
                ></div>

                {/* Border effect */}
                <div className="absolute inset-0 pointer-events-none border-8 border-black border-opacity-20"></div>
            </div>
        </div>
    );
});

BackCoverPage.displayName = 'BackCoverPage';

// Componente principale per la visualizzazione del binder
const BinderView: React.FC = () => {
    const params = useParams();
    const binderId = params.id as string;
    const router = useRouter();

    // Riferimento al libro per controllarlo programmaticamente
    const bookRef = useRef<any>(null);

    // Stato per tenere traccia della pagina corrente
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Funzioni per navigare tra le pagine
    const goToPrevPage = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipPrev();
        }
    };

    const goToNextPage = () => {
        if (bookRef.current) {
            bookRef.current.pageFlip().flipNext();
        }
    };

    // Handler per gli eventi di cambio pagina
    const handleFlip = (e: any) => {
        setCurrentPage(e.data);
    };

    // State per le dimensioni del libro
    const [bookDimensions, setBookDimensions] = useState({
        width: 1600,
        height: 800
    });

    // Numero totale di pagine (incluse copertina e retrocopertina)
    const numPages = 7; // 1 copertina + 5 pagine interne + 1 retrocopertina

    // Crea i ref per le pagine
    const coverRef = useRef<HTMLDivElement>(null);
    const page1Ref = useRef<HTMLDivElement>(null);
    const page2Ref = useRef<HTMLDivElement>(null);
    const page3Ref = useRef<HTMLDivElement>(null);
    const page4Ref = useRef<HTMLDivElement>(null);
    const page5Ref = useRef<HTMLDivElement>(null);
    const page6Ref = useRef<HTMLDivElement>(null);
    const backCoverRef = useRef<HTMLDivElement>(null);

    // Aggiorna le dimensioni in base alla larghezza della finestra
    useEffect(() => {
        const updateDimensions = () => {
            const width = window.innerWidth;

            if (width < 640) { // Mobile
                setBookDimensions({
                    width: 400,
                    height: 420
                });
            } else if (width < 768) { // Tablet piccolo
                setBookDimensions({
                    width: 600,
                    height: 560
                });
            } else if (width < 1024) { // Tablet grande
                setBookDimensions({
                    width: 700,
                    height: 700
                });
            } else { // Desktop
                setBookDimensions({
                    width: 1600,
                    height: 840
                });
            }
        };

        // Imposta le dimensioni iniziali
        updateDimensions();

        // Aggiungi listener per il resize
        window.addEventListener('resize', updateDimensions);

        // Cleanup
        return () => window.removeEventListener('resize', updateDimensions);
    }, []);

    // Funzione per tornare alla pagina precedente
    const handleGoBack = () => {
        router.back();
    };

    // Fetch binder details
    const { data, isLoading, isError } = useQuery({
        queryKey: ['binder', binderId],
        queryFn: async () => {
            const response = await fetch(`/api/binders/${binderId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch binder');
            }
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch binder');
            }

            return result.data;
        }
    });

    const binder = data;

    // Stato di caricamento
    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center h-64">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    // Stato di errore
    if (isError || !binder) {
        return (
            <Layout>
                <div className="bg-red-500 bg-opacity-20 border border-red-500 text-red-100 px-4 py-3 rounded">
                    Errore nel caricamento del raccoglitore. Riprova più tardi.
                </div>
            </Layout>
        );
    }

    // Visualizzazione del binder
    return (
        <Layout>
            <div className="w-full px-4 sm:px-6 py-6">
                {/* Pulsante per tornare indietro */}
                <button
                    onClick={handleGoBack}
                    className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
                    aria-label="Torna indietro"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 19l-7-7m0 0l7-7m-7 7h18"
                        />
                    </svg>
                    <span>Torna alla raccolta</span>
                </button>

                {/* Titolo del binder con il colore personalizzato */}
                <h1
                    className="text-2xl font-bold text-white mb-6 pb-2 border-b-2"
                    style={{ borderColor: binder.color }}
                >
                    {binder.name}
                </h1>

                {/* Contenuto del binder */}
                <div className="bg-[#2F3136] rounded-lg p-2 sm:p-4 md:p-6 flex justify-center overflow-hidden">
                    <div className="relative mb-20" style={{ width: bookDimensions.width, height: bookDimensions.height }}>
                        <HTMLFlipBook
                            width={bookDimensions.width / 2}
                            height={bookDimensions.height}
                            maxShadowOpacity={0.5}
                            showCover={true}
                            size="fixed"
                            minWidth={bookDimensions.width / 2}
                            maxWidth={bookDimensions.width / 2}
                            minHeight={bookDimensions.height}
                            maxHeight={bookDimensions.height}
                            startPage={0}
                            drawShadow={true}
                            flippingTime={1000}
                            usePortrait={false}
                            startZIndex={0}
                            autoSize={false}

                            // Proprietà per disabilitare tutte le interazioni
                            disableFlipByClick={true}       // Disabilita il click per cambiare pagina
                            useMouseEvents={false}          // Disabilita completamente gli eventi del mouse
                            swipeDistance={999999}          // Richiede uno swipe impossibile
                            clickEventForward={false}       // Non inoltra gli eventi di click
                            showPageCorners={false}         // Rimuove gli angoli interattivi
                            mobileScrollSupport={false}     // Disabilita il supporto per lo scroll

                            ref={bookRef}
                            onFlip={handleFlip}
                            onInit={(e: any) => setTotalPages(e.data.pages.length)}
                        >
                            {/* Copertina */}
                            <CoverPage ref={coverRef} color={binder.color} name={binder.name} />

                            {/* Pagine interne */}
                            <BinderPage ref={page1Ref} pageNumber={1} startingSlot={1} />
                            <BinderPage ref={page2Ref} pageNumber={2} startingSlot={13} />
                            <BinderPage ref={page3Ref} pageNumber={3} startingSlot={25} />
                            <BinderPage ref={page4Ref} pageNumber={4} startingSlot={37} />
                            <BinderPage ref={page5Ref} pageNumber={5} startingSlot={49} />
                            <BinderPage ref={page6Ref} pageNumber={6} startingSlot={61} />

                            {/* Retrocopertina */}
                            <BackCoverPage ref={backCoverRef} color={binder.color} />
                        </HTMLFlipBook>

                        {/* Controlli di navigazione */}
                        <div className="absolute -bottom-16 left-0 right-0 flex justify-center items-center space-x-6">
                            <button
                                onClick={goToPrevPage}
                                disabled={currentPage === 0}
                                className={`nav-button flex items-center justify-center w-12 h-12 rounded-full ${currentPage === 0
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#36393E] text-white hover:bg-[#4a4d52] transition-colors'
                                    }`}
                                aria-label="Pagina precedente"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>

                            <button
                                onClick={goToNextPage}
                                disabled={currentPage === totalPages - 1}
                                className={`nav-button flex items-center justify-center w-12 h-12 rounded-full ${currentPage === totalPages - 1
                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    : 'bg-[#36393E] text-white hover:bg-[#4a4d52] transition-colors'
                                    }`}
                                aria-label="Pagina successiva"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Istruzioni */}
                <div className="mt-8 text-center text-gray-400">
                    <p className="text-sm">Usa le frecce per sfogliare le pagine</p>
                </div>
            </div>

            {/* CSS personalizzato per l'aspetto del raccoglitore */}
            <style jsx global>{`
        .binder-page {
          background-color: #151515;
        }
        
        .pocket {
          transition: all 0.2s ease;
          position: relative;
        }
        
        .pocket:hover {
          transform: scale(1.02);
          box-shadow: 0 0 5px rgba(255,255,255,0.2);
        }
        
        .pocket::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 2px;
          pointer-events: none;
        }
        
        .card-placeholder {
          color: #555555;
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
          white-space: nowrap;
        }
        
        /* Migliora la visibilità dei bordi tratteggiati */
        .border-dashed {
          border-width: 1px;
          border-style: dashed;
          border-color: #444444;
        }
        
        /* Stili per i controlli di navigazione */
        .nav-button {
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .nav-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        }
        
        .nav-button:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }
        
        .page-indicator {
          background-color: rgba(54, 57, 62, 0.7);
          padding: 4px 12px;
          border-radius: 12px;
          font-weight: 500;
        }

        @keyframes card-enter {
  0% {
    transform: translateY(-30px) scale(0.8);
    opacity: 0;
  }
  70% {
    transform: translateY(5px) scale(1.05);
    opacity: 0.7;
  }
  100% {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.animate-card-enter {
  animation: card-enter 0.5s ease forwards;
}

/* Il resto degli stili rimane invariato */
.pocket {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.pocket:hover {
  transform: scale(1.02);
  box-shadow: 0 0 8px rgba(255,255,255,0.2);
}

.pocket-filled {
  background-color: #1a1a1a;
}

.pocket-filled:hover {
  transform: scale(1.03);
  box-shadow: 0 0 10px rgba(255,255,255,0.3);
}

.card-container {
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

/* Migliora l'aspetto del modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.75);
  z-index: 50;
  backdrop-filter: blur(2px);
}

.modal-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: #2A2D31;
  border-radius: 0.5rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
  z-index: 60;
  overflow: hidden;
}

/* Stile per placeholder delle tasche vuote */
.card-placeholder {
  font-weight: 500;
  opacity: 0.6;
  letter-spacing: 0.05em;
}
      `}</style>
        </Layout>
    );
};

export default BinderView;