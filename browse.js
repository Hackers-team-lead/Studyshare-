document.addEventListener('DOMContentLoaded', () => {
    const materialsGrid = document.getElementById('materialsGrid');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const resultsCount = document.getElementById('resultsCount');
    const previewModal = document.getElementById('previewModal');
    const closeModal = document.querySelector('.close-modal');
    const downloadBtn = document.getElementById('downloadBtn');
    
    let lastVisible = null;
    let currentMaterialId = null;
    let isLoading = false;
    
    // Initialize PDF.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';
    
    // Load initial materials
    loadMaterials();
    
    // Event listeners for filters
    searchBtn.addEventListener('click', () => {
        lastVisible = null;
        materialsGrid.innerHTML = createSkeletonCards(6);
        loadMaterials();
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            lastVisible = null;
            materialsGrid.innerHTML = createSkeletonCards(6);
            loadMaterials();
        }
    });
    
    categoryFilter.addEventListener('change', () => {
        lastVisible = null;
        materialsGrid.innerHTML = createSkeletonCards(6);
        loadMaterials();
    });
    
    sortBy.addEventListener('change', () => {
        lastVisible = null;
        materialsGrid.innerHTML = createSkeletonCards(6);
        loadMaterials();
    });
    
    loadMoreBtn.addEventListener('click', loadMaterials);
    
    // Close modal
    closeModal.addEventListener('click', () => {
        previewModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = 'none';
        }
    });
    
    // Download button
    downloadBtn.addEventListener('click', () => {
        if (currentMaterialId) {
            incrementDownloadCount(currentMaterialId)
                .then(() => {
                    // Get the download URL again in case it changed
                    getMaterial(currentMaterialId)
                        .then(material => {
                            const link = document.createElement('a');
                            link.href = material.fileUrl;
                            link.download = material.fileName || 'download';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        });
                })
                .catch(error => {
                    console.error('Error recording download:', error);
                });
        }
    });
    
    // Load materials from Firestore
    function loadMaterials() {
        if (isLoading) return;
        
        isLoading = true;
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'Loading...';
        
        const searchQuery = searchInput.value.trim();
        const category = categoryFilter.value;
        const sortOption = sortBy.value;
        
        let query = db.collection('materials');
        
        // Apply filters
        if (category) {
            query = query.where('category', '==', category);
        }
        
        if (searchQuery) {
            query = query.orderBy('title').startAt(searchQuery).endAt(searchQuery + '\uf8ff');
        }
        
        // Apply sorting
        switch (sortOption) {
            case 'newest':
                query = query.orderBy('uploadDate', 'desc');
                break;
            case 'oldest':
                query = query.orderBy('uploadDate', 'asc');
                break;
            case 'popular':
                query = query.orderBy('downloads', 'desc');
                break;
            case 'rating':
                query = query.orderBy('rating', 'desc');
                break;
        }
        
        // Pagination
        if (lastVisible) {
            query = query.startAfter(lastVisible);
        }
        
        query.limit(6).get()
            .then(querySnapshot => {
                if (querySnapshot.empty && lastVisible === null) {
                    materialsGrid.innerHTML = '<p class="no-results">No materials found. Try different search criteria.</p>';
                    resultsCount.textContent = '0 materials found';
                    return;
                }
                
                if (lastVisible === null) {
                    materialsGrid.innerHTML = '';
                }
                
                querySnapshot.forEach(doc => {
                    const material = { id: doc.id, ...doc.data() };
                    renderMaterialCard(material);
                });
                
                // Update last visible for pagination
                lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];
                
                // Update results count
                if (lastVisible === null || querySnapshot.size < 6) {
                    loadMoreBtn.style.display = 'none';
                } else {
                    loadMoreBtn.style.display = 'block';
                }
                
                // Update count (this is approximate since we're not counting all)
                if (lastVisible === null) {
                    resultsCount.textContent = `${querySnapshot.size} materials found`;
                } else {
                    resultsCount.textContent = `Showing ${materialsGrid.children.length} materials`;
                }
            })
            .catch(error => {
                console.error('Error getting materials:', error);
                materialsGrid.innerHTML = '<p class="error-message">Error loading materials. Please try again later.</p>';
            })
            .finally(() => {
                isLoading = false;
                loadMoreBtn.disabled = false;
                loadMoreBtn.textContent = 'Load More';
            });
    }
    
    // Render material card
    function renderMaterialCard(material) {
        const card = document.createElement('div');
        card.className = 'material-card animate__animated animate__fadeIn';
        card.dataset.id = material.id;
        
        const icon = getFileIcon(material.fileType);
        const uploadDate = material.uploadDate ? formatDate(material.uploadDate.toDate()) : 'Unknown date';
        
        card.innerHTML = `
            <div class="material-thumbnail">
                <img src="assets/${icon}" alt="${material.fileType}">
            </div>
            <div class="material-info">
                <h3>${material.title}</h3>
                <p class="material-meta">${material.category} • ${uploadDate} • ${material.rating ? material.rating.toFixed(1) + ' ★' : 'Not rated'}</p>
                <button class="btn-download">Preview & Download</button>
            </div>
        `;
        
        card.querySelector('.btn-download').addEventListener('click', () => {
            showMaterialPreview(material.id);
        });
        
        materialsGrid.appendChild(card);
    }
    
    // Show material preview
    function showMaterialPreview(materialId) {
        currentMaterialId = materialId;
        
        getMaterial(materialId)
            .then(material => {
                // Update modal content
                document.getElementById('modalTitle').textContent = material.title;
                document.getElementById('modalCategory').textContent = material.category;
                document.getElementById('modalDate').textContent = material.uploadDate ? formatDate(material.uploadDate.toDate()) : 'Unknown date';
                document.getElementById('modalRating').textContent = material.rating ? material.rating.toFixed(1) + ' ★' : 'Not rated';
                document.getElementById('modalDownloads').textContent = material.downloads ? material.downloads + ' downloads' : 'No downloads';
                document.getElementById('modalDescription').textContent = material.description || 'No description provided.';
                
                // Render tags
                const tagsContainer = document.getElementById('tagsContainer');
                tagsContainer.innerHTML = '';
                if (material.tags && material.tags.length > 0) {
                    material.tags.forEach(tag => {
                        const tagElement = document.createElement('span');
                        tagElement.className = 'tag';
                        tagElement.textContent = tag;
                        tagsContainer.appendChild(tagElement);
                    });
                } else {
                    tagsContainer.innerHTML = '<p>No tags</p>';
                }
                
                // Show preview based on file type
                const previewContainer = document.getElementById('previewContainer');
                previewContainer.innerHTML = '<p>Loading preview...</p>';
                
                if (material.fileType === 'application/pdf') {
                    renderPdfPreview(material.fileUrl, previewContainer);
                } else {
                    previewContainer.innerHTML = `
                        <div class="file-preview">
                            <i class="fas ${getFileIconClass(material.fileType)} fa-5x"></i>
                            <p>Preview not available for this file type</p>
                        </div>
                    `;
                }
                
                // Show modal
                previewModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error getting material:', error);
                alert('Error loading material details. Please try again.');
            });
    }
    
    // Render PDF preview
    function renderPdfPreview(url, container) {
        container.innerHTML = '<canvas id="pdfCanvas"></canvas>';
        const canvas = document.getElementById('pdfCanvas');
        
        // Load the PDF
        pdfjsLib.getDocument(url).promise
            .then(pdf => {
                return pdf.getPage(1);
            })
            .then(page => {
                const viewport = page.getViewport({ scale: 1.0 });
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                const renderContext = {
                    canvasContext: canvas.getContext('2d'),
                    viewport: viewport
                };
                
                return page.render(renderContext).promise;
            })
            .catch(error => {
                console.error('PDF preview error:', error);
                container.innerHTML = `
                    <div class="file-preview">
                        <i class="fas fa-file-pdf fa-5x"></i>
                        <p>Error loading PDF preview</p>
                    </div>
                `;
            });
    }
    
    // Helper functions
    function getFileIcon(fileType) {
        if (!fileType) return 'file-icon.png';
        
        if (fileType.includes('pdf')) return 'pdf-icon.png';
        if (fileType.includes('word')) return 'doc-icon.png';
        if (fileType.includes('powerpoint')) return 'ppt-icon.png';
        if (fileType.includes('plain')) return 'txt-icon.png';
        
        return 'file-icon.png';
    }
    
    function getFileIconClass(fileType) {
        if (!fileType) return 'fa-file';
        
        if (fileType.includes('pdf')) return 'fa-file-pdf';
        if (fileType.includes('word')) return 'fa-file-word';
        if (fileType.includes('powerpoint')) return 'fa-file-powerpoint';
        if (fileType.includes('plain')) return 'fa-file-alt';
        
        return 'fa-file';
    }
    
    function formatDate(date) {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
    
    function createSkeletonCards(count) {
        let html = '';
        for (let i = 0; i < count; i++) {
            html += `
                <div class="material-card skeleton">
                    <div class="material-thumbnail"></div>
                    <div class="material-info">
                        <h3></h3>
                        <p class="material-meta"></p>
                        <button class="btn-download"></button>
                    </div>
                </div>
            `;
        }
        return html;
    }
    
    // Get single material
    function getMaterial(materialId) {
        return db.collection('materials').doc(materialId).get()
            .then(doc => {
                if (doc.exists) {
                    return { id: doc.id, ...doc.data() };
                } else {
                    throw new Error('Material not found');
                }
            });
    }
});