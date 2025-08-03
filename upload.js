document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const browseBtn = document.getElementById('browseBtn');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadProgress = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressPercent = document.getElementById('progressPercent');
    const fileName = document.getElementById('fileName');
    
    let selectedFile = null;
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropZone.classList.add('highlight');
    }
    
    function unhighlight() {
        dropZone.classList.remove('highlight');
    }
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            handleFiles(files);
        }
    }
    
    // Browse files
    browseBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files);
        }
    });
    
    // Handle selected files
    function handleFiles(files) {
        if (files.length > 1) {
            alert('Please upload one file at a time.');
            return;
        }
        
        const file = files[0];
        const validTypes = ['application/pdf', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-powerpoint',
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                          'text/plain'];
        
        if (!validTypes.includes(file.type)) {
            alert('Please upload a valid file type (PDF, DOC, DOCX, PPT, PPTX, TXT).');
            return;
        }
        
        if (file.size > 20 * 1024 * 1024) {
            alert('File size exceeds 20MB limit.');
            return;
        }
        
        selectedFile = file;
        fileName.textContent = file.name;
        uploadBtn.disabled = false;
        
        // Show file info
        dropZone.innerHTML = `
            <i class="fas fa-file-alt"></i>
            <h3>${file.name}</h3>
            <p>${formatFileSize(file.size)}</p>
        `;
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Upload file
    uploadBtn.addEventListener('click', () => {
        if (!selectedFile) return;
        
        const title = document.getElementById('title').value.trim();
        const description = document.getElementById('description').value.trim();
        const category = document.getElementById('category').value;
        const tags = document.getElementById('tags').value.trim();
        
        if (!title) {
            alert('Please enter a title for your material.');
            return;
        }
        
        if (!category) {
            alert('Please select a category.');
            return;
        }
        
        uploadBtn.disabled = true;
        uploadProgress.style.display = 'block';
        
        const metadata = {
            customMetadata: {
                title,
                description,
                category,
                tags
            }
        };
        
        const uploadTask = uploadMaterial(selectedFile, metadata);
        
        uploadTask.on('state_changed', 
            (snapshot) => {
                // Progress
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
                progressPercent.textContent = Math.round(progress) + '%';
            },
            (error) => {
                // Error
                console.error('Upload error:', error);
                alert('Upload failed. Please try again.');
                resetUploadForm();
            },
            () => {
                // Complete
                uploadTask.snapshot.ref.getDownloadURL().then((downloadURL) => {
                    const materialData = {
                        title,
                        description,
                        category,
                        tags: tags.split(',').map(tag => tag.trim()),
                        fileUrl: downloadURL,
                        fileName: selectedFile.name,
                        fileType: selectedFile.type,
                        fileSize: selectedFile.size,
                        uploadDate: firebase.firestore.FieldValue.serverTimestamp(),
                        uploader: auth.currentUser ? auth.currentUser.uid : 'anonymous',
                        downloads: 0,
                        rating: 0,
                        ratingCount: 0
                    };
                    
                    addMaterialToFirestore(materialData)
                        .then(() => {
                            alert('Upload successful! Your material is now available to the community.');
                            resetUploadForm();
                        })
                        .catch(error => {
                            console.error('Error adding document:', error);
                            alert('There was an error saving your material details. The file was uploaded but may not appear in listings.');
                            resetUploadForm();
                        });
                });
            }
        );
    });
    
    function resetUploadForm() {
        selectedFile = null;
        fileInput.value = '';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('category').value = '';
        document.getElementById('tags').value = '';
        progressBar.style.width = '0%';
        progressPercent.textContent = '0%';
        uploadProgress.style.display = 'none';
        uploadBtn.disabled = true;
        
        dropZone.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <h3>Drag & Drop your files here</h3>
            <p>or</p>
            <button class="btn-primary" id="browseBtn">Browse Files</button>
        `;
        
        // Reattach event listeners
        document.getElementById('browseBtn').addEventListener('click', () => {
            fileInput.click();
        });
    }
});